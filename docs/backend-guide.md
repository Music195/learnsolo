# LearnSolo: Backend Guide (`backend/`)

## Start here

The LearnSolo backend is a **Python + Flask** server (`backend/`) backed by a **PostgreSQL** database. It has three responsibilities:
1. **Importing content** (`importer.py`, `services/dictionary.py`): reading HTML files from `content/` and curated words from `content/dictionary.json` into PostgreSQL tables (`flask import-content`, `flask import-dictionary`).
2. **Answering JSON API requests** (`/api/...`): serving structured JSON for notes, practice sets, mock question papers, search, the 3-way dictionary, user accounts, and saved practice progress.
3. **Serving the built React app** (`frontend.py`): on the live server, sending `frontend/dist/` for every non-`/api/` address.

The project documentation is split into three connected guides:

| Guide | What it covers |
|---|---|
| **[docs/content-guide.md](content-guide.md)** | Writing **Notes**, **Practice sets**, **Mock Questions**, interactive **TRY IT demos**, and **dictionary entries** in `content/` |
| **[docs/backend-guide.md](backend-guide.md)** *(this guide)* | The **Flask + PostgreSQL** server in `backend/`: architecture, every file, database models & migrations, JSON API (`/api/...`), accounts, deployment, and backend recipes |
| **[docs/frontend-guide.md](frontend-guide.md)** | The **React + Vite** app in `frontend/`: pages, components, hooks, CSS styles, MathJax formula rendering, answer checking, and `localStorage` |
| **[docs/dictionary-guide.md](dictionary-guide.md)** | Deep dive into the 3-way English/Burmese/Japanese dictionary (`content/dictionary.json`, CLI commands, hybrid lookup) |
| **[docs/oracle-server.md](oracle-server.md)** | How the Oracle Cloud production server (`https://learnsolo.duckdns.org`) is set up and deployed |

---

## 1. How Backend Connects Content and Frontend

When someone opens LearnSolo, four programs work together, with **Flask** and **PostgreSQL** sitting right at the centre between **Content (`content/`)** and **Frontend (`frontend/`)**:

```
┌──────────────────────── the student's computer ─────────────────────────┐
│  BROWSER (Chrome, Safari…)                                               │
│    runs the REACT APP: JavaScript from frontend/src/                     │
│    it draws every page, and asks the server for data                     │
└───────────────┬─────────────────────────────────────────▲───────────────┘
                │ "give me note X"  (GET /api/notes/X)      │ the note as JSON
                ▼                                           │
┌──────────────────────────── the server ──────────────────┴──────────────┐
│  FLASK (Python, backend/)                                                │
│    reads the request, finds the data, answers in JSON                    │
│        │ SQL query                         ▲ rows                        │
│        ▼                                   │                             │
│  POSTGRESQL (the database)                                               │
│    tables: courses, topics, notes, problem_sets,                         │
│            users, progress, dictionary_entries                           │
└──────────────────────────────────────────────────────────────────────────┘

   content/*.html ──flask import-content──▶ the database
   content/dictionary.json ──flask import-dictionary──▶ the database
   (you write here)                                     (the site reads here)
```

| Program | Language | Folder | Its one job |
|---|---|---|---|
| **React app** | JavaScript (JSX) | `frontend/` | Draws the pages in the browser, and reacts to clicks and typing |
| **Flask** | Python | `backend/` | Answers requests: sends data (JSON) and the React app's files |
| **PostgreSQL** | SQL | (a separate program; Docker on your laptop) | Keeps the data safely: content, accounts, progress, dictionary |
| **The importer** | Python | `backend/importer.py` | Copies your HTML files from `content/` into the database |

**Why split it like this?** Each part can change without breaking the others:
- You can redesign a page (`frontend/`) without touching how data is stored (`PostgreSQL`).
- You can add notes (`content/`) without touching any Python or React code.
- The same JSON API (`/api/...`) could one day feed a mobile app.

### On your laptop there are two servers; on the live site, one

```
YOUR LAPTOP (developing)                         LIVE SITE (Render, Oracle)
browser → http://localhost:5173                  browser → https://...
            │                                                │
       Vite (npm run dev)                             gunicorn running Flask
       ├─ sends the React app (and shows               ├─ /api/...      → JSON
       │  your edits instantly)                        └─ anything else → the built React
       └─ /api/... → passes it on to Flask :5000           app (frontend/dist, made by
                     (vite.config.js "proxy")               npm run build; backend/frontend.py)
```

### Following one click through the backend

