# Tests for serving the React app (frontend.py).
#
# The real frontend/dist only exists after `npm run build`, so these tests
# point FRONTEND_DIST at a small fake build in a temporary folder instead
# (tmp_path is a pytest fixture: a new empty folder for each test).

import pytest


@pytest.fixture()
def fake_build(app, tmp_path):
    (tmp_path / "index.html").write_text("<div id=root></div>")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "index-abc123.js").write_text("console.log('hi')")
    (tmp_path / "static").mkdir()
    (tmp_path / "static" / "favicon.png").write_bytes(b"png")
    old = app.config["FRONTEND_DIST"]
    app.config["FRONTEND_DIST"] = str(tmp_path)
    yield tmp_path
    app.config["FRONTEND_DIST"] = old      # put it back for the other tests


def test_every_page_address_gets_the_react_page(client, fake_build):
    for url in ("/", "/notes/math-1/03-quadratic-functions/05-quadratic-formula", "/practice", "/login", "/no/such/page"):
        response = client.get(url)
        assert response.status_code == 200, url
        assert b'<div id=root>' in response.data, url


def test_built_files_are_sent_as_they_are(client, fake_build):
    js = client.get("/assets/index-abc123.js")
    assert js.data == b"console.log('hi')"
    assert "max-age=604800" in js.headers["Cache-Control"]     # a week: the name changes with each build
    assert client.get("/static/favicon.png").data == b"png"
    # index.html is checked again every time, so a new deploy shows at once
    assert "max-age=0" in client.get("/").headers["Cache-Control"]


def test_api_addresses_never_get_the_react_page(client, fake_build):
    response = client.get("/api/no-such-thing")
    assert response.status_code == 404
    assert response.get_json() == {"error": "not found"}


def test_files_outside_the_build_are_refused(client, fake_build):
    response = client.get("/../.env")
    assert b"SECRET_KEY" not in response.data
    response = client.get("/static/../../.env")
    assert b"SECRET_KEY" not in response.data


def test_without_a_build_it_explains(client, app, tmp_path):
    old = app.config["FRONTEND_DIST"]
    app.config["FRONTEND_DIST"] = str(tmp_path / "missing")
    try:
        response = client.get("/practice")
        assert response.status_code == 503
        assert b"npm run build" in response.data
    finally:
        app.config["FRONTEND_DIST"] = old
