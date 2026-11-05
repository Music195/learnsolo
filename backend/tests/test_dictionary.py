import json
from unittest.mock import patch, MagicMock
from extensions import db
from models import DictionaryEntry
import services.dictionary as dict_service


def test_dictionary_missing_query(client):
    res = client.get("/api/dictionary")
    assert res.status_code == 400
    assert "Missing query" in res.get_json()["error"]


def test_dictionary_curated_lookup(app, client):
    with app.app_context():
        # Ensure test entry exists
        if not DictionaryEntry.query.filter_by(word="testterm").first():
            entry = DictionaryEntry(
                word="testterm",
                source_lang="en",
                english="Test Term",
                burmese="စမ်းသပ်ချက်",
                japanese="テスト用語",
                reading="てすとようご",
                notes="Testing note",
                source="curated",
            )
            db.session.add(entry)
            db.session.commit()

    res = client.get("/api/dictionary?q=testterm")
    assert res.status_code == 200
    data = res.get_json()
    assert data["english"] == "Test Term"
    assert data["burmese"] == "စမ်းသပ်ချက်"
    assert data["japanese"] == "テスト用語"
    assert data["reading"] == "てすとようご"
    assert data["source"] == "curated"
    assert data["detected_lang"] == "en"


def test_dictionary_auto_detect_burmese(client):
    with patch("services.dictionary._translate_online") as mock_translate:
        mock_translate.return_value = {
            "query": "လုပ်ဆောင်ချက်",
            "from": "my",
            "english": "function",
            "burmese": "လုပ်ဆောင်ချက်",
            "japanese": "機能",
            "reading": "きのう",
            "notes": "",
            "source": "online",
        }
        res = client.get("/api/dictionary?q=လုပ်ဆောင်ချက်")
        assert res.status_code == 200
        data = res.get_json()
        assert data["detected_lang"] == "my"
        assert data["english"] != ""
        assert data["japanese"] != ""


def test_dictionary_auto_detect_japanese(client):
    with patch("services.dictionary._translate_online") as mock_translate:
        mock_translate.return_value = {
            "query": "関数",
            "from": "ja",
            "english": "function",
            "burmese": "လုပ်ဆောင်ချက်",
            "japanese": "関数",
            "reading": "かんすう",
            "notes": "",
            "source": "online",
        }
        res = client.get("/api/dictionary?q=関数")
        assert res.status_code == 200
        data = res.get_json()
        assert data["detected_lang"] == "ja"
        assert data["english"] != ""
        assert data["burmese"] != ""


def test_dictionary_does_not_add_unverified_to_db(app, client):
    # Ensure a random unverified search is not saved into the database table
    random_word = "xyzunverifiedword123"
    with patch("services.dictionary._translate_online") as mock_translate:
        mock_translate.return_value = {
            "query": random_word,
            "from": "en",
            "english": random_word,
            "burmese": "",
            "japanese": "",
            "reading": "",
            "notes": "",
            "source": "online",
        }
        res = client.get(f"/api/dictionary?q={random_word}")
        assert res.status_code in (200, 404)

    with app.app_context():
        entry = DictionaryEntry.query.filter_by(word=random_word).first()
        assert entry is None


def test_dictionary_groq_ai_lookup(client):
    """Test Groq AI translation when GROQ_API_KEY is present."""
    groq_mock_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "english": "photosynthesis",
                        "burmese": "အလင်းမှီစုဖွဲ့ခြင်း",
                        "japanese": "光合成",
                        "reading": "こうごうせい",
                        "notes": "Process by which green plants make food using sunlight",
                    })
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.ok = True
    mock_resp.json.return_value = groq_mock_response

    with patch.dict("os.environ", {"GROQ_API_KEY": "gsk_test_key"}), \
         patch("requests.post", return_value=mock_resp) as mock_post:
        res = client.get("/api/dictionary?q=photosynthesis")
        assert res.status_code == 200
        data = res.get_json()
        assert data["source"] == "ai"
        assert data["english"] == "photosynthesis"
        assert data["burmese"] == "အလင်းမှီစုဖွဲ့ခြင်း"
        assert data["japanese"] == "光合成"
        assert data["reading"] == "こうごうせい"
        assert "Process" in data["notes"]
        assert mock_post.called
        assert "api.groq.com" in mock_post.call_args[0][0]


def test_dictionary_groq_fails_falls_back_to_gemini(client):
    """Test fallback to Gemini AI when Groq fails."""
    gemini_mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "english": "gravity",
                                "burmese": "ကမ္ဘာ့ဆွဲအား",
                                "japanese": "重力",
                                "reading": "じゅうりょく",
                                "notes": "Fundamental physical force",
                            })
                        }
                    ]
                }
            }
        ]
    }

    mock_gemini_resp = MagicMock()
    mock_gemini_resp.ok = True
    mock_gemini_resp.json.return_value = gemini_mock_response

    with patch.dict("os.environ", {"GROQ_API_KEY": "gsk_test", "GEMINI_API_KEY": "gemini_test"}), \
         patch("services.dictionary._translate_groq", side_effect=RuntimeError("Groq timeout")), \
         patch("requests.post", return_value=mock_gemini_resp):
        res = client.get("/api/dictionary?q=gravity")
        assert res.status_code == 200
        data = res.get_json()
        assert data["source"] == "ai"
        assert data["english"] == "gravity"
        assert data["japanese"] == "重力"