Here is what happens when the React frontend opens `/notes/math-1/03-quadratic-functions/05-quadratic-formula` and requests `GET /api/notes/math-1/03-quadratic-functions/05-quadratic-formula`:

1. **The request reaches Flask.** On your laptop, Vite passes `/api/...` to Flask on port 5000 (`frontend/vite.config.js`). Online, Flask gets it directly. In `backend/app.py`, the app registers two blueprints:
   ```python
   app.register_blueprint(api_bp)        # /api/...
   app.register_blueprint(frontend_bp)   # everything else: the React app
   ```
2. **The route answers (`backend/api/content.py`):**
   ```python
   @api_bp.get("/notes/<path:note_path>")
   def api_note(note_path):
       return note_page(note_path)
   ```
   - `api_bp` was created with `url_prefix="/api"` (`backend/api/__init__.py`), so `"/notes/<path:note_path>"` matches `/api/notes/...`.
   - `<path:note_path>` captures the rest of the address, slashes included, and passes it in as `note_path`.
   - Routes stay 1–3 lines long: they only call the right service function. When a route returns a Python `dict`, Flask serializes it to JSON.
3. **The service works out the page's data (`backend/services/notes.py`, `note_page()`):**
   ```python
   notes_meta = get_notes_with_titles()          # every note's path and title, in order
   notes_list = [n["path"] for n in notes_meta]
   if note_path not in notes_list:               # unknown path (or a trick like "../")
       raise ContentNotFound(note_path)          # → api/__init__.py answers 404 {"error": "not found"}
   content = load_note(note_path)                # the note's HTML
   nav = build_nav_links(notes_list, note_path)  # previous / next
   ...
   return {"note_title": ..., "content": content, "location": ..., "nav": nav, "practice": ...}
   ```
4. **The loader asks the database (`backend/utils/content_loader.py`):**
   ```python
   def load_note(note_path):
       html = db.session.scalar(db.select(Note.html).where(Note.path == note_path))
   ```
   SQLAlchemy turns this into `SELECT notes.html FROM notes WHERE notes.path = '...'`, using the `Note` model from `backend/models.py`. The row got there earlier when `flask import-content` (`backend/importer.py`) read `content/notes/math-1/03-quadratic-functions/05-quadratic-formula.html`.

### How every page connects across Frontend → API → Backend Service

| Page / Feature | React component (`frontend/src/`) | API route (`backend/api/`) | Service function (`backend/services/`) |
|---|---|---|---|
| Home `/` | `pages/Home.jsx` | `/api/home` | `home_page()` in `services/home.py` |
| A note | `pages/Note.jsx` | `/api/notes/<path>`, `/api/notes` | `note_page()`, `notes_sidebar()` in `services/notes.py` |
| Practice hub | `pages/PracticeList.jsx` | `/api/practice` | `practice_courses()` in `services/practice.py` |
| A practice set | `pages/PracticeSet.jsx` | `/api/practice/<path>` | `practice_page()` in `services/practice.py` |
| Mock Questions lists | `pages/PastList.jsx` | `/api/past`, `/api/past/<exam>` | `past_categories()`, `past_category_page()` in `services/past.py` |
| A mock paper | `pages/PastPaper.jsx` | `/api/past/<exam>/<paper>` | `past_paper_page()` in `services/past.py` |
| Search box | `components/SearchBox.jsx` | `/api/search-index` | `build_search_index()` in `services/home.py` |
| Floating dictionary | `components/FloatingDictionary.jsx` | `/api/dictionary?q=...` | `lookup_word()` in `services/dictionary.py` |
| Log in / sign up | `pages/Account.jsx` (via `auth.jsx`) | `/api/auth/...` | in `api/auth.py` itself |
| Saved progress | `progress.js` | `/api/progress/...` | in `api/progress.py` itself |

To change what **data** a page receives, start in its **service function** in `backend/services/`. To change how the page **draws** that data, start in its **React component** in `frontend/src/` (see [docs/frontend-guide.md](frontend-guide.md)).

---

## 2. Words You'll Meet in the Backend Code

**The web:**

