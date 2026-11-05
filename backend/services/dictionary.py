import os
import re
import json
import logging
import requests
from dotenv import load_dotenv
from models import DictionaryEntry

logger = logging.getLogger(__name__)

# Find .env in project root regardless of where python is executed from
_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_SERVICES_DIR))
_ENV_PATH = os.path.join(_PROJECT_ROOT, ".env")
if os.path.exists(_ENV_PATH):
    load_dotenv(_ENV_PATH)


def _get_api_keys():
    """Returns (groq_key, gemini_key), dynamically reloading .env if needed."""
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if (not groq_key or not gemini_key) and os.path.exists(_ENV_PATH):
        load_dotenv(_ENV_PATH, override=False)
        groq_key = os.environ.get("GROQ_API_KEY")
        gemini_key = os.environ.get("GEMINI_API_KEY")
    return groq_key, gemini_key


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
    2. Checks the curated database first for a matching entry (Tier 1).
    3. If not found in database, attempts AI translation:
       - Tier 2A: Groq AI (llama-3.3-70b-versatile, fast JSON mode) if GROQ_API_KEY is set.
       - Tier 2B: Gemini AI (gemini-2.0-flash) if GEMINI_API_KEY is set.
    4. If no AI keys are configured or AI fails, falls back to free MyMemory API (Tier 3).
       (Does NOT add unverified dynamic entries to the database).
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
    groq_key, gemini_key = _get_api_keys()

    # Tier 2A: Groq AI (llama-3.3-70b-versatile)
    if groq_key:
        try:
            result = _translate_groq(clean_query, source_lang, groq_key)
        except Exception as e:
            logger.warning("Groq translation failed, falling back: %s", e)

    # Tier 2B: Gemini AI (if Groq not configured or failed)
    if not result and gemini_key:
        try:
            result = _translate_gemini(clean_query, source_lang, gemini_key)
        except Exception as e:
            logger.warning("Gemini translation failed, falling back to online: %s", e)

    # Tier 3: Online translation fallback (MyMemory + Google)
    if not result:
        result = _translate_online(clean_query, source_lang)

    result["detected_lang"] = source_lang
    return result


def _translate_groq(query: str, source_lang: str, api_key: str = None) -> dict:
    """Translates and enriches using Groq API with JSON mode and multi-model fallback."""
    if not api_key:
        groq_key, _ = _get_api_keys()
        api_key = groq_key
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    system_prompt = (
        "You are an educational trilingual dictionary assistant for students learning math, science, "
        "and general studies in English, Burmese, and Japanese.\n"
        "Translate and define the given word or phrase across English, Burmese, and Japanese.\n"
        "Respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "english": "English term / definition",\n'
        '  "burmese": "Burmese translation in Myanmar Unicode font",\n'
        '  "japanese": "Japanese translation (Kanji/Kana)",\n'
        '  "reading": "Hiragana reading or Furigana for Japanese",\n'
        '  "notes": "Short educational context, part of speech, or note"\n'
        "}\n"
        "Do NOT wrap in markdown backticks. Return raw JSON only."
    )
    user_prompt = f'Translate and define the word or phrase: "{query}" (Source language: {source_lang}).'

    candidate_models = [m for m in [
        os.environ.get("GROQ_MODEL"),
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
    ] if m]

    last_error = None
    for model in candidate_models:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=8)
            if not resp.ok:
                last_error = f"Groq API ({model}) returned {resp.status_code}: {resp.text}"
                continue

            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            parsed = json.loads(text.strip())
            return {
                "query": query,
                "from": source_lang,
                "english": parsed.get("english", "") or (query if source_lang == "en" else ""),
                "burmese": parsed.get("burmese", "") or (query if source_lang == "my" else ""),
                "japanese": parsed.get("japanese", "") or (query if source_lang == "ja" else ""),
                "reading": parsed.get("reading", "") or "",
                "notes": parsed.get("notes", "") or "",
                "source": "ai",
            }
        except Exception as e:
            last_error = str(e)
            continue

    raise RuntimeError(f"All Groq candidate models failed. Last error: {last_error}")


def _translate_gemini(query: str, source_lang: str, api_key: str = None) -> dict:
    """Translates and enriches using Gemini API."""
    if not api_key:
        _, gemini_key = _get_api_keys()
        api_key = gemini_key
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
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


def _translate_online(query: str, source_lang: str) -> dict:
    """Free translation fallback across English, Burmese, and Japanese using MyMemory API with Google fallback."""
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
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    for lang_code in ("en", "my", "ja"):
        if lang_code == source_lang:
            continue
        translated_text = ""
        # 1. Try MyMemory API (free, reliable translation across EN, MY, JA)
        try:
            pair = f"{source_lang}|{lang_code}"
            mm_resp = session.get(
                "https://api.mymemory.translated.net/get",
                params={"q": query, "langpair": pair},
                timeout=5,
            )
            if mm_resp.ok:
                mm_data = mm_resp.json()
                candidate = mm_data.get("responseData", {}).get("translatedText", "").strip()
                if candidate and not candidate.startswith("MYMEMORY WARNING"):
                    translated_text = candidate
        except Exception as e:
            logger.warning("MyMemory translation to %s failed: %s", lang_code, e)

        # 2. Secondary fallback: Google translate_a
        if not translated_text:
            try:
                g_url = "https://translate.googleapis.com/translate_a/single"
                params = {
                    "client": "gtx",
                    "sl": source_lang,
                    "tl": lang_code,
                    "dt": "t",
                    "q": query,
                }
                resp = session.get(g_url, params=params, timeout=5)
                if resp.ok:
                    data = resp.json()
                    candidate = "".join([segment[0] for segment in data[0] if segment and segment[0]]).strip()
                    if candidate:
                        translated_text = candidate
            except Exception as e:
                logger.warning("Google translation to %s failed: %s", lang_code, e)

        if translated_text:
            if lang_code == "en":
                results["english"] = translated_text
            elif lang_code == "my":
                results["burmese"] = translated_text
            elif lang_code == "ja":
                results["japanese"] = translated_text

    return results
