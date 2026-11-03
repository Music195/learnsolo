import os
import re
import json
import logging
import requests
from models import DictionaryEntry

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


def detect_language(text: str) -> str:
    """
    Automatically detects whether the input is Burmese, Japanese, or English.
    Returns: 'my' (Burmese), 'ja' (Japanese), 'en' (English), or 'auto'
    """
    if not text:
        return "auto"

    # 1. Burmese (Myanmar Unicode script: 1000-109F, AA60-AA7F, A9E0-A9FF)
    if re.search(r"[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]", text):
        return "my"

    # 2. Japanese (Hiragana: 3040-309F, Katakana: 30A0-30FF, CJK Kanji: 4E00-9FAF, 3400-4DBF)
    if re.search(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]", text):
        return "ja"

    # 3. English / Latin script
    if re.search(r"[a-zA-Z]", text):
        return "en"

    return "auto"


def lookup_word(query: str, source_lang: str = "auto") -> dict:
    """
    Hybrid lookup with automatic language detection:
    1. Automatically detects input language if set to 'auto'.
    2. Checks the curated database first for a matching entry.
    3. If not found, falls back to AI or online translation dynamically
       (without adding unverified entries to the database).
    """
    clean_query = query.strip()
    if not clean_query:
        return {}

    # Auto-detect language if not explicitly provided
    if not source_lang or source_lang == "auto":
        detected = detect_language(clean_query)
        source_lang = detected if detected != "auto" else "en"
    else:
        detected = source_lang

    normalized = clean_query.lower()

    # 1. Search local curated database across English, Burmese, and Japanese
    existing = DictionaryEntry.query.filter(
        (DictionaryEntry.word == normalized) |
        (DictionaryEntry.english.ilike(clean_query)) |
        (DictionaryEntry.burmese.ilike(f"%{clean_query}%")) |
        (DictionaryEntry.japanese.ilike(f"%{clean_query}%"))
    ).first()

    if existing:
        return {
            "query": clean_query,
            "detected_lang": source_lang,
            "english": existing.english,
            "burmese": existing.burmese,
            "japanese": existing.japanese,
            "reading": existing.reading or "",
            "notes": existing.notes or "",
            "source": existing.source or "curated",
        }

    # 2. Not in database: fallback to AI / Online translation
    # Note: Does NOT add/insert to database upon translation.
    result = None
    if GEMINI_API_KEY:
        try:
            result = _translate_gemini(clean_query, source_lang)
        except Exception as e:
            logger.warning("Gemini translation failed, falling back to online: %s", e)

    if not result:
        result = _translate_online(clean_query, source_lang)

    result["detected_lang"] = source_lang
    return result


def _translate_online(query: str, source_lang: str) -> dict:
    """Free translation fallback across English, Burmese, and Japanese."""
    url = "https://translate.googleapis.com/translate_a/single"

    targets = {
        "en": "en",
        "my": "my",
        "ja": "ja",
    }

    results = {
        "query": query,
        "from": source_lang,
        "english": query if source_lang == "en" else "",
        "burmese": query if source_lang == "my" else "",
        "japanese": query if source_lang == "ja" else "",
        "reading": "",
        "notes": "",
        "source": "online",
    }

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})

    for lang_code in ("en", "my", "ja"):
        if lang_code == source_lang:
            continue
        try:
            params = {
                "client": "gtx",
                "sl": source_lang,
                "tl": targets[lang_code],
                "dt": "t",
                "q": query,
            }
            resp = session.get(url, params=params, timeout=5)
            if resp.ok:
                data = resp.json()
                translated_text = "".join([segment[0] for segment in data[0] if segment and segment[0]])
                if lang_code == "en":
                    results["english"] = translated_text
                elif lang_code == "my":
                    results["burmese"] = translated_text
                elif lang_code == "ja":
                    results["japanese"] = translated_text
        except Exception as e:
            logger.warning("Online translation to %s failed: %s", lang_code, e)

    return results


def _translate_gemini(query: str, source_lang: str) -> dict:
    """Translates and enriches using Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    prompt = f"""You are an educational trilingual dictionary assistant for students learning math, science, and general studies in English, Burmese, and Japanese.
Translate and define the word or phrase: "{query}" (Source language: {source_lang}).
Respond ONLY with a valid JSON object in this exact schema:
{{
  "english": "English term / definition",
  "burmese": "Burmese translation in Myanmar Unicode font",
  "japanese": "Japanese translation (Kanji/Kana)",
  "reading": "Hiragana reading or Furigana for Japanese",
  "notes": "Short educational context, part of speech, or note"
}}
Do NOT wrap in markdown backticks. Return raw JSON only."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    resp = requests.post(url, json=payload, timeout=8)
    if not resp.ok:
        raise RuntimeError(f"Gemini API returned status {resp.status_code}")

    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    parsed = json.loads(text.strip())
    parsed["query"] = query
    parsed["from"] = source_lang
    parsed["source"] = "ai"
    return parsed