| Word | Meaning | Example here |
|---|---|---|
| **Request / response** | The browser asks (request), the server answers (response). Every page, file and piece of data is one request | Opening a note makes about 2 requests to `/api/...` |
| **URL / address / path** | `https://site.com/notes/math-1/...`: the **path** is the part after the domain | `/notes/math-1/03-quadratic-functions/05-quadratic-formula` |
| **HTTP method** | What kind of request: **GET** = read, **POST** = do/create, **PUT** = save/replace, **DELETE** = remove | `GET /api/home`, `POST /api/auth/login`, `PUT /api/progress/...` |
| **Status code** | A number in each answer: **200** OK, **201** created, **400** bad request, **401** not logged in, **404** not found, **409** conflict, **500** server error | `{"error": "not found"}` comes with 404 |
| **JSON** | Text format for data: objects `{...}`, lists `[...]`, strings, numbers, `true/false`, `null` | `{"user": {"email": "a@b.com"}}` |
| **API** | A set of addresses that answer with data instead of pages. Ours is everything under `/api/` | Section 5 lists them all |
| **Endpoint / route** | One address of the API and the function that answers it | `/api/home` → `api_home()` in `api/content.py` |
| **Cookie** | A small value the server asks the browser to keep and send back with every request | The login cookie (Section 4) |

**Flask, Python, and SQL:**

| Word | Meaning | Example here |
|---|---|---|
| **Flask** | A Python library for writing web servers | `app = Flask(__name__)` in `app.py` |
| **Decorator** | A line starting with `@` above a function, which adds something to it | `@api_bp.get("/home")` makes the function answer `GET /api/home` |
| **Blueprint** | A group of routes, registered on the app together | `api_bp` (all of `/api`), `frontend_bp` (the React app) |
| **Service** | Our own word: a function that works out a page's data (no web stuff in it) | `note_page()` in `services/notes.py` |
| **Model** | A Python class that describes one database table | `class Note(db.Model)` in `models.py` |
| **SQLAlchemy / ORM** | The library that turns Python into SQL, so you write Python queries instead of raw SQL | `db.select(Note.html).where(Note.path == p)` |
| **Migration** | A small script that changes the tables (adds a column…), kept in `migrations/versions/` and applied with `flask db upgrade` | Section 7.5 |
| **Exception** | An error raised with `raise` and caught with `try/except` or an error handler | `raise ContentNotFound(path)` → JSON 404 |
| **venv** | A folder with this project's own Python packages | `venv/` on your laptop |
| **Environment variable** | A setting given to a program from outside its code | `DATABASE_URL`, `SECRET_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` (from `.env`) |

---

## 3. Every File in the Project Root and `backend/`

### The project root

| File / folder | What it is | Open it when… |
|---|---|---|
| `README.md` | The project's front page on GitHub: overview, folders, how to run it | You want the short version, or change the GitHub description |
| `docs/` | `content-guide.md`, `backend-guide.md` (this one), `frontend-guide.md`, `dictionary-guide.md`, `oracle-server.md` | Learning the project, writing content, looking after the server |
| `backend/` | The server: Flask, database models, importer, services, API, tests | Changing data, the API, accounts |
| `frontend/` | The React app: every page ([docs/frontend-guide.md](frontend-guide.md)) | Changing how pages look or behave |
| `content/` | Every note, practice set, mock paper, and `dictionary.json` ([docs/content-guide.md](content-guide.md)) | Writing content |
| `.env` | **Your** settings and secrets: `DATABASE_URL`, `SECRET_KEY`, `FLASK_DEBUG`, optional `GROQ_API_KEY`, optional `GEMINI_API_KEY`. Not in git (`.gitignore`) | Setting up a new computer |
| `.env.example` | A template for `.env`, without real secrets. In git | Adding a new setting (add it here too, so others know it exists) |
| `docker-compose.yml` | Starts PostgreSQL in Docker on your laptop: user, password and port match `.env.example` | Rarely; `docker compose up -d` uses it |
| `render.yaml` | Render's "Blueprint": how the live site is built and started, its database, its settings | Changing the build or start commands, or the Render plan |
| `.gitignore` | Files git must never save: `.env`, `venv/`, `node_modules/`, `frontend/dist/`, caches | A new kind of generated or secret file appears |
| `.python-version` | The Python version used locally (by tools like pyenv) | Changing Python version |
| `LICENSE` | The MIT licence | Never |
| `.github/pull_request_template.md` | The checklist GitHub puts into every new pull request | You want a different checklist |

### `backend/` files

**Starting the app and its settings:**

