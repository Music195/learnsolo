from extensions import db
from models import DictionaryEntry


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
    res = client.get("/api/dictionary?q=လုပ်ဆောင်ချက်")
    assert res.status_code == 200
    data = res.get_json()
    assert data["detected_lang"] == "my"
    assert data["english"] != ""
    assert data["japanese"] != ""


def test_dictionary_auto_detect_japanese(client):
    res = client.get("/api/dictionary?q=関数")
    assert res.status_code == 200
    data = res.get_json()
    assert data["detected_lang"] == "ja"
    assert data["english"] != ""
    assert data["burmese"] != ""


def test_dictionary_does_not_add_unverified_to_db(app, client):
    # Ensure a random unverified search is not saved into the database table
    random_word = "xyzunverifiedword123"
    res = client.get(f"/api/dictionary?q={random_word}")
    assert res.status_code in (200, 404)

    with app.app_context():
        entry = DictionaryEntry.query.filter_by(word=random_word).first()
        assert entry is None
