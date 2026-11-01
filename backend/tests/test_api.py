# Tests for the JSON API (api/content.py).
#
# Each test_... function is one check. pytest runs them all and reports any
# "assert" that is False. The `client` argument comes from conftest.py.
#
# Counts like 262 are not written here, so adding a note doesn't break the
# tests; they compare against the database or check the shape of the data.

from models import Note, ProblemSet

NOTE = "math-1/03-quadratic-functions/05-quadratic-formula"


def test_home_counts_match_the_database(client, app):
    response = client.get("/api/home")
    assert response.status_code == 200
    data = response.get_json()                     # the JSON, as Python dicts and lists
    with app.app_context():                        # needed to read the database here
        assert data["stats"]["notes"] == Note.query.count()
    assert [s["name"] for s in data["subjects"]][:2] == ["Mathematics", "Physics"]


def test_search_index_has_every_note_set_and_paper(client, app):
    data = client.get("/api/search-index").get_json()
    with app.app_context():
        assert len(data) == Note.query.count() + ProblemSet.query.count()
    assert {"title", "where", "url"} <= set(data[0])        # <= means "is a subset of"


def test_note(client):
    data = client.get("/api/notes/" + NOTE).get_json()
    assert data["note_title"] == "Quadratic Formula"
    assert 'class="note-title"' in data["content"]           # the note's HTML is included
    assert data["location"]["course"] == "Math I"
    assert data["location"]["topic"] == "Quadratic Functions"
    assert data["nav"]["next"]["url"].startswith("/notes/math-1/03-quadratic-functions/")


def test_first_note_has_no_previous(client):
    first = client.get("/api/notes").get_json()["notes_meta"][0]["path"]
    data = client.get("/api/notes/" + first).get_json()
    assert data["nav"]["prev"] is None


def test_notes_sidebar(client, app):
    data = client.get("/api/notes").get_json()
    with app.app_context():
        assert len(data["notes_meta"]) == Note.query.count()
    assert data["display_names"]["courses"]["math-1"] == "Math I"


def test_practice_hub_and_set(client):
    courses = client.get("/api/practice").get_json()["courses"]
    first_set = courses[0]["topics"][0]["sets"][0]
    data = client.get("/api/practice/" + first_set["path"]).get_json()
    assert data["title"] == first_set["title"]
    assert data["count"] > 0
    assert data["location"]["kind"] == "Practice"


def test_past_category_and_paper(client):
    category = client.get("/api/past/eju").get_json()
    assert category["name"] == "EJU Mock Papers"
    paper = category["papers"][0]
    data = client.get("/api/past/" + paper["path"]).get_json()
    assert data["practice_path"] == "past/" + paper["path"]   # its progress key


def test_renamed_paper_points_to_its_new_address(client):
    # content/past/eju/... lists "past/eju/02-practice-paper-course-1" in data-moved-from
    response = client.get("/api/past/eju/02-practice-paper-course-1")
    assert response.status_code == 404
    assert response.get_json()["moved_to"].startswith("/past/eju/")


def test_unknown_addresses_give_json_404(client):
    for url in ("/api/notes/no-such-note", "/api/practice/nope", "/api/past/nope",
                "/api/past/eju/nope", "/api/no-such-endpoint", "/api/notes/../app.py"):
        response = client.get(url)
        assert response.status_code == 404, url
        assert response.get_json() == {"error": "not found"}, url