| File | What it does | Open it when… |
|---|---|---|
| `app.py` | **Builds the app**, in `create_app()`: loads the settings, connects the database and the login system, registers the two blueprints, and adds the `flask import-content`, `flask import-dictionary`, `flask list-dictionary` and `flask add-word` CLI commands. `python app.py` runs it locally; `gunicorn app:app` online | Adding a new CLI command, a new blueprint, or a new extension |
| `config.py` | **Settings**, read from environment variables / `.env`: `DATABASE_URL`, `SECRET_KEY`, cookie safety settings, where the React build is | Adding a setting |
| `extensions.py` | Creates `db` (SQLAlchemy), `migrate` (Flask-Migrate) and `login_manager` (Flask-Login) once, so every file can import them | Adding a new Flask extension |
| `frontend.py` | Sends the **built React app** (`frontend/dist`): real files (JS, CSS, images) as they are, and `index.html` for every other address so React Router can show the page | Changing how the React files are served or cached |
| `requirements.txt` | Python packages the app needs, with exact versions. `pip install -r requirements.txt` installs them | Adding a Python package (Section 7.7) |
| `requirements-dev.txt` | Extra packages for development only (`pytest`) | Adding a testing tool |

**The database:**

| File | What it does | Open it when… |
|---|---|---|
| `models.py` | **The tables**, one class each: `Course`, `Topic`, `Note`, `ProblemSet` (practice sets and mock papers), `User`, `Progress`, `DictionaryEntry` (3-way vocabulary). Each `db.Column` is a column | Storing something new (Section 7.5) |
| `migrations/` | Made by Flask-Migrate (Alembic). `versions/` holds one script per change to the tables; `flask db upgrade` applies the ones not applied yet. `env.py`, `alembic.ini`, `script.py.mako` are its machinery | After `flask db migrate`: read the new file in `versions/` before committing it. Don't edit the machinery |
| `importer.py` | **`flask import-content`**: reads every file in `content/` (`_paths`, `_read`), picks out the title, intro, problem count, exam labels… with regular expressions (`parse_note`, `parse_set`), then adds, updates or deletes rows to match (`_sync`, `import_content`) | A new piece of information should be read from content files (Section 7.5) |

**Answering requests (`backend/api/`):**

| File | What it does | Open it when… |
|---|---|---|
| `api/__init__.py` | Creates `api_bp`, the blueprint for everything under `/api`, and turns errors into JSON (`{"error": "not found"}` with 404). The last line imports the route files (`content`, `auth`, `progress`, `dictionary`) | A new route file, or a new kind of error |
| `api/content.py` | **The read-only routes**: home, search index, notes, practice, mock papers. Each is 1–3 lines that call a service | Adding a new address for content (Section 7.4) |
| `api/dictionary.py` | **The dictionary route**: `GET /api/dictionary?q=<word>&from=auto` calls `lookup_word()` | Changing the dictionary API parameters or error handling |
| `api/auth.py` | **Accounts**: `/api/auth/me`, `signup`, `login`, `logout`. Checks the email and password, hashes passwords, sets the login cookie | Changing sign-up rules (e.g. password length: `MIN_PASSWORD`) |
| `api/progress.py` | **Saved progress** of logged-in users: get all, save one set, delete one, merge the browser's progress in. `@login_required` on each | Changing what progress can hold |

**Working out each page's data (`backend/services/`, plain Python dicts/lists with no web code):**

| File | What it does | Open it when… |
|---|---|---|
| `services/__init__.py` | Explains what services are (comment only) | |
| `services/home.py` | The home page's subject tabs, courses, topics and counts; and `build_search_index()` | Changing the home page's data, or what search finds |
| `services/notes.py` | One note page: the note, where it sits ("Note 5 of 8"), previous/next, its practice sets; and the Topics sidebar's list | Changing note navigation or what a note page gets |
| `services/practice.py` | The practice hub (courses → topics → sets) and one set's page with its next/previous order | Changing practice order or data |
| `services/past.py` | Mock question categories (`eju`, `jlpt`, `university`), level tabs (`n1`–`n5`), skill sections (`vocab`, `grammar`, `reading`, `listening`), one paper's page, and renamed papers (`PaperMoved`) | Changing the mock question pages' data |
| `services/dictionary.py` | Hybrid 3-way dictionary lookup (`lookup_word`), language auto-detection (`detect_language`), database search and AI/translation fallback, plus `import_dictionary_json` | Changing how words are matched or translated |
| `services/urls.py` | The address of each kind of page (`/notes/...`, `/practice/...`, `/past/...`) in one place | A page's address changes |

**Helpers (`backend/utils/`):**

| File | What it does | Open it when… |
|---|---|---|
| `utils/content_loader.py` | **Reads content from the database**: the notes list, one note's HTML, practice sets, mock papers. Defines `ContentNotFound` | A service needs content in a new way |
| `utils/courses.py` | **Display names**: `SUBJECTS` (home tabs: Mathematics, Physics, Grade 12 Myanmar), `COURSES` (`math-1` → "Math I", `mechanics-basic` → "Mechanics Basic", `g12-physics` → "Physics MM"…), `PAST_CATEGORIES` (`eju`, `jlpt`, `university`), `TOPIC_NAMES` (fixes) | Adding a course, subject or exam (Section 7.3) |

