# Tests for accounts (api/auth.py) and saved progress (api/progress.py).
#
# Each test makes its own user with a new email (new_email()), because the
# test database keeps users between tests. The `client` keeps cookies like a
# browser, so after signing up it stays logged in for the rest of the test.

import itertools

from models import User

_numbers = itertools.count()
PASSWORD = "correct horse battery"


def new_email():
    return f"learner{next(_numbers)}@example.com"


def sign_up(client, email=None, password=PASSWORD):
    return client.post("/api/auth/signup", json={"email": email or new_email(), "password": password})


# ---------- Accounts ----------

def test_sign_up_logs_in(client):
    email = new_email()
    response = sign_up(client, email)
    assert response.status_code == 201
    assert response.get_json() == {"user": {"email": email}}
    assert client.get("/api/auth/me").get_json() == {"user": {"email": email}}


def test_password_is_stored_as_a_hash(client, app):
    email = new_email()
    sign_up(client, email)
    with app.app_context():
        stored = User.query.filter_by(email=email).one().password_hash
    assert PASSWORD not in stored


def test_email_is_case_insensitive(client):
    sign_up(client, "Mixed.Case@Example.com")
    client.post("/api/auth/logout")
    response = client.post("/api/auth/login", json={"email": "mixed.case@example.com", "password": PASSWORD})
    assert response.status_code == 200


def test_sign_up_checks_the_form(client):
    assert sign_up(client, "not-an-email").status_code == 400
    assert sign_up(client, password="short").status_code == 400
    assert client.post("/api/auth/signup", data="not json").status_code == 400


def test_email_can_only_be_used_once(client):
    email = new_email()
    sign_up(client, email)
    client.post("/api/auth/logout")
    assert sign_up(client, email).status_code == 409


def test_log_out_and_back_in(client):
    email = new_email()
    sign_up(client, email)
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").get_json() == {"user": None}
    response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    assert client.get("/api/auth/me").get_json() == {"user": {"email": email}}


def test_wrong_password_and_unknown_email_look_the_same(client):
    email = new_email()
    sign_up(client, email)
    client.post("/api/auth/logout")
    wrong_password = client.post("/api/auth/login", json={"email": email, "password": "wrong password"})
    unknown_email = client.post("/api/auth/login", json={"email": new_email(), "password": PASSWORD})
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.get_json() == unknown_email.get_json()
    assert client.get("/api/auth/me").get_json() == {"user": None}


def test_login_cookie_is_http_only(client):
    response = sign_up(client)
    cookies = response.headers.getlist("Set-Cookie")
    assert cookies and all("HttpOnly" in c and "SameSite=Lax" in c for c in cookies)


# ---------- Progress ----------

SET = "math-1/03-quadratic-functions/01-graphs-and-vertex-form"


def test_progress_needs_login(client):
    assert client.get("/api/progress").status_code == 401
    assert client.put("/api/progress/" + SET, json={"0": "solved"}).status_code == 401


def test_save_and_read_progress(client):
    sign_up(client)
    assert client.get("/api/progress").get_json() == {"progress": {}}
    assert client.put("/api/progress/" + SET, json={"0": "solved", "2": "review"}).status_code == 200
    assert client.put("/api/progress/past/eju/course-1/01-mock-paper", json={"1": "solved"}).status_code == 200
    assert client.get("/api/progress").get_json() == {"progress": {
        SET: {"0": "solved", "2": "review"},
        "past/eju/course-1/01-mock-paper": {"1": "solved"},
    }}
    # Saving again replaces it; {} is "Start again"
    client.put("/api/progress/" + SET, json={})
    assert client.get("/api/progress").get_json()["progress"][SET] == {}


def test_progress_is_private(client, app):
    sign_up(client)
    client.put("/api/progress/" + SET, json={"0": "solved"})
    other = app.test_client()          # a second browser, another user
    sign_up(other)
    assert other.get("/api/progress").get_json() == {"progress": {}}


def test_bad_progress_is_refused(client):
    sign_up(client)
    for bad in ({"0": "done"}, {"first": "solved"}, ["solved"], "solved"):
        assert client.put("/api/progress/" + SET, json=bad).status_code == 400, bad


def test_delete_progress(client):
    sign_up(client)
    client.put("/api/progress/" + SET, json={"0": "solved"})
    client.delete("/api/progress/" + SET)
    assert client.get("/api/progress").get_json() == {"progress": {}}


def test_merge_keeps_the_best_of_both(client):
    sign_up(client)
    client.put("/api/progress/" + SET, json={"0": "solved", "1": "review"})
    response = client.post("/api/progress/merge", json={"progress": {
        SET: {"0": "review", "1": "solved", "2": "review"},   # this browser
        "math-a/01-sets/01-sets-and-operations": {"3": "solved"},
        "bad": {"0": "nonsense"},                              # skipped
    }})
    assert response.get_json() == {"progress": {
        SET: {"0": "solved", "1": "solved", "2": "review"},   # solved in either place wins
        "math-a/01-sets/01-sets-and-operations": {"3": "solved"},
    }}