**Tests (`backend/tests/`, run with `pytest` from `backend/`):**

| File | What it checks |
|---|---|
| `pytest.ini` | pytest's settings: tests are in `tests/`, and they may import from `backend/` |
| `tests/conftest.py` | Shared setup ("fixtures"): creates the `learnsolo_test` database, imports the content, gives tests `app` and `client` (a fake browser) |
| `tests/test_api.py` | Every content route answers with the right shape of data, and unknown addresses give a JSON 404 |
| `tests/test_accounts.py` | Sign up, log in, log out, wrong passwords, saving and merging progress, that users can't see each other's progress |
| `tests/test_dictionary.py` | Language detection (English, Burmese, Japanese), curated database lookups, CLI commands and `/api/dictionary` |
| `tests/test_importer.py` | Reading titles and problem counts from files; a second import changes nothing |
| `tests/test_frontend.py` | Serving the built React app: `index.html` for page addresses, real files as they are, JSON 404 for `/api/...`, files outside the build refused |

---

## 4. Accounts, Sessions, and Saved Progress

Anyone can make an account (`/signup`) or log in (`/login`):

1. **Signing up (`POST /api/auth/signup` in `backend/api/auth.py`):**
   - `api_signup()` checks the email format and password length (`MIN_PASSWORD = 8`), and checks the email isn't already taken (`409` if taken).
   - Saves a `User` row with `generate_password_hash(password)` (`werkzeug.security`). **Plaintext passwords are never stored.**
2. **Session cookie (`Flask-Login`):**
   - `login_user(user, remember=True)` sets an `HttpOnly` cookie holding the user's ID, cryptographically signed with `SECRET_KEY` so it cannot be forged or read by JavaScript.
   - On every subsequent request, the browser sends that cookie automatically, and Flask sets `current_user`.
   - When the site opens, `GET /api/auth/me` checks `current_user` and returns `{"user": {"email": ...}}` or `{"user": null}`.
3. **Merging and saving practice progress (`backend/api/progress.py`):**
   - When logged out, the browser stores progress in `localStorage`.
   - At login or signup, the frontend sends that browser progress to `POST /api/progress/merge`. For any set present in both places, problem statuses are merged so `"solved"` in either place wins, and all merged progress is returned.
   - While logged in, marking a problem sends `PUT /api/progress/<path>` with `{"0": "solved", ...}`, which `_clean()` validates and stores in the `progress` table (one row per user per set).

---

## 5. JSON API Reference

Everything under `/api` returns JSON. You can open any `GET` route directly in your browser (e.g. `http://localhost:5000/api/home`) to inspect the exact JSON sent to React.

### Content and Dictionary routes (`api/content.py`, `api/dictionary.py`)

| Address | Returns |
|---|---|
| `GET /api/home` | `subjects` (tabs → courses → topics) and `stats` (counts) |
| `GET /api/search-index` | `[{title, where, url}]` for every note, set and mock paper |
| `GET /api/notes` | `notes_meta` (every note's path and title, in order) and `display_names` for the Topics sidebar |
| `GET /api/notes/<path>` | `note_title`, `content`, `location`, `nav` (prev/next) and `practice` (sets for this note) |
| `GET /api/practice` | `courses` → topics → sets |
| `GET /api/practice/<path>` | one set: `title`, `count`, `content`, `location`, `nav` |
| `GET /api/past` | `categories`, each with its papers |
| `GET /api/past/<exam>` | one category: name, about, `papers`, `groups` |
| `GET /api/past/<exam>/[<course>/]<paper>` | one paper, like a set, plus `paper` (its category) |
| `GET /api/dictionary?q=<word>&from=auto` | `query`, `detected_lang` (`en`/`my`/`ja`), `english`, `burmese`, `japanese`, `reading`, `notes`, and `source` (`curated`/`ai`/`online`) |

Anything that doesn't exist answers `404` with `{"error": "not found"}`. The old address of a renamed paper answers `404` with `{"error": "moved", "moved_to": "/past/..."}`.

### Account routes (`api/auth.py`)

| Request | Does |
|---|---|
| `GET /api/auth/me` | `{"user": {"email"}}`, or `{"user": null}` when logged out |
| `POST /api/auth/signup` `{"email", "password"}` | Makes an account and logs in (`201`). `400` for a bad email or a password under 8 characters, `409` if the email has an account |
| `POST /api/auth/login` `{"email", "password"}` | Logs in, or `401` `"Wrong email or password."` (the same message whichever is wrong) |
| `POST /api/auth/logout` | Logs out |

### Progress routes (`api/progress.py`, requires login; otherwise `401` `{"error": "login required"}`)

| Request | Does |
|---|---|
| `GET /api/progress` | `{"progress": {<path>: {...}}}`: every set with progress |
| `PUT /api/progress/<path>` | Saves one set's progress (`{}` for "Start again") |
| `DELETE /api/progress/<path>` | Forgets one set's progress |
| `POST /api/progress/merge` `{"progress": {...}}` | Adds the browser's progress to the account ("solved" wins) and returns all of it |

---

## 6. Running, Testing, and Deploying

### Running locally

Running the site locally takes **three programs at once**:

| Program | What it does | Address |
|---|---|---|
| PostgreSQL (in Docker) | The database: notes, practice sets, accounts, dictionary | `localhost:5432` |
| Flask (`backend/app.py`) | The API: answers `/api/...` with JSON from the database | http://localhost:5000 |
| Vite (`npm run dev` in `frontend/`) | The React app; passes `/api/...` on to Flask | http://localhost:5173 ← **open this one** |

#### First time only (setup)

Run these from the **project root** (`learnsolo/`), in order:

```bash
python3 -m venv venv                                   # 1. make venv/, a private Python for this project
venv/bin/pip install -r backend/requirements.txt -r backend/requirements-dev.txt
                                                       # 2. install Flask, SQLAlchemy, pytest… into venv/
cp .env.example .env                                   # 3. make your settings file (never commit it)
venv/bin/python -c "import secrets; print(secrets.token_hex(32))"
                                                       # 4. prints a random key: paste it into .env as SECRET_KEY=...
docker compose up -d                                   # 5. start PostgreSQL in the background
cd frontend && npm install && cd ..                    # 6. install React, Vite… into frontend/node_modules/
cd backend
../venv/bin/flask db upgrade                           # 7. create the tables in the empty database
../venv/bin/flask import-content                       # 8. copy content/ into the database
../venv/bin/flask import-dictionary                    # 9. copy content/dictionary.json into the database
```

#### Every time (start working)

**Terminal 1** (Database + Flask):

```bash
cd ~/Projects/learnsolo
docker compose up -d                   # start PostgreSQL (it doesn't start by itself after a reboot)
cd backend
../venv/bin/flask import-content       # only if content/ changed (e.g. after git pull)
../venv/bin/flask import-dictionary    # only if content/dictionary.json changed
../venv/bin/python app.py              # Flask on http://localhost:5000; leave this terminal open
```

**Terminal 2** (React, see [docs/frontend-guide.md](frontend-guide.md)):

```bash
cd ~/Projects/learnsolo/frontend
npm run dev                            # Vite on http://localhost:5173; leave this terminal open
```

- **After `git pull`**, run `../venv/bin/flask db upgrade` and `../venv/bin/flask import-content` (and `import-dictionary`) from `backend/`.
- **After changing `models.py`**, generate and apply a migration:
  ```bash
  cd backend
  ../venv/bin/flask db migrate -m "what changed"
  # inspect the new file in migrations/versions/
  ../venv/bin/flask db upgrade
  ```

### Running the tests (`pytest`)

From `backend/`:

```bash
../venv/bin/pytest          # every test; add -v to see each test name
```

The test suite creates and uses a separate `learnsolo_test` database populated from `content/`, so your development database is never modified. Always run `pytest` before opening a pull request.

### Deploying to Render and Oracle Cloud

- **Render (`render.yaml`):**
  1. **Builds:** installs `backend/requirements.txt`, then runs `npm ci && npm run build` in `frontend/`.
  2. **Starts** (from `backend/`): `flask db upgrade`, `flask import-content`, then `gunicorn app:app`.
  - Note: a free Render PostgreSQL database expires after 30 days unless upgraded or pointed to an external host. Content itself is always restored from `content/` via `flask import-content`.
- **Oracle Cloud server (`https://learnsolo.duckdns.org`):**
  - Runs the same codebase with its own PostgreSQL database and systemd service (`learnsolo.service`).
  - After merging a PR to `main`, SSH into the server and run `~/deploy.sh`. Full details: **[docs/oracle-server.md](oracle-server.md)**.

---

## 7. Backend Recipes (Changing and Expanding)

### 7.1 The safe git workflow for any change

1. **Start from `main` on a new branch:**
   ```bash
   git checkout main && git pull
   git checkout -b my-change
   ```
2. **Make the change and see it:**
   - Changed a `.py` file in `backend/`? Flask restarts automatically if `FLASK_DEBUG=1` in `.env` (otherwise Ctrl+C and restart `python app.py`).
   - Changed `models.py`? Run `flask db migrate` and `flask db upgrade`, then restart Flask.
   - Changed `.env` or `requirements.txt`? Restart Flask (after `venv/bin/pip install -r backend/requirements.txt`).
3. **Run tests and build:**
   ```bash
   cd backend && ../venv/bin/pytest; cd ..
   cd frontend && npm run build; cd ..
   ```
4. **Commit, push, and open a PR:**
   ```bash
   git add -A
   git commit -m "Describe what and why"
   git push -u origin my-change
   ```

### 7.2 Finding where something is made in `backend/`

- Search across the backend: `grep -rn "build_location" backend` (or `Ctrl+Shift+F` in VS Code).
- Inspect the JSON behind a page: open `http://localhost:5000/api/home` or press **F12 → Network** in the browser and click the `/api/...` request.
- Print debug values: add `print(note_path)` in Python and watch Flask's terminal (remove before committing).

### 7.3 Adding a new course, subject, or exam

1. **A new course** (e.g. `chemistry-basic`):
   - Add notes under `content/notes/chemistry-basic/01-atoms/01-periodic-table.html` ([docs/content-guide.md](content-guide.md)).
   - In `backend/utils/courses.py`, add to `COURSES`:
     ```python
     "chemistry-basic": {"name": "Chemistry Basic", "subject": "Chemistry"},
     ```
   - Give it an icon and colour in `COURSE_STYLE` in `frontend/src/pages/Home.jsx` ([docs/frontend-guide.md](frontend-guide.md)).
   - Run `flask import-content`.
2. **A new subject** (e.g. Chemistry): add `{"name": "Chemistry", "icon": "fa-flask"}` to `SUBJECTS` in `backend/utils/courses.py`.
3. **A new mock exam category:** create `content/past/<exam>/` and add an entry to `PAST_CATEGORIES` in `backend/utils/courses.py`.

### 7.4 Recipe: Adding a new API endpoint (`/api/random-note`)

Suppose you want a **"Surprise me"** button on the home page that opens a random note. On the backend, touch **service → route → test** (see [docs/frontend-guide.md](frontend-guide.md) for the React button):

1. **The service (`backend/services/notes.py`):**
   ```python
   import random

   def random_note():
       """A random note's address, for the "Surprise me" button: {"url": "/notes/..."}."""
       notes = get_notes_list()                       # every note's path, in order
       return {"url": note_url(random.choice(notes))} # random.choice picks one item of a list
   ```
2. **The route (`backend/api/content.py`):**
   ```python
   @api_bp.get("/random-note")
   def api_random_note():
       """A random note's address: {"url": "/notes/..."}."""
       return random_note()
   ```
   Test it in your browser at `http://localhost:5000/api/random-note`.
3. **The test (`backend/tests/test_api.py`):**
   ```python
   def test_random_note_is_a_real_note(client):
       url = client.get("/api/random-note").get_json()["url"]
       assert url.startswith("/notes/")
       assert client.get("/api" + url).status_code == 200
   ```

### 7.5 Recipe: Adding a new database column (`Note.tags`)

Suppose you want to save each note's `<!-- tags: Vector -->` comment in the database and send it in `/api/notes/<path>`:

1. **The model (`backend/models.py`, class `Note`):**
   ```python
   tags = db.Column(db.String(200))  # from <!-- tags: Vector -->
   ```
2. **The migration (from `backend/`):**
   ```bash
   ../venv/bin/flask db migrate -m "add tags to notes"
   # Read the generated file in migrations/versions/ to verify upgrade() and downgrade()
   ../venv/bin/flask db upgrade
   ```
3. **The importer (`backend/importer.py`, `parse_note()`):**
   ```python
   tags = _first(r"<!--\s*tags:\s*(.*?)\s*-->", content)
   return {"path": path, "title": title, "tags": tags, "html": content}
   ```
   Run `../venv/bin/flask import-content` to populate the new column.
4. **The loader (`backend/utils/content_loader.py`) and service (`backend/services/notes.py`):**
   ```python
   def load_note_tags(note_path):
       """The note's tags, e.g. "Vector", or None."""
       return db.session.scalar(db.select(Note.tags).where(Note.path == note_path))
   ```
   Include `"tags": load_note_tags(note_path)` in `note_page()`'s returned dictionary.
5. **The tests (`backend/tests/test_importer.py` and `test_api.py`):**
   ```python
   def test_parse_note_tags():
       html = '<!-- tags: Vector -->\n<h1 class="note-title">Dot Product</h1>'
       assert parse_note("math-c/01-plane-vectors/05-dot-product", html)["tags"] == "Vector"
   ```
   (See [docs/frontend-guide.md](frontend-guide.md) for displaying `data.tags` as a chip in `Note.jsx`.)

### 7.6 Writing a test (`pytest`)

A test is a function starting with `test_` in `backend/tests/`:

```python
def test_home_counts_match_the_database(client, app):
    response = client.get("/api/home")               # a fake browser asks for /api/home
    assert response.status_code == 200               # it answered "OK"
    data = response.get_json()                       # the JSON, as Python dicts and lists
    with app.app_context():                          # needed to read the database here
        assert data["stats"]["notes"] == Note.query.count()
```

- **Fixtures:** `client` and `app` come from `conftest.py`.
- **Running specific tests:** `../venv/bin/pytest tests/test_api.py` or `../venv/bin/pytest -k random -v`.
- **Good tests check behaviour, not exact content counts** (e.g. `data["stats"]["notes"] == Note.query.count()`, not `== 262`), so adding new notes never breaks tests.

### 7.7 Adding or updating Python packages

From the project root:

```bash
venv/bin/pip install some-package
venv/bin/pip freeze | grep -i some-package   # e.g. some-package==1.2.3
```

Add that exact line to `backend/requirements.txt` so Render, the Oracle server, and other developers install the same version.

---

## 8. Troubleshooting Backend Errors & Learning Path

### How to read a Python traceback

In Flask's terminal, read tracebacks **from the bottom up**:
- The **last line** is the error itself (e.g. `KeyError: 'tags'`).
- The lines above show the call stack leading to it. Find the last line that mentions **your** files (`services/…`, `api/…`).

### Common backend problems

| What you see | Why | Fix |
|---|---|---|
| `python: command not found` | Ubuntu only has `python3` | Use `python3 -m venv venv`, then always `../venv/bin/python` |
| `ensurepip is not available` | The venv module isn't installed | `sudo apt install python3-venv`, delete the half-made `venv/`, try again |
| `ModuleNotFoundError: No module named 'flask'` | You ran the system `python3`, not the venv's | Use `../venv/bin/python app.py` from `backend/` |
| `connection refused` / `OperationalError ... port 5432` | PostgreSQL isn't running | `docker compose up -d` from the project root; `docker ps` should list `learnsolo-db-1` |
| `permission denied while trying to connect to the Docker daemon` | Your user isn't in the `docker` group | `sudo usermod -aG docker $USER`, log out and back in |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Another PostgreSQL is already using port 5432 | Stop it (`sudo systemctl stop postgresql`), or check `docker ps` |
| `RuntimeError: DATABASE_URL is not set` (or `SECRET_KEY`) | No `.env` in the project root, or missing key | `cp .env.example .env` in the project root and set `SECRET_KEY` |
| `relation "notes" does not exist` / `column ... does not exist` | Migrations haven't been applied to the database | `../venv/bin/flask db upgrade` from `backend/` |
| `Address already in use` / `Port 5000 is in use` | Flask is already running in another terminal | Use that terminal or stop it (`ss -ltnp \| grep 5000`) |
| `Error: No such command 'import-content'` | `flask` was run outside `backend/`, so it can't find `app.py` | `cd backend` first |
| A change in `.py` doesn't show | Flask hasn't restarted | Set `FLASK_DEBUG=1` in `.env`, or restart Flask |

### Hands-on exercises for Backend & Database

1. **Level 4 (Python & Flask):**
   - Open `http://localhost:5000/api/home`, then read `backend/services/home.py` and match each JSON field to the line that builds it.
   - Build the `/api/random-note` route and test (Section 7.4).
   - Run `../venv/bin/pytest -v` and read `backend/tests/test_api.py`.
2. **Level 5 (PostgreSQL Database):**
   - Inspect the live tables with `docker compose exec db psql -U learnsolo learnsolo`:
     - `\dt` lists the tables,
     - `\d notes` shows the `notes` table's columns,
     - `SELECT path, title FROM notes LIMIT 5;` reads rows,
     - `\q` quits.
   - Follow Section 7.5 to add the `tags` column on a test branch.
