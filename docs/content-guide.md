# LearnSolo: project and content guide

## Start here

LearnSolo is a study site for Japanese high-school maths (Math I, II, III, A, B and C), written in English. It has three kinds of content:

| Kind | What it is | Where it lives | URL |
|---|---|---|---|
| **Notes** | One idea per page: concept, formula, proof, an interactive demo, worked examples | `content/notes/` | `/notes/...` |
| **Practice sets** | 6–7 problems with hints, solutions and an answer box, for a few notes at a time, then a topic review | `content/practice/` | `/practice`, `/practice/...` |
| **Past questions** | Exam papers, checked the same way as practice sets: **EJU Mock Papers** (original papers in the EJU format, 10 per course) and **University Past Questions** | `content/past/` | `/past`, `/past/...` |

**You write every page as an HTML file under `content/`.** `flask import-content` copies them into the PostgreSQL database, Flask sends them to the browser as JSON (`/api/...`), and the React app in `frontend/` shows them. To add a page, add a file and run the import (sections 6, 7 and 8). Nothing has to be registered.

**How a student moves through the site:**

```
Home (/)  ── subject tabs → course → topic ──►  Note  ◄─ previous / next ─►  Note
   │                                              │
   │                                              └─ "Practise this note" card
   ▼                                              ▼
Practice hub (/practice) ── tab per course ──►  Practice set ── Next practice → Topic review → Next topic
   │
   └─ bottom link ──►  Past questions (/past) ──┬─►  EJU Mock Papers (/past/eju) ── Course 1 / Course 2 tab ──►  Paper
                                                 └─►  University Past Questions (/past/university) ──►  Paper
```

The floating bar at the top of every page has the search box, which finds notes, sets and papers, plus links to Practice and Past questions.

### How to use this guide

This guide is written for learning: it explains the whole project, from the ideas to each file, so you can change and grow it yourself.

| If you want to… | Read |
|---|---|
| Understand how the site works: the four programs, and one click followed through the code | **Part A** (A1–A5) |
| Know what a file is for, and when to open it | **Part B** (B1–B5) |
| Write notes, practice sets and past papers | **Part C** (sections 0–8) |
| Look up what is saved, how to run and deploy, the API, the React files | **Part D** (sections 9–12) |
| Change or add something: a page, an API field, a database column, a test | **Part E** (E1–E9) |
| Fix an error | **Part F** (F1–F2) |
| Learn step by step, with small tasks in this project | **F3**, a learning path |

New to all of this? Read A1–A4 first, then try the tasks in F3 one level at a time.

### Map of the code

A one-table summary; Part B goes through every file. The server code lives in `backend/`, so every code path in this table (`app.py`, `api/`, `services/`, `utils/`…) is inside `backend/`. The React app is in `frontend/` (section 12), and `content/` stays at the project root.

Pages are served from a PostgreSQL database, not straight from the files. You still write content as HTML files in `content/`; `flask import-content` copies them into the database (section 10).

| Part | Files | Job |
|---|---|---|
| App | `app.py` | Creates the Flask app, connects the database and logins, registers the API and the React app, and the `flask import-content` command |
| React app | `frontend.py` | Sends the built React app (`frontend/dist`, made by `npm run build`): its files, and `index.html` for every other address so React shows the page. `/api/...` never gets it |
| Settings | `config.py`, `.env` (project root) | `DATABASE_URL` and `SECRET_KEY`; copy `.env.example` to `.env` |
| Database | `extensions.py`, `models.py`, `migrations/` | The tables (courses, topics, notes, problem_sets, users, progress) and their history for `flask db upgrade` |
| Importing content | `importer.py` | Reads every file in `content/` (titles, covers, exam labels…) and adds, updates or removes rows to match |
| Reading content | `utils/content_loader.py` | Reads notes, practice sets and past papers from the database |
| Page data | `services/home.py`, `notes.py`, `practice.py`, `past.py` | Works out what each page shows: lists, where a page sits, previous/next. Used by the API. `services/urls.py` builds page addresses (the React app's) |
| JSON API | `api/__init__.py`, `api/content.py` | `/api/...`: notes, practice sets and papers as JSON for the React frontend (section 11) |
| Accounts | `api/auth.py`, `api/progress.py` | Sign up, log in and out (Flask-Login cookies), and each user's saved practice progress (sections 9 and 11) |
| Tests | `tests/`, `pytest.ini` | `pytest` from `backend/` (section 10) |
| Names | `utils/courses.py` | Display names: `math-1` → "Math I", topic name fixes, subjects, past-question categories (`eju` → "EJU Mock Papers", `course-1` → "Course 1 (Basic)") |
| Pages | `frontend/src/` | The React app: pages, components, styles (section 12) |
| Demo helpers | `frontend/public/static/js/demos/` | Drawing tools for the TRY IT demos in notes, at `/static/js/demos/...` (section 4) |


# Part A: How the project works

This part explains the ideas behind the code, using LearnSolo's own files as the examples. You don't need to know Python or React before reading it. Each idea is explained the first time it appears, and A3 collects the words.

## A1. The big picture: four programs working together

When someone opens LearnSolo, four programs work together:

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
│    tables: courses, topics, notes, problem_sets, users, progress         │
└──────────────────────────────────────────────────────────────────────────┘

             content/*.html ──flask import-content──▶ the database
             (you write here)                          (the site reads here)
```

| Program | Language | Folder | Its one job |
|---|---|---|---|
| **React app** | JavaScript (JSX) | `frontend/` | Draws the pages in the browser, and reacts to clicks and typing |
| **Flask** | Python | `backend/` | Answers requests: sends data (JSON) and the React app's files |
| **PostgreSQL** | SQL | (a separate program; Docker on your laptop) | Keeps the data safely: content, accounts, progress |
| **The importer** | Python | `backend/importer.py` | Copies your HTML files from `content/` into the database |

**Why split it like this?** Each part can change without the others:
- You can redesign a page (React) without touching how data is stored (PostgreSQL).
- You can add notes (content) without touching any code.
- The same API could one day feed a phone app.

This is the most common way modern websites are built: a **frontend** (what runs in the browser) and a **backend** (what runs on the server), talking through an **API**.

**On your laptop there are two servers; on the live site, one:**

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

## A2. The languages, and where each one is used

| Language | What it's for | Where in this project | Looks like |
|---|---|---|---|
| **HTML** | The structure of a page: headings, paragraphs, links | `content/` (every note and set), `frontend/index.html` | `<h1 class="note-title">Law of Sines</h1>` |
| **CSS** | How things look: colours, sizes, layout | `frontend/src/styles/*.css` | `.note-header { background: #667eea; }` |
| **JavaScript** | Making pages do things in the browser | `frontend/src/*.js`, the demo scripts in notes | `button.addEventListener('click', check)` |
| **JSX** | JavaScript with HTML-like tags mixed in: how React pages are written | `frontend/src/**/*.jsx` | `return <h1>{title}</h1>` |
| **Python** | The server's code | `backend/*.py` | `def note_page(note_path):` |
| **SQL** | Asking the database for data | Written for you by SQLAlchemy, from Python (see A3) | `SELECT html FROM notes WHERE path = '...'` |
| **JSON** | The format data travels in between Flask and React | Every `/api/...` answer | `{"note_title": "Law of Sines", "nav": {...}}` |
| **YAML** | Settings files | `render.yaml` | `plan: free` |
| **Markdown** | Documents like this one | `README.md`, `docs/*.md` | `## A heading`, `**bold**` |
| **Bash** | Commands in the terminal | Commands in these docs | `cd backend && flask import-content` |

**A good order to learn them in:**
1. HTML and CSS: you already write HTML in `content/`.
2. JavaScript basics.
3. React.
4. Python basics, then Flask.
5. A little SQL.

F3 has a learning path with exercises in this project.

## A3. Words you'll meet in the code

**The web:**

| Word | Meaning | Example here |
|---|---|---|
| **Request / response** | The browser asks (request), the server answers (response). Every page, file and piece of data is one request | Opening a note makes about 2 requests to `/api/...` |
| **URL / address / path** | `https://site.com/notes/math-1/...`: the **path** is the part after the domain | `/notes/math-1/03-quadratic-functions/05-quadratic-formula` |
| **HTTP method** | What kind of request: **GET** = read, **POST** = do/create, **PUT** = save/replace, **DELETE** = remove | `GET /api/home`, `POST /api/auth/login` |
| **Status code** | A number in each answer: **200** OK, **201** created, **400** bad request, **401** not logged in, **404** not found, **409** conflict, **500** server error | `{"error": "not found"}` comes with 404 |
| **JSON** | Text format for data: objects `{...}`, lists `[...]`, strings, numbers, `true/false`, `null` | `{"user": {"email": "a@b.com"}}` |
| **API** | A set of addresses that answer with data instead of pages. Ours is everything under `/api/` | Section 11 lists them all |
| **Endpoint / route** | One address of the API and the function that answers it | `/api/home` → `api_home()` in `api/content.py` |
| **Cookie** | A small value the server asks the browser to keep and send back with every request | The login cookie (A5) |

**Flask and Python (backend):**

| Word | Meaning | Example here |
|---|---|---|
| **Flask** | A Python library for writing web servers | `app = Flask(__name__)` in `app.py` |
| **Decorator** | A line starting with `@` above a function, which adds something to it | `@api_bp.get("/home")` makes the function answer `GET /api/home` |
| **Blueprint** | A group of routes, registered on the app together | `api_bp` (all of `/api`), `frontend_bp` (the React app) |
| **Service** | Our own word: a function that works out a page's data (no web stuff in it) | `note_page()` in `services/notes.py` |
| **Model** | A Python class that describes one database table | `class Note(db.Model)` in `models.py` |
| **SQLAlchemy / ORM** | The library that turns Python into SQL, so you write `Note.query...` instead of SQL | `db.select(Note.html).where(Note.path == p)` |
| **Migration** | A small script that changes the tables (adds a column…), kept in `migrations/versions/` and applied with `flask db upgrade` | E7 |
| **Exception** | An error raised with `raise` and caught with `try/except` or an error handler | `raise ContentNotFound(path)` → JSON 404 |
| **venv** | A folder with this project's own Python packages | `venv/` on your laptop |
| **Environment variable** | A setting given to a program from outside its code | `DATABASE_URL`, `SECRET_KEY` (from `.env`) |

**React (frontend):**

| Word | Meaning | Example here |
|---|---|---|
| **Component** | A function that returns what to draw (JSX). Names start with a capital letter | `function Note() { ... return <header>...</header> }` |
| **Props** | The inputs a component gets, like HTML attributes | `<FloatBar location={location} nav={nav} />` |
| **State** | A value a component remembers; changing it redraws the component | `const [topicsOpen, setTopicsOpen] = useState(false)` |
| **Hook** | A function starting with `use` that gives a component some ability | `useApi(url)` (load data), `useState`, `useEffect` |
| **Effect** | Code that runs *after* drawing, e.g. to load data or listen for keys | `useEffect(() => {...}, [path])`: runs again when `path` changes |
| **Router** | Picks the page component for the address, without reloading the page | `<Route path="/notes/*" element={<Note />} />` in `App.jsx` |
| **`<Link to=...>`** | A link that changes the page without a full reload (faster than `<a href>`) | `<Link to="/practice">` |
| **Context** | A value every component can read without passing props down | `useAuth()` gives the logged-in user anywhere |
| **Vite** | The tool that runs the React app while you develop and **builds** it for the server | `npm run dev`, `npm run build` |
| **npm / package** | Node's package manager; packages are listed in `package.json` | `react`, `react-router`, `vite` |
| **Build** | Turning `src/` into a few plain files browsers can load fast | `frontend/dist/` |

## A4. Following one click through the code

The best way to understand the project is to follow **one request** from the click to the screen. Here is what happens when a student opens the note `/notes/math-1/03-quadratic-functions/05-quadratic-formula`. Open each file as you read.

**Step 1: React picks the page.** `frontend/src/App.jsx`:

```jsx
<Route path="/notes/*" element={<Note />} />
```

The address starts with `/notes/`, so React Router shows the `Note` component. The `*` matches the rest of the address.

**Step 2: the page asks for its data.** `frontend/src/pages/Note.jsx`:

```jsx
const path = useParams()['*']                          // "math-1/03-quadratic-functions/05-quadratic-formula"
const { data, error } = useApi(`/api/notes/${path}`)   // ask Flask for this note
...
if (error) return <LoadError error={error} what="note" />   // it failed: show a message
if (!data) return <p className="section">Loading…</p>      // not here yet
```

`useApi` (in `src/api.js`) calls `fetch()`, the browser's way to make a request, and redraws the page when the answer arrives. So `Note` is drawn at least twice: first with `data = null` ("Loading…"), then with the note.

**Step 3: the request reaches Flask.** On your laptop, Vite passes `/api/...` to Flask on port 5000 (`vite.config.js`). Online, Flask gets it directly. In `backend/app.py`, the app was told about two blueprints:

```python
app.register_blueprint(api_bp)        # /api/...
app.register_blueprint(frontend_bp)   # everything else: the React app
```

**Step 4: the route answers.** `backend/api/content.py`:

```python
@api_bp.get("/notes/<path:note_path>")
def api_note(note_path):
    return note_page(note_path)
```

- `api_bp` was made with `url_prefix="/api"` (`api/__init__.py`), so `"/notes/<path:note_path>"` means `/api/notes/...`.
- `<path:note_path>` catches the rest of the address, slashes included, and passes it in as `note_path`.
- The route only picks the right service function; that's the rule for every route here. When it returns a Python `dict`, Flask turns it into JSON.

**Step 5: the service works out the page's data.** `backend/services/notes.py`, `note_page()`:

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

**Step 6: the loader asks the database.** `backend/utils/content_loader.py`:

```python
def load_note(note_path):
    html = db.session.scalar(db.select(Note.html).where(Note.path == note_path))
```

SQLAlchemy turns this into the SQL `SELECT notes.html FROM notes WHERE notes.path = '...'`, using the `Note` model from `models.py`. The row got there earlier, when `flask import-content` (`importer.py`) read `content/notes/math-1/03-quadratic-functions/05-quadratic-formula.html`.

**Step 7: back in the browser, React draws the page.** `Note.jsx` returns JSX built from the data:

```jsx
<FloatBar location={location} nav={nav} ... />       // the bar at the top
<header className="note-header"> ... <h1>{title}</h1> ... </header>
<NoteContent html={content} ... />                   // the note itself
<PagerCard link={nav.prev} side="prev" />            // previous / next cards
```

`{title}` in JSX means "put the value of `title` here".

**Step 8: the note's HTML comes alive.** `frontend/src/components/NoteContent.jsx`:
1. puts the note's HTML on the page,
2. runs its `<script>` tags, which draw the TRY IT demo with `/static/js/demos/plot.js`,
3. calls `typeset()` (`src/mathjax.js`), so MathJax turns `$x^2$` into formulas.

**Step 9: it looks right** because of the CSS classes: `note-header` in `note-page.css`, `note-concept` and the other blocks in `note-blocks.css`. `src/styles.js` loads all of them.

**Try it yourself:**
- Open http://localhost:5000/api/notes/math-1/03-quadratic-functions/05-quadratic-formula in the browser. That's exactly what `Note.jsx` receives.
- Then press **F12** on a note page → **Network** tab → reload. You'll see the request to `/api/notes/...` and its answer.

**Every page follows the same pattern:**

| Page | React component | API | Service function |
|---|---|---|---|
| Home `/` | `pages/Home.jsx` | `/api/home` | `home_page()` in `services/home.py` |
| A note | `pages/Note.jsx` | `/api/notes/<path>`, `/api/notes` | `note_page()`, `notes_sidebar()` in `services/notes.py` |
| Practice hub | `pages/PracticeList.jsx` | `/api/practice` | `practice_courses()` in `services/practice.py` |
| A practice set | `pages/PracticeSet.jsx` | `/api/practice/<path>` | `practice_page()` in `services/practice.py` |
| Past question lists | `pages/PastList.jsx` | `/api/past`, `/api/past/<exam>` | `past_categories()`, `past_category_page()` in `services/past.py` |
| A past paper | `pages/PastPaper.jsx` | `/api/past/<exam>/<paper>` | `past_paper_page()` in `services/past.py` |
| Search box | `components/SearchBox.jsx` | `/api/search-index` | `build_search_index()` in `services/home.py` |
| Log in / sign up | `pages/Account.jsx` (via `auth.jsx`) | `/api/auth/...` | in `api/auth.py` itself |

So to change what a page **shows**, start in its component. To change what **data** it gets, start in its service function.

## A5. Logging in and saving progress, step by step

**Signing up** (`/signup`):
1. `pages/Account.jsx` shows the form. On submit it calls `signup(email, password)` from `useAuth()`.
2. `auth.jsx` sends `POST /api/auth/signup` with `{"email", "password"}` as JSON (`sendJson` in `api.js`).
3. `api/auth.py`, `api_signup()`:
   - checks the email and password length,
   - checks the email isn't taken,
   - saves a `User` with `generate_password_hash(password)`. The password itself is **never** stored.
4. `login_user(user, remember=True)` (Flask-Login) answers with a **cookie** holding the user's id, signed with `SECRET_KEY` so nobody can fake it.
5. From now on, the browser sends that cookie with every request. In Flask, `current_user` is that user.
6. Back in `auth.jsx`, `startAccount()`:
   - sends the progress saved in this browser to `POST /api/progress/merge`,
   - removes it from the browser,
   - keeps the account's progress in `progress.js`.
7. `setUser(user)`: the floating bar now shows "Log out". `App.jsx` gives `<Routes>` a new `key`, so the page redraws with the account's progress.

**Opening the site later:** `AuthProvider` asks `GET /api/auth/me`. The cookie is sent along, so Flask knows who it is and answers `{"user": {"email": ...}}`.

**Marking a problem "I got it":**
1. `practice.js` (the answer boxes and buttons) calls `writeProgress(path, saved)` in `progress.js`.
2. Logged out, `progress.js` writes to `localStorage` (storage inside the browser). Logged in, it sends `PUT /api/progress/<path>` with `{"0": "solved", ...}`.
3. `api/progress.py` checks the data (`_clean`) and saves one `Progress` row for this user and set.

The pages never need to know which of the two places is used. They only call `progress.js`. Hiding a detail behind a small set of functions like this is called **encapsulation**. It's why logging in didn't need changes all over the code.

# Part B: Every file, and when to open it

Each table says what the file is for and **when you'd open it**. Paths are from the project root.

## B1. The project root

| File / folder | What it is | Open it when… |
|---|---|---|
| `README.md` | The project's front page on GitHub: overview, folders, how to run it | You want the short version, or change the GitHub description |
| `docs/content-guide.md` | This guide | Learning the project, writing content |
| `docs/oracle-server.md` | How the Oracle Cloud copy of the site was built, every command explained | Looking after the Oracle server |
| `backend/` | The server: Flask, the database models, the importer, tests (B2) | Changing data, the API, accounts |
| `frontend/` | The React app: every page (B3) | Changing how pages look or behave |
| `content/` | Every note, practice set and past paper, as HTML files (Part C) | Writing content |
| `.env` | **Your** settings and secrets: `DATABASE_URL`, `SECRET_KEY`, `FLASK_DEBUG`. Not in git (`.gitignore`) | Setting up a new computer |
| `.env.example` | A template for `.env`, without real secrets. In git | Adding a new setting (add it here too, so others know it exists) |
| `docker-compose.yml` | Starts PostgreSQL in Docker on your laptop: user, password and port match `.env.example` | Rarely; `docker compose up -d` uses it |
| `render.yaml` | Render's "Blueprint": how the live site is built and started, its database, its settings | Changing the build or start commands, or the Render plan |
| `.gitignore` | Files git must never save: `.env`, `venv/`, `node_modules/`, `frontend/dist/`, caches | A new kind of generated or secret file appears |
| `.python-version` | The Python version used locally (by tools like pyenv) | Changing Python version |
| `LICENSE` | The MIT licence: others may reuse the code if they keep the copyright line | Never |
| `.github/pull_request_template.md` | The checklist GitHub puts into every new pull request | You want a different checklist |
| `.vscode/settings.json` | Settings for the VS Code editor | Rarely |

## B2. backend/ (Python, Flask)

**Starting the app and its settings:**

| File | What it does | Open it when… |
|---|---|---|
| `app.py` | **Builds the app**, in `create_app()`: loads the settings, connects the database and the login system, registers the two blueprints, and adds the `flask import-content` command. `python app.py` runs it locally; `gunicorn app:app` online | Adding a new command, a new blueprint, or a new extension |
| `config.py` | **Settings**, read from environment variables / `.env`: `DATABASE_URL`, `SECRET_KEY`, cookie safety settings, where the React build is | Adding a setting |
| `extensions.py` | Creates `db` (SQLAlchemy), `migrate` (Flask-Migrate) and `login_manager` (Flask-Login) once, so every file can import them | Adding a new Flask extension |
| `frontend.py` | Sends the **built React app** (`frontend/dist`): real files (JS, CSS, images) as they are, and `index.html` for every other address, so React can show the page | Changing how the React files are served or cached |
| `requirements.txt` | Python packages the app needs, with exact versions. `pip install -r requirements.txt` installs them | Adding a Python package (E9) |
| `requirements-dev.txt` | Extra packages for development only (`pytest`) | Adding a testing tool |

**The database:**

| File | What it does | Open it when… |
|---|---|---|
| `models.py` | **The tables**, one class each: `Course`, `Topic`, `Note`, `ProblemSet` (practice sets and past papers), `User`, `Progress`. Each `db.Column` is a column | Storing something new (E7) |
| `migrations/` | Made by Flask-Migrate (Alembic). `versions/` holds one script per change to the tables; `flask db upgrade` applies the ones not applied yet. `env.py`, `alembic.ini`, `script.py.mako` are its machinery | After `flask db migrate`: read the new file in `versions/` before committing it. Don't edit the machinery |
| `importer.py` | **`flask import-content`**: reads every file in `content/` (`_paths`, `_read`), picks out the title, intro, problem count… with regular expressions (`parse_note`, `parse_set`), then adds, updates or deletes rows to match (`_sync`, `import_content`) | A new piece of information should be read from content files (E7) |

**Answering requests:**

| File | What it does | Open it when… |
|---|---|---|
| `api/__init__.py` | Creates `api_bp`, the blueprint for everything under `/api`, and turns errors into JSON (`{"error": "not found"}` with 404). The last line imports the three route files | A new route file, or a new kind of error |
| `api/content.py` | **The read-only routes**: home, search index, notes, practice, past papers. Each is 1–3 lines that call a service | Adding a new address for content (E6) |
| `api/auth.py` | **Accounts**: `/api/auth/me`, `signup`, `login`, `logout`. Checks the email and password, hashes passwords, sets the login cookie | Changing sign-up rules (e.g. password length: `MIN_PASSWORD`) |
| `api/progress.py` | **Saved progress** of logged-in users: get all, save one set, delete one, merge the browser's progress in. `@login_required` on each | Changing what progress can hold |

**Working out each page's data** (no web code here, only plain Python data):

| File | What it does | Open it when… |
|---|---|---|
| `services/__init__.py` | Explains what services are (comment only) | |
| `services/home.py` | The home page's subject tabs, courses, topics and counts; and the search index | Changing the home page's data, or what search finds |
| `services/notes.py` | One note page: the note, where it sits ("Note 5 of 8"), previous/next, its practice sets; and the Topics sidebar's list | Changing note navigation or what a note page gets |
| `services/practice.py` | The practice hub (courses → topics → sets) and one set's page with its next/previous order | Changing practice order or data |
| `services/past.py` | Past question categories, groups (EJU Course 1/2), one paper's page, and renamed papers (`PaperMoved`) | Changing the past question pages' data |
| `services/urls.py` | The address of each kind of page (`/notes/...`, `/practice/...`) in one place | A page's address changes |

**Helpers:**

| File | What it does | Open it when… |
|---|---|---|
| `utils/content_loader.py` | **Reads content from the database**: the notes list, one note's HTML, practice sets, past papers. Defines `ContentNotFound` | A service needs content in a new way |
| `utils/courses.py` | **Display names**: `SUBJECTS` (home tabs), `COURSES` (`math-1` → "Math I"), `PAST_CATEGORIES` (exam names, icons, descriptions), `TOPIC_NAMES` (fixes) | Adding a course, subject or exam (E4) |

**Tests** (`pytest`, from `backend/`):

| File | What it checks |
|---|---|
| `pytest.ini` | pytest's settings: tests are in `tests/`, and they may import from `backend/` |
| `tests/conftest.py` | Shared setup ("fixtures"): creates the `learnsolo_test` database, imports the content, gives tests `app` and `client` (a fake browser) |
| `tests/test_api.py` | Every content route answers with the right shape of data, and unknown addresses give a JSON 404 |
| `tests/test_accounts.py` | Sign up, log in, log out, wrong passwords, saving and merging progress, that users can't see each other's progress |
| `tests/test_importer.py` | Reading titles and problem counts from files; a second import changes nothing |
| `tests/test_frontend.py` | Serving the built React app: `index.html` for page addresses, real files as they are, JSON 404 for `/api/...`, files outside the build refused |

## B3. frontend/ (React, Vite)

**Setup:**

| File | What it does | Open it when… |
|---|---|---|
| `package.json` | The project's npm settings: its packages (`react`, `react-router`, `vite`…) and scripts (`npm run dev`, `npm run build`) | Adding a package (E9) |
| `package-lock.json` | The **exact** version of every package and their packages, written by npm | Never by hand; commit it when npm changes it |
| `vite.config.js` | Vite's settings: the React plugin, port 5173, and the **proxy** that passes `/api` to Flask | Changing the dev server |
| `index.html` | **The one HTML page.** Loads Bootstrap (CSS framework), Font Awesome (icons), MathJax (formulas) and the demo helpers, then `src/main.jsx`. React draws everything inside `<div id="root">` | Adding something every page needs, like a font or a library |
| `public/static/favicon.png` | The tab icon | Changing the icon |
| `public/static/js/demos/` | `geom.js`, `plot.js`, `venn.js`: the drawing helpers for TRY IT demos (section 4). Files in `public/` are served as they are | Adding a drawing tool for demos |

**The app's backbone** (`src/`):

| File | What it does | Open it when… |
|---|---|---|
| `main.jsx` | **The starting point.** Draws `<App />` inside `#root`, wrapped in `BrowserRouter` (addresses) and `AuthProvider` (who is logged in), and loads the styles | Rarely: wrapping the whole app in something new |
| `App.jsx` | **Which page for which address**: one `<Route>` per page | Adding a page (E5) |
| `api.js` | Talking to Flask: `fetchJson(url)`, `sendJson(method, url, data)`, and the `useApi(url)` hook | Changing how all requests are made |
| `auth.jsx` | `AuthProvider` and `useAuth()`: who is logged in, `signup`, `login`, `logout`, and moving progress into the account | Changing what happens at log in or out |
| `progress.js` | **The only place progress is read and saved**: in `localStorage` when logged out, in the account when logged in | Changing how progress is stored |
| `practice.js` | Adds the answer boxes, answer checking (`toNumber`) and "I got it / Review later" buttons to a set's problems | Changing how answers are checked or marked |
| `pageHooks.js` | Shared hooks: text size (`useTextSize`), ← / → keys (`useArrowKeys`), the tab title (`usePageTitle`), back to top (`useScrollToTop`) | Changing these behaviours on every page |
| `mathjax.js` | `typeset(element)`: draws formulas inside an element, once, one job at a time | Formulas draw wrongly |
| `styles.js` | Imports every CSS file in `styles/` | Adding a new CSS file |

**Pages** (`src/pages/`, one per kind of address):

| File | Address | What it shows |
|---|---|---|
| `Home.jsx` | `/` | Hero with a live demo, subject tabs, course cards (icon and colour per course: `COURSE_STYLE`), "how a note works", links |
| `Note.jsx` | `/notes/...` | Header (course, topic, title, "Note 5 of 8"), the note, "Practise this note", previous/next cards, Topics sidebar |
| `PracticeList.jsx` | `/practice` | Course tabs; a card per topic listing its sets with "Solved n of m" |
| `PracticeSet.jsx` | `/practice/...` | Header with "Solved 2 of 5" and "Start again", the problems, "Review the notes" and the next set |
| `PastList.jsx` | `/past`, `/past/<exam>` | A card per exam; then one exam's papers (with tabs for EJU Course 1/2) |
| `PastPaper.jsx` | `/past/<exam>/...` | One paper, like a practice set; old addresses of renamed papers redirect |
| `Account.jsx` | `/login`, `/signup` | The email + password form; goes back to the page you came from |
| `NotFound.jsx` | anything else | "Page not found" |

**Components** (`src/components/`, pieces used by several pages):

| File | What it is | Used by |
|---|---|---|
| `FloatBar.jsx` | The bar at the top: logo, where you are, search, text size, previous/next, Topics, Log in / Log out, and the ☰ phone menu | Every page |
| `SearchBox.jsx` | The search box: loads `/api/search-index` once, shows up to 8 matches, keyboard ↑ ↓ Enter Esc | `FloatBar` |
| `TopicsSidebar.jsx` | The Topics sidebar on a note: course and topic dropdowns, the topic's notes | `Note` |
| `NoteContent.jsx` | Puts a note's or set's HTML on the page, runs its scripts, then draws the formulas | `Note`, `PracticeSet`, `PastPaper` |
| `HubTabs.jsx` | A row of tabs with a panel each (remembered in `localStorage`), and the "Solved n of m" badge | `PracticeList`, `PastList` |
| `HeroDemo.jsx` | The draggable tangent-line demo on the home page | `Home` |
| `LoadError.jsx` | "Sorry, this … doesn't exist" / "couldn't be loaded" | Every page with data |

**Styles** (`src/styles/`, plain CSS; each starts with a comment saying what it styles):

| File | Styles |
|---|---|
| `floatbar.css` | The floating bar and search results |
| `home.css` | The home page |
| `note-page.css` | The page around a note: colours (`--brand`…), header, card width, sidebar, previous/next cards |
| `note-blocks.css` | The 8 blocks inside notes (CONCEPT, FORMULA…), with their colours and labels |
| `practice.css` | A practice set or paper: problems, levels, answer boxes, buttons, "Practise this note" |
| `practice-list.css` | The practice hub and the tabs on `/past/eju` |
| `past.css` | The past question lists |
| `account.css` | The log in / sign up form and the account button |

## B4. content/ and docs/

| Folder | What's in it |
|---|---|
| `content/notes/<course>/<topic>/<nn-name>.html` | The notes (sections 0–6) |
| `content/practice/<course>/<topic>/<nn-name>.html` | Practice sets (section 7) |
| `content/past/<exam>/[<group>/]<nn-name>.html` | Past papers (section 8) |
| `docs/` | Guides in Markdown: this one and `oracle-server.md` |

## B5. Files you don't edit by hand

These are made by tools. Some are in git, some aren't:

| File / folder | Made by | In git? |
|---|---|---|
| `frontend/node_modules/` | `npm install` / `npm ci`: the packages' code (thousands of files) | No |
| `frontend/dist/` | `npm run build`: the finished site | No (Render and the Oracle server build it themselves) |
| `frontend/package-lock.json` | npm, when packages change | **Yes**: commit it with `package.json` |
| `backend/migrations/versions/*.py` | `flask db migrate` | **Yes**: read it, then commit it with the model change |
| `venv/` | `python -m venv venv` + `pip install` | No |
| `__pycache__/`, `.pytest_cache/` | Python and pytest, to run faster | No |
| `.env` | You, from `.env.example` | **Never**: it holds secrets |

# Part C: Writing content

Sections 0–6 cover notes, section 7 practice sets, section 8 past questions.

## 0. Folders and file names

```
content/
├── notes/<course>/<topic>/<nn-name>.html      the notes
├── practice/<course>/<topic>/<nn-name>.html   practice sets (same course and topic folders as notes/)
└── past/<category>/[<group>/]<nn-name>.html   past question papers (eju/course-1/, eju/course-2/, university/)
```

- Every folder and file name is **lowercase words joined by hyphens**, starting with a two-digit number that sets the order: `content/notes/math-1/03-quadratic-functions/05-quadratic-formula.html`.
- Courses: `math-1`, `math-2`, `math-3`, `math-a`, `math-b`, `math-c`. Topics are numbered in textbook order.
- Keep names short and plain ASCII: write `x2` for x², `minus`, `over`, `theta`, `alpha` for symbols. The page title in the file's `<h1>` can use any characters.
- The path without `content/<kind>/` and `.html` is the page's URL: `/notes/math-1/03-quadratic-functions/05-quadratic-formula`.
- Display names live in **`utils/courses.py`**: `math-1` → "Math I", past categories → their names and descriptions. Topic names are made from the folder name (`03-quadratic-functions` → "Quadratic Functions"); add an entry to `TOPIC_NAMES` only if that gives the wrong name.

A note file is not a full web page. It is a fragment of HTML: `flask import-content` saves it in the database, and the React page (`Note.jsx`) puts it inside the shared page layout. Every note uses the same structure, so they all look the same and are written the same way.

## 1. How a note reaches the screen

```
content/notes/<course>/<topic>/<nn-name>.html   ← the note file (an HTML fragment)
        │
flask import-content   importer.py reads each file and its title into the notes table
        │
utils/content_loader.py   gets the notes list and the note's HTML from the database
        │
api/content.py         /api/notes/<path> → services/notes.py loads the note, works out where it sits
                       (Math C › Plane Vectors · 17 of 17) and the previous/next notes, as JSON
        │
frontend/src/pages/Note.jsx   React, at /notes/<path>: floating bar, Topics sidebar, purple
                       header with the title, previous/next cards
        │
components/NoteContent.jsx   puts the note's HTML on the page, runs its scripts, draws the maths
```

- **`importer.py`** walks `content/notes/` and turns each file path into a URL path, for example `math-c/01-plane-vectors/17-line-perpendicular-to-a-vector`. The paths are sorted and the order is saved with each row, so the number at the start of each name sets the order of the previous/next buttons.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The loader reads it for the sidebar and search, and the route shows it in the purple header (the note's own `<h1>` is hidden by the CSS, so the title isn't shown twice). So the title can be longer than the filename (for example `02-graph-of-y-ax2` has the title "Graph Shape of y = ax²").
- **Course and topic folders** (for example `math-c` / `01-plane-vectors`) become the Course and Topic dropdowns in the Topics sidebar.
- **`frontend/index.html`** loads MathJax with `$...$` as the maths delimiter, and `src/styles/note-blocks.css` holds the shared note design.

## 2. Inside a note file

Using `content/notes/math-c/01-plane-vectors/17-line-perpendicular-to-a-vector.html` as the example:

| Lines | Part | Purpose |
|---|---|---|
| 1 | `<!-- tags: Vector -->` | Topic tag |
| 2–7 | Header comment | Topic name in English and Japanese, plus which shared files the note uses |
| 8 | `<article class="note-page">` | Wraps the note so the shared CSS applies to it |
| 10 | `<h1 class="note-title" data-topic="Vector">` | Title, read for the header, sidebar and search (hidden inside the note itself) |
| 13–110 | The 8 blocks | See below |
| 114–115 | `<script src=...>` | Loads the drawing helpers |
| 116–146 | Demo script | Draws the interactive TRY IT demo |

### The 8 blocks, always in this order

| Block | Class | Label shown | What it contains |
|---|---|---|---|
| 1 | `note-concept` | CONCEPT | The idea in plain words, with the Japanese term in brackets |
| 2 | `note-formula` | FORMULA | `.formula-main` holds the big formula; `.symbols` holds a short note under it |
| 3 | `note-proof` | WHY IT WORKS | A short numbered proof |
| 4 | `note-demo` | TRY IT | A `<canvas>`, any sliders (`.controls`) and a readout box (`.output`) |
| 5 | `note-example` ×3–5 | EXAMPLE | A `.question`, then `<details>` holding the steps (`.note-steps`) and the `.answer` |
| 6 | `note-warning` | WATCH OUT | A common mistake |
| 7 | `note-tip` | TIP | A shortcut or hint |
| 8 | `note-takeaways` | REMEMBER | 3 bullet points |

Notes don't contain a `<style>` block. The labels, colours and card shapes all come from `frontend/src/styles/note-blocks.css`, where each class gets its own accent colour and its label through `::before`. To change how every note looks, edit that one file.

### Content rules

- Stay within the Japanese high-school curriculum. For example, the vector notes don't use the cross product, tan⁻¹ / cos⁻¹, or vectors in more than 3 dimensions; angles are found from cos θ and sin θ.
- Write maths between `$...$` (inline) or `$$...$$` (displayed). Write `<` and `>` inside maths as `&lt;` and `&gt;`.

## 3. The demo script

Every demo script has the same shape:

```js
(function () {                                   // wrapper: names can't clash with other scripts
  const output = document.getElementById('vhOutput');     // ids use a unique prefix per note (vh…)
  const half = ([x, y]) => [Math.round(x*2)/2, ...];      // small local helpers
  NotePlot.graph(canvas, {
    x: [-6.2, 6.2], y: [-4, 4],                  // visible range in maths units
    points: { A: [-1, 0], N: [0, 2] },           // draggable points
    constrain: { A: half },                      // snap rule for each point
    draw(g, P) { g.line(...); g.seg(...); output.textContent = ...; }  // runs again on every drag
  });
})();
```

- **The comment at the top** of each script says what the user can drag and what each colour means.
- **Unique id prefixes** (`vh`, `vf`, `vw`…) stop two notes' canvases or outputs from clashing.
- **Sliders** call `plot.redraw` when they change, for example `tBox.addEventListener('input', plot.redraw);` in Vector note 15.
- **Readouts** wrap negative numbers in brackets (`2×(−1)`, not `2×-1`); several notes have a small `par` helper for this.

## 4. Shared helper files

| File | Used by | What it gives a note |
|---|---|---|
| `/static/js/demos/geom.js` | Geometry notes | `NoteGeom.board()`: draggable points in pixel coordinates, plus maths helpers (`dist`, `mid`, `angle`…) |
| `/static/js/demos/plot.js` | Graph and vector notes (built on `demos/geom.js`, so load both) | `NotePlot.graph()`: maths coordinates with y pointing up, automatic axes and grid, and drawing tools like `g.fn`, `g.seg`, `g.line`, `g.poly`, `g.region`. The `plain: true` option hides the axes and grid, for the 3D drawings |
| `/static/js/demos/venn.js` | Set notes | `NoteVenn`: parses and formats sets and draws Venn diagrams |
| `src/styles/note-blocks.css` | Every note | All the block styles |

The demo helpers are in `frontend/public/static/js/demos/`. Notes load them by their address (`<script src="/static/js/demos/venn.js">`), and `geom.js` and `plot.js` are already loaded on every page. Paths starting with `src/` are in `frontend/`.

The page around the note, which notes don't need to touch:

| File | What it does |
|---|---|
| `src/components/FloatBar.jsx`, `SearchBox.jsx`, `src/styles/floatbar.css` | The floating bar on every page: logo, where you are, search (loads `/api/search-index`), text size, previous/next, Topics, Log in |
| `src/styles/note-page.css` | Note page layout: background, header, the card (920px wide), sidebar, previous/next cards |
| `src/pages/Note.jsx`, `src/components/TopicsSidebar.jsx`, `src/pageHooks.js` | Topics sidebar, A−/A+ text size (saved), ← / → keys for previous/next (not while a slider or text box has focus) |

Each helper file begins with a comment listing its functions and their options, so read that first when writing a new demo.

## 5. Subjects on the home page

The home page (`frontend/src/pages/Home.jsx`) groups the course folders into subject tabs. The list of subjects is `SUBJECTS` in `utils/courses.py`:

- Each course in `COURSES` names its subject. A course folder not listed there goes under the subject named by its first word: `physics-basic` → Physics.
- A subject with no notes yet shows a **Coming soon** tab. It switches on by itself once a folder for it has notes.
- A folder that matches no subject in the list gets its own tab, named after the folder's first word (for example `chemistry-basic` → Chemistry). Add it to `SUBJECTS` to choose its icon and tab order.
- Add the new course to `COURSES` to give it a display name (for example `physics-basic` → "Physics Basic").

To start Physics, add notes like `content/notes/physics-basic/01-motion/01-velocity.html`, using the same 8-block layout as the maths notes.

## 6. Adding a new note

1. Copy an existing note from the same folder.
2. Rename it with the next number, for example `18-something.html`.
3. Change the tag, the title and the 8 blocks.
4. Give the demo a new id prefix and rewrite its `draw()` function.

Then run `flask import-content` (section 10); you don't need to register the note anywhere else.

## 7. Practice sets

Practice problems with worked solutions are HTML pages too, kept in their own folder with the same course/topic folders as the notes:

```
content/practice/math-c/01-plane-vectors/02-dot-product.html   →   /practice/math-c/01-plane-vectors/02-dot-product
```

- **Sets in a topic:** first the **concept sets**, each covering 3–5 related notes (about 6 problems, from `basic` up to one `exam` question in parts), then the **topic review**, a mix of the whole topic, named `<nn>-topic-review.html`. Every note should be used by at least two problems.
- **Top comment:** a concept set says which notes it covers, as `Concept set 2 for Plane Vectors: covers notes 07–11.` The practice page shows this text ("Covers notes 07–11"), so write it the way a student should read it (`05, 10 and 11` is fine too).
- **Renaming a set** changes its URL, and saved progress is stored by URL. List the old paths in `data-moved-from` on the `<article>` (separated by `|`); `src/progress.js` (`moveOldProgress`) moves saved progress to the new path the first time the page opens, and the practice page reads it from the old paths until then.
- **The practice page** (`/practice`, the "Practice" link in the floating bar and on the home page) has a tab per course and a card per topic. Each card lists the topic's sets in order, with the notes they cover and "Solved 2 of 6" from the progress saved on the device; the topic review is marked **Topic review**. The past questions are linked at the bottom. `/practice#math-a` opens on Math A.
- The set page (`src/pages/PracticeSet.jsx`) has the same floating bar, header and card as a note. The header shows "Solved 2 of 5"; "Practice" in the floating bar goes back to the practice page.
- **At the end of a set**, the next card leads on in the practice page's order: **Next practice** (the next set in the topic), **Topic review**, then **Next topic** (the next topic's first set; after a course's last topic, the next course). The ← / → buttons follow the same order.
- After each note, a **Practise this note** card opens the first concept set whose problems link to that note (via "Uses:"), and the topic's other sets are listed under it. The search box finds practice sets too.
- Styles: `src/styles/practice.css` (a set) and `src/styles/practice-list.css` (the practice page). Code: `frontend/src/practice.js`, `src/pages/PracticeList.jsx`, `src/pages/PracticeSet.jsx` and `src/components/HubTabs.jsx` (section 12). Loader: `utils/content_loader.py`. API: `/api/practice` and `/api/practice/...` in `api/content.py`.
- A topic needs at least one note, because the header links back to the topic's notes. Sets in a topic without notes are left off the practice page.

A practice file is a fragment like a note:

```html
<article class="note-page practice-page">
  <h1 class="practice-title">Dot Product and Angles</h1>
  <p class="practice-intro">What this set practises.</p>

  <section class="practice-problem" data-level="basic" data-answer="45" data-placeholder="angle in degrees">
    <h2>Problem 1</h2>
    <p class="question">The question, with maths in $...$.</p>
    <p class="related">Uses: <a href="/notes/...">The note it practises</a></p>
    <details class="hint"><summary>Show hint</summary><p>A nudge, not the answer.</p></details>
    <details class="solution">
      <summary>Show solution</summary>
      <ol class="note-steps"><li>Step 1</li><li>Step 2</li></ol>
      <p class="answer">The final answer</p>
    </details>
  </section>
</article>
```

- `data-level`: `basic`, `standard`, `challenge` or `exam` (the badge and colour).
- `data-answer` (optional): the value the answer box checks against. Write it the way a student would type it: `45`, `6`, `2√7`, `5/2`, `√3/2`, `5π/6`, `3e`, `4/e^2`, `π^2/2` (digits, `+ − × ÷ ^ ( )`, `√`, `π` and `e` are understood). Typed answers count as correct within 0.01, so `5.29` is accepted for `2√7`. Leave it out for problems whose answer isn't one number (proofs, "find all…").
- The answer box and the "I got it / Review later" buttons are added by `practice.js`; don't write them in the file.
- Keep the solution steps short and numbered, like the examples in the notes, and put any extra insight in `<p class="practice-note">` inside the solution.

## 8. Past questions

Past exam questions use the same file format as practice sets, grouped by exam instead of by topic. There are two categories:

| Folder | Name on the site | What it holds |
|---|---|---|
| `content/past/eju/course-1/`, `course-2/` | **EJU Mock Papers**, with a Course 1 (Basic) and a Course 2 (Advanced) tab | 10 original mock papers per course, 6 problems each |
| `content/past/university/` | **University Past Questions** | Longer problems with written solutions |

An exam folder can be split into subfolders, as the EJU papers are by course:

```
content/past/university/01-sample-paper-proof-and-calculus.html   →   /past/university/01-sample-paper-proof-and-calculus
content/past/eju/course-1/03-mock-paper.html                       →   /past/eju/course-1/03-mock-paper
```

- **Past questions** (`/past`, linked at the bottom of the practice page and from "More to explore" on the home page) shows one card per folder in `content/past/`. Clicking a card lists its papers (`/past/<folder>`), and each paper opens like a practice set (`src/pages/PastPaper.jsx`) with hints, solutions and answer boxes. The search box finds papers too.
- **Subfolders** (`eju/course-1/`, `eju/course-2/`) become tabs on the folder's list page, which uses the practice hub's tabs, rows and "Solved n of m" badges (`practice-list.css`, `src/components/HubTabs.jsx`). Previous / next on a paper stay inside its subfolder, and the floating bar shows "EJU Mock Papers › Course 1 (Basic) · Paper 3 of 10". `/past/eju#course-2` opens on Course 2. Name the subfolders under `"groups"` in `PAST_CATEGORIES`.
- **New exam:** make a new folder in `content/past/`. Give it a name, an icon and a one-line description in `PAST_CATEGORIES` in `utils/courses.py` (without one it gets a generic description). API: `/api/past/...` in `api/content.py`.
- **New paper:** add an HTML file to the folder (or subfolder). Number files `01-`, `02-`, … to set the order. Use `data-level="exam"` for each problem.
- **EJU mock papers** (10 per course) follow the exam's layout: six problems in the order I Q1, I Q2, II Q1, II Q2, III, IV. Course 1 and Course 2 share the kind of question in Section I (quadratic functions, then counting and probability). After that, Course 1 has numbers and sets, quadratics, integers and figures; Course 2 has sequences, logarithms or trigonometry, vectors or complex numbers, then Math III differentiation and integration. Each problem names its exam question in a label after the title, and the list page shows these labels as the paper's topics:

```html
<h2>Problem 1 <span class="exam-label">I Q1 · Quadratic functions</span></h2>
```

- **Renaming a paper:** list the old paths in `data-moved-from`, with `past/` in front (`data-moved-from="past/eju/02-practice-paper-course-1"`). Saved progress moves to the new path, and old links redirect to it.
- **Problems in parts:** list the parts right after the question and number the solution steps the same way. The answer box checks one number, so say which part to type in:

```html
<p class="question">A bag holds 4 red balls and 3 white balls…</p>
<ol class="parts">
  <li>(1) Find the probability that exactly 2 are red.</li>
  <li>(2) Find the expected number of red balls. (Type this one in the box.)</li>
</ol>
```

- Real past papers belong to the exam's publisher (JASSO for the EJU, or the university), so check you may republish a paper before adding it. The EJU mock papers are original problems in the same format, not copies of past papers.
- Styles: `src/styles/past.css` (the list pages), `src/styles/practice-list.css` (the tabs on `/past/eju`) and `src/styles/practice.css` (the paper itself, including `.exam-label`).
- The search box lists EJU papers as "Past question: Mock Paper 3 · Course 1" with "EJU Mock Papers · Course 1 (Basic) · Past question" under it.

# Part D: Reference

How saving, running, the API and the React app work, for looking things up.

## 9. What is saved, and where

Anyone can make an account (`/signup`) or log in (`/login`) with the button at the right of the floating bar.

- **Logged out**, everything a student does is kept in the browser's `localStorage`. It stays on that one device and browser.
- **Logged in**, practice progress is saved to their account in the database (the `progress` table, one row per set per user), so it is the same on every device. `src/progress.js` loads it all once at log in and sends each change to `PUT /api/progress/<path>`.
- **At log in or sign up**, progress saved in the browser is added to the account (`POST /api/progress/merge`) and then removed from the browser. Where both have the same set, they are combined problem by problem: "solved" in either place wins, so nothing is lost.
- Tabs and text size always stay in the browser.

The `localStorage` keys:

| Key | Written by | What it holds |
|---|---|---|
| `practice:<path>` | `src/progress.js` (logged out only) | One practice set's progress, for example `practice:math-1/03-quadratic-functions/01-vertex-form`. It is a JSON map from problem number (from 0) to `"solved"` or `"review"`. Past papers use `practice:past/<path>`, for example `practice:past/eju/course-1/03-mock-paper`, so they never clash with a set |
| `practice-hub:course` | `src/components/HubTabs.jsx` | The course tab last opened on `/practice` |
| `past-tab:<exam>` | `src/components/HubTabs.jsx` | The tab last opened on a past-question list, for example `past-tab:eju` |
| `noteFontSize` | `src/pageHooks.js` | The A−/A+ text size, from 70 to 150 (%) |

Progress is stored under the set's path, both in the browser and in accounts. Renaming a set loses it unless you add `data-moved-from` (section 7); the progress then moves to the new path the first time the set is opened.

**Passwords** are never stored, only a hash of them (`werkzeug.security`), and the login cookie can't be read by JavaScript (HttpOnly). It is signed with `SECRET_KEY`, so keep that secret and long (`.env.example` shows how to make one).

## 10. Running and deploying

**On your computer** (from the project root, once):

```bash
python -m venv venv && venv/bin/pip install -r backend/requirements.txt
cp .env.example .env              # then set SECRET_KEY to a long random string
docker compose up -d              # starts PostgreSQL (again after each reboot)
cd backend
../venv/bin/flask db upgrade      # creates the tables
../venv/bin/flask import-content  # copies content/ into the database
```

Then, from `backend/`:

```bash
../venv/bin/python app.py         # the API on http://localhost:5000 (reloads when Python files change, FLASK_DEBUG=1 in .env)
```

and, in a second terminal, the React app (section 12): `cd frontend && npm run dev`, then open http://localhost:5173.

**After editing content**, run `../venv/bin/flask import-content` from `backend/` and refresh the page. It prints how many rows were added, updated and removed; running it twice in a row changes nothing. The app doesn't need a restart.

**After changing `models.py`**, make a migration and apply it: `../venv/bin/flask db migrate -m "what changed"`, check the new file in `migrations/versions/`, then `../venv/bin/flask db upgrade`. Commit the migration file with the model change.

**Tests**, from `backend/` (once: `../venv/bin/pip install -r requirements-dev.txt`):

```bash
../venv/bin/pytest          # every test; add -v to see each name
```

They create and use a separate `learnsolo_test` database, filled from `content/`, so your own database is never changed. Run them before opening a pull request.

**On the web:** the site runs on Render, set up by `render.yaml` (a Render "Blueprint"). It has two parts: a PostgreSQL database (`learnsolo-db`) and the web service (`learnsolo`). On every deploy Render:

1. **Builds:** installs `backend/requirements.txt`, then runs `npm ci && npm run build` in `frontend/`.
2. **Starts**, from `backend/`: `flask db upgrade` (new tables or columns), `flask import-content` (the content as it is in `main`), then `gunicorn app:app`, the web server. Flask answers `/api/...` and sends the built React app for everything else.

So editing content needs no extra step online: merge it, and the import runs when the new version starts.

The settings are in `render.yaml` too:
- `DATABASE_URL` is filled in from the database.
- `SECRET_KEY` is made once by Render, as a long random value.
- `SESSION_COOKIE_SECURE=1` makes login cookies https-only.
- `NODE_VERSION` is the Node.js version for the build.

Nothing secret is in the repo.

**Free plan limits:**
- The web service sleeps after a quiet while, so the first visit after that takes about a minute.
- **A free Render database is deleted 30 days after it is made**, with its accounts and progress. To keep them, change the database's `plan` in `render.yaml` to a paid one (for example `basic-256mb`) before then, or point `DATABASE_URL` at another PostgreSQL host. The content itself is never lost: it comes back from `content/` with `flask import-content`.

It deploys again when `main` changes, so the usual flow is:

1. Make a branch.
2. Commit.
3. Open a pull request.
4. Merge into `main`.

**A second copy on an Oracle Cloud server** (https://learnsolo.duckdns.org) runs the same code with its own database and accounts. It doesn't update by itself: after merging, log in to the server and run `~/deploy.sh`. How it was built, and every command explained: `docs/oracle-server.md`.

**Before merging**, open the pages you changed in the browser. For a practice set, also check:
- every `data-answer` is accepted when typed in,
- the "Uses:" links open the right notes,
- the set appears on `/practice`.

## 11. JSON API

Everything under `/api` returns JSON instead of a page. The React frontend uses it, and you can open any of these in the browser to see the data (A4 follows one through the code). The data comes from `services/`; fields called `content` hold the HTML of the note, set or paper.

| Address | Returns |
|---|---|
| `/api/home` | `subjects` (tabs → courses → topics) and `stats` (counts) |
| `/api/search-index` | `[{title, where, url}]` for every note, set and paper |
| `/api/notes` | `notes_meta` (every note's path and title, in order) and `display_names` for the Topics sidebar |
| `/api/notes/<path>` | `note_title`, `content`, `location`, `nav` (prev/next) and `practice` (sets for this note) |
| `/api/practice` | `courses` → topics → sets |
| `/api/practice/<path>` | one set: `title`, `count`, `content`, `location`, `nav` |
| `/api/past` | `categories`, each with its papers |
| `/api/past/<exam>` | one category: name, about, `papers`, `groups` |
| `/api/past/<exam>/[<course>/]<paper>` | one paper, like a set, plus `paper` (its category) |

Anything that doesn't exist answers `404` with `{"error": "not found"}`. The old address of a renamed paper answers `404` with `{"error": "moved", "moved_to": "/past/..."}`.

**Accounts** (`api/auth.py`). They send and receive JSON; mistakes answer with `{"error": "..."}`, a message to show the user.

| Request | Does |
|---|---|
| `GET /api/auth/me` | `{"user": {"email"}}`, or `{"user": null}` when logged out |
| `POST /api/auth/signup` `{"email", "password"}` | Makes an account and logs in (`201`). `400` for a bad email or a password under 8 characters, `409` if the email has an account |
| `POST /api/auth/login` `{"email", "password"}` | Logs in, or `401` "Wrong email or password." (the same message whichever is wrong) |
| `POST /api/auth/logout` | Logs out |

**Progress** (`api/progress.py`), only when logged in; otherwise `401` `{"error": "login required"}`. A set's progress is the same map as in the browser, e.g. `{"0": "solved", "2": "review"}`.

| Request | Does |
|---|---|
| `GET /api/progress` | `{"progress": {<path>: {...}}}`: every set with progress |
| `PUT /api/progress/<path>` | Saves one set's progress (`{}` for "Start again") |
| `DELETE /api/progress/<path>` | Forgets one set's progress |
| `POST /api/progress/merge` `{"progress": {...}}` | Adds the browser's progress to the account ("solved" wins) and returns all of it |

## 12. React frontend

Every page of the site is a React page in `frontend/`: the home page, notes, practice, past questions, log in and sign up. Any other address shows "Page not found".

**Run it** (Flask must be running too, for the data):

```bash
cd frontend
npm install        # once
npm run dev        # http://localhost:5173
```

`npm run dev` starts Vite, which shows changes as soon as you save a file. Requests to `/api/...` are passed on to Flask on :5000 (`vite.config.js`). Files in `public/` (the favicon and `/static/js/demos/`) are served as they are.

**Build it** for the live site: `npm run build` puts the finished files in `frontend/dist/` (git-ignored). Flask sends them (`backend/frontend.py`): `index.html` for every page address, so opening or refreshing `/notes/...` works, and React then shows the right page. Render runs the build on every deploy (section 10).

| File | Job |
|---|---|
| `index.html` | The one HTML page. Loads Bootstrap, Font Awesome, MathJax and the demo helpers (`/static/js/demos/`) once for every page |
| `src/main.jsx` | Starts React and the router |
| `src/App.jsx` | Which page component to show for which address. Add a `<Route>` here for a new page (E5) |
| `src/styles.js`, `src/styles/` | The CSS, one file per kind of page; `styles.js` imports them all |
| `public/static/` | Copied as they are: `favicon.png` and `js/demos/` (the notes' drawing helpers) |
| `src/api.js` | `fetchJson(url)` and the `useApi(url)` hook: load data from `/api/...`; `sendJson(method, url, data)` sends data (log in, save progress) |
| `src/auth.jsx` | `<AuthProvider>` and `useAuth()`: who is logged in, and `signup`, `login`, `logout`. Asks `/api/auth/me` when the site opens |
| `src/pages/Account.jsx`, `src/styles/account.css` | The `/login` and `/signup` pages (one form), and the account button's style. Afterwards you go back to the page you came from |
| `src/mathjax.js` | `typeset(element)`: draw the `$...$` formulas inside an element, once |
| `src/pages/Home.jsx` | The home page, from `/api/home` |
| `src/pages/Note.jsx` | A note page (`/notes/<path>`), from `/api/notes/<path>`: header, practice links, previous/next cards, text size, ← / → keys |
| `src/components/NoteContent.jsx` | Shows a note's HTML, runs its `<script>` tags in order (loading helpers like `venn.js` once) and then draws its formulas |
| `src/components/TopicsSidebar.jsx` | The Topics sidebar, from `/api/notes` |
| `src/pages/PracticeList.jsx` | The practice hub (`/practice`), from `/api/practice`: course tabs (remembered; `#math-a` opens Math A) and "Solved n of m" per set and topic |
| `src/pages/PracticeSet.jsx` | One practice set (`/practice/<path>`), from `/api/practice/<path>`: header with progress and "Start again", next set |
| `src/practice.js` | Answer boxes and "I got it" / "Review later" buttons for each problem |
| `src/progress.js` | Reads and saves practice progress: in localStorage when logged out, in the account when logged in (section 9). Pages only use this file, so they don't need to know which |
| `src/pageHooks.js` | Shared by notes and sets: text size, ← / → keys, page title, back to the top on a new page |
| `src/components/LoadError.jsx` | "Not found" / "couldn't be loaded" messages |
| `src/pages/PastList.jsx` | `/past` (a card per exam) and `/past/<exam>` (its papers; tabs per subfolder, remembered as `past-tab:<exam>`, `#course-2` opens Course 2), from `/api/past` and `/api/past/<exam>` |
| `src/pages/PastPaper.jsx` | One paper (`/past/<exam>/[<course>/]<paper>`): works like a practice set, with progress under `past/<path>`. An old address of a renamed paper redirects to the new one |
| `src/components/HubTabs.jsx` | The tabs and "Solved n of m" badges shared by the practice hub and the past paper lists |
| `src/pages/NotFound.jsx` | "Page not found" for any other address |
| `src/components/FloatBar.jsx`, `SearchBox.jsx` | The floating bar (home version, or note version with where-you-are, text size, previous/next and Topics), its search box, and the "Log in" / "Log out" button |
| `src/components/HeroDemo.jsx` | The draggable demo on the home page |

The styles are in `src/styles/`, one file per kind of page, all imported by `src/styles.js`.

**MathJax:** typeset each element only once. A drawn formula keeps a hidden MathML copy for screen readers, and this MathJax build reads MathML too, so typesetting the same element again draws every formula a second time inside the first. `typeset()` in `src/mathjax.js` remembers which elements it has done.

**Scripts in notes:** React doesn't run `<script>` tags in HTML it inserts, so `NoteContent.jsx` runs them itself. Moving to another note doesn't reload the page, so all notes' scripts share one page. That's safe as long as each note keeps to the rules it already follows: wrap the code in `(function () { ... })();`, only touch elements inside the note, and don't wait for the page's load event (`DOMContentLoaded`); the note's HTML is already there when its script runs.

**If `npm run dev` stops passing `/api` to Flask** (pages say "couldn't be loaded" while Flask is running), restart it with Ctrl+C and `npm run dev`. This happens when `vite.config.js` briefly disappears while it runs, for example during `git checkout` to a branch without `frontend/`.

# Part E: Changing and expanding the project

## E1. The safe way to make any change

Every change, big or small, follows the same loop. Nothing reaches the live site until you merge, so you can experiment freely on a branch.

**1. Start from the latest `main`, on a new branch:**

```bash
git checkout main && git pull          # get what's on GitHub
git checkout -b my-change              # a new branch; name it after the change, e.g. add-about-page
```

**2. Start the site on your laptop** (two terminals):

```bash
# terminal 1: the database and Flask
docker compose up -d                   # PostgreSQL (once after each restart of the laptop)
cd backend && ../venv/bin/python app.py

# terminal 2: React
cd frontend && npm run dev             # then open http://localhost:5173
```

**3. Make the change, and look at it.** What you need to do so you can see it depends on the file:

| You changed… | To see it… |
|---|---|
| A `.jsx`, `.js` or `.css` file in `frontend/src/` | Nothing: Vite updates the page as you save |
| A content file in `content/` | `cd backend && ../venv/bin/flask import-content`, then refresh |
| A `.py` file in `backend/` | Nothing, if `.env` has `FLASK_DEBUG=1`: Flask restarts itself. Otherwise stop it (Ctrl+C) and start it again |
| `models.py` | Make and apply a migration (E7), then restart Flask |
| `.env` | Restart Flask (it reads `.env` only at start) |
| `requirements.txt` | `venv/bin/pip install -r backend/requirements.txt`, restart Flask |
| `package.json` | `npm install` in `frontend/`, restart `npm run dev` |
| `frontend/index.html`, `vite.config.js` | Vite reloads by itself; if not, restart `npm run dev` |

**4. Check nothing else broke:**

```bash
cd backend && ../venv/bin/pytest; cd ..        # every test should pass
cd frontend && npm run build; cd ..            # the live site's build must work too
```

Both start from the project root and go back to it (`cd ..`) at the end.

**5. Save it in git:**

```bash
git status                             # which files changed
git diff                               # what changed, line by line (q to quit)
git add -A                             # choose everything for the commit
git commit -m "Add an About page"      # save it, with a message saying what and why
```

**6. Publish it:**
1. `git push -u origin my-change`
2. Open a pull request on GitHub, read through its "Files changed" tab, and merge.
3. Render deploys by itself.
4. On the Oracle server, run `~/deploy.sh` (`docs/oracle-server.md`).
5. Tidy up: `git checkout main && git pull && git branch -d my-change`.

**Small steps are safer.** One branch per idea. Commit whenever something works, even halfway (`git commit` again on the same branch). If you get lost, these help:

| Command | What it does |
|---|---|
| `git diff` | What you changed since the last commit |
| `git restore FILE` | **Throw away** your changes to FILE (back to the last commit). Can't be undone |
| `git stash` / `git stash pop` | Put your changes aside / bring them back |
| `git log --oneline` | The commits so far |

## E2. Finding where something is made

You'll rarely know which file to open. These ways of finding it work every time.

**A text you can see on the page:** search the whole project for it.
- In VS Code: **Ctrl+Shift+F**.
- In the terminal: `grep -rn "Practise this note" frontend/src backend`. `-r` searches inside folders, `-n` shows line numbers.

That one finds `frontend/src/pages/Note.jsx`.

**How something looks (colour, size, spacing):**
1. Right-click it in the browser → **Inspect**.
2. The **Elements** panel shows its HTML and its `class`.
3. The **Styles** panel shows each CSS rule that applies, and which file it's from (e.g. `note-page.css`).
4. You can change values right there to try them out, then copy the one you like into the file.

**The data behind a page:**
1. Press **F12** → **Network** tab, and reload. Click the `/api/...` request → **Response** shows the JSON.
2. Or open the address directly, e.g. http://localhost:5000/api/home.
3. A4's table says which service function made it.

**A function: where it's defined, and who uses it:**
- VS Code: Ctrl+click its name, or right-click → **Find All References**.
- Terminal: `grep -rn "build_location" backend`.

**Why a line is the way it is:**
- `git log -p --follow FILE` shows every change to a file, with the commit messages.
- `git blame FILE` shows the last commit for each line.

**Print what's happening:**
- In Python, add `print(note_path)`; it shows in Flask's terminal.
- In JavaScript, add `console.log(data)`; it shows in the browser's **Console** (F12).
- Remove these lines before committing.

## E3. Small changes

**Change a text on a page:** find it (E2), edit it in the `.jsx` file, save. For example, the "Practise this note:" card is in `src/pages/Note.jsx`, in `PracticeLinks`. In JSX, text sits between the tags, and `{...}` puts in a value:

```jsx
<strong>Practise this note: {main.title}</strong>
```

**Change the main colour:** `src/styles/note-page.css` defines colour variables at the top:

```css
:root {
    --brand: #667eea;        /* the purple */
    --brand-dark: #4c3fb5;
```

- Every `var(--brand)` in the CSS uses it, so changing it here changes them all.
- A few rules still write the colour itself. Find them with `grep -rn "667eea" frontend/src/styles`.

**Change a course's name, icon or colour:**
- The **name** is in `COURSES` in `backend/utils/courses.py`. The pages read it from there each time (`course_name()`), so it shows as soon as Flask has restarted. Also run `flask import-content`, which keeps the copy in the `courses` table up to date.
- The home page's **icon and colour** per course are in `COURSE_STYLE` at the top of `src/pages/Home.jsx`. Icons are [Font Awesome](https://fontawesome.com/search?ic=free) names like `fa-dice`.

**Change a sign-up rule:** the minimum password length is `MIN_PASSWORD = 8` in `backend/api/auth.py`. `tests/test_accounts.py` checks it, so run `pytest`, and update the message on the form if needed.

**Change what search finds:** `build_search_index()` in `backend/services/home.py` makes the list. `src/components/SearchBox.jsx` does the matching, in the browser.

## E4. A new course, subject or exam

**A new course** (e.g. Physics Basic):
1. Add notes: `content/notes/physics-basic/01-motion/01-velocity.html` (copy a maths note for the layout, section 6).
2. In `backend/utils/courses.py`, add to `COURSES`:

   ```python
   "physics-basic": {"name": "Physics Basic", "subject": "Physics"},
   ```

   `SUBJECTS` already has Physics, so its "Coming soon" tab turns on by itself.
3. Give it an icon and colour in `COURSE_STYLE` in `src/pages/Home.jsx`:

   ```jsx
   'Physics Basic': ['fa-rocket', '#0891b2'],
   ```

4. `flask import-content`, and look at the home page.

**A new subject** (e.g. Chemistry): add `{"name": "Chemistry", "icon": "fa-flask"}` to `SUBJECTS` (the list order is the tab order), then its courses as above.

**A new exam:** a folder in `content/past/` and an entry in `PAST_CATEGORIES` (section 8).

## E5. Recipe: a new page

Example: an **About** page at `/about`, with text only (no data from the API). That's two steps: the page component, and a route.

**1. Create `frontend/src/pages/About.jsx`:**

```jsx
// The About page: /about
// A page with no data from the API, only text.

import { Link } from 'react-router'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'

export default function About() {
  usePageTitle('About · Learn Solo')     // the browser tab's title
  return (
    <>
      <FloatBar />
      {/* The purple header, styled by note-page.css */}
      <header className="note-header">
        <div className="note-header-inner">
          <h1>About Learn Solo</h1>
        </div>
      </header>
      {/* past-content: the white card from past.css, reused */}
      <main className="past-content">
        <p>Learn Solo is a free study site for Japanese high-school maths.</p>
        <p><Link to="/">Back to the home page</Link></p>
      </main>
    </>
  )
}
```

How it works:
- `export default function About()`: a component is a function. `export default` lets other files import it.
- `<>...</>` is a "fragment": it groups several elements without adding a `<div>`.
- `className` is how JSX writes HTML's `class`, because `class` is a reserved word in JavaScript.
- `{/* ... */}` is a comment inside JSX.

**2. Add its route in `frontend/src/App.jsx`:** import it at the top, with the other pages,

```jsx
import About from './pages/About.jsx'
```

and add a `<Route>` **above** the `path="*"` one. Routes are matched best-first, and `*` catches everything else:

```jsx
<Route path="/about" element={<About />} />
```

**3. Open http://localhost:5173/about.** Link to it from anywhere with `<Link to="/about">About</Link>`, for example in `FloatBar.jsx`.

You don't need to change Flask: it already sends the React app for every address that isn't `/api/...` (`backend/frontend.py`), so `/about` works on the live site too.

## E6. Recipe: new data from the API

Example: a **"Surprise me"** button on the home page that opens a random note. Data comes from the backend, so all three layers change: **service → route → React**, plus a **test**.

**1. The service: the logic.** In `backend/services/notes.py`, add `get_notes_list` to the import from `utils.content_loader`, add `import random` at the top, and add this function:

```python
import random

def random_note():
    """A random note's address, for the "Surprise me" button: {"url": "/notes/..."}."""
    notes = get_notes_list()                       # every note's path, in order
    return {"url": note_url(random.choice(notes))} # random.choice picks one item of a list
```

**2. The route: the address.** In `backend/api/content.py`, add `random_note` to the `from services.notes import ...` line, and add a route next to the other notes routes:

```python
@api_bp.get("/random-note")
def api_random_note():
    """A random note's address: {"url": "/notes/..."}."""
    return random_note()
```

Check it: http://localhost:5000/api/random-note shows `{"url": "/notes/..."}`, and a different one on each refresh.

**3. A test,** in `backend/tests/test_api.py`:

```python
def test_random_note_is_a_real_note(client):
    url = client.get("/api/random-note").get_json()["url"]
    assert url.startswith("/notes/")
    # the note it points to opens
    assert client.get("/api" + url).status_code == 200
```

**4. React: use it.** In `frontend/src/pages/Home.jsx`:
- change the imports to `import { Link, useNavigate } from 'react-router'` and `import { fetchJson, useApi } from '../api.js'`,
- add this component at the end of the file,

```jsx
// "Surprise me": asks the API for a random note, then opens it
function RandomNoteButton() {
  const navigate = useNavigate()          // a function that changes the page
  async function openRandomNote() {
    const { url } = await fetchJson('/api/random-note')   // e.g. { url: "/notes/math-1/..." }
    navigate(url)
  }
  return (
    <button className="btn-ghost" onClick={openRandomNote}>
      <i className="fas fa-shuffle"></i> Surprise me
    </button>
  )
}
```

- and use it in the hero, after the "Practice problems" link (inside `<div className="hero-actions">`):

```jsx
<RandomNoteButton />
```

**5. CSS.** `btn-ghost` was written for links (`<a>`), but browsers give a `<button>` a grey background and their own font. Reset those at the end of `src/styles/home.css`:

```css
/* The same look for a <button> (the "Surprise me" button): browsers give
   buttons a grey background and their own font, so reset those */
button.btn-ghost { background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
```

`button.btn-ghost` means "a `<button>` with the class `btn-ghost`", so links with that class aren't affected. This is a typical "it works but looks wrong" fix: right-click → Inspect showed where the grey came from (E2).

New ideas here:
- **`async` / `await`**: `fetchJson` takes a moment. `await` waits for its answer before the next line runs, and only works inside an `async` function.
- **`onClick={openRandomNote}`**: pass the function itself, without `()`. React calls it on each click.
- **`useNavigate()`**: opens another page from code, the way a `<Link>` does on a click.
- **Why `fetchJson` and not `useApi`?** `useApi` loads data **when the page draws**. Here the data is wanted only **when the button is clicked**.

## E7. Recipe: a new database column

Example: each note's first line is a tag, `<!-- tags: Vector -->`. Let's save it in the database and show it as a chip in the note's header. This touches every layer: **model → migration → importer → loader → service → React → CSS**, and tests.

**1. The model.** In `backend/models.py`, class `Note`, add a column after `title`:

```python
    tags = db.Column(db.String(200))                                # from <!-- tags: Vector -->
```

`db.String(200)` is text up to 200 characters. Without `nullable=False`, it may be empty (`None`), which existing rows need until the import fills them.

**2. The migration**, from `backend/` (the database must be running):

```bash
../venv/bin/flask db migrate -m "add tags to notes"
```

Flask-Migrate compares `models.py` with the real tables and writes a script, e.g. `migrations/versions/bb1b64060e99_add_tags_to_notes.py`. **Read it**:

```python
def upgrade():
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tags', sa.String(length=200), nullable=True))

def downgrade():
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.drop_column('tags')
```

- `upgrade()` adds the column. `downgrade()` would remove it again (`flask db downgrade`).
- A line like `Detected sequence named 'progress_id_seq'` while it runs is only information.

Then apply it:

```bash
../venv/bin/flask db upgrade
```

The migration file goes into git. Render and the Oracle server run `flask db upgrade` when they start, so their databases get the column too.

**3. The importer reads it.** In `backend/importer.py`, `parse_note()`:

```python
    # The first line's comment, e.g. <!-- tags: Vector --> gives "Vector"
    tags = _first(r"<!--\s*tags:\s*(.*?)\s*-->", content)
    return {"path": path, "title": title, "tags": tags, "html": content}
```

The pattern is a **regular expression**: a way to describe text to find.
- `<!--` and `-->` match themselves.
- `\s*` means "any spaces".
- `(.*?)` captures the shortest text between, which `_first()` returns.

Run `../venv/bin/flask import-content`: it reports 262 notes **updated**, because their tags were empty until now.

**4. The loader and the service.** In `backend/utils/content_loader.py`:

```python
def load_note_tags(note_path):
    """The note's tags, e.g. "Vector", or None."""
    return db.session.scalar(db.select(Note.tags).where(Note.path == note_path))
```

In `backend/services/notes.py`, import `load_note_tags`, and in `note_page()`'s `return {...}` add:

```python
        "tags": load_note_tags(note_path),
```

http://localhost:5000/api/notes/math-c/01-plane-vectors/17-line-perpendicular-to-a-vector now includes `"tags": "Vector"`.

**5. React shows it.** In `src/pages/Note.jsx`, in `<p className="note-chips">`, after the topic link:

```jsx
{data.tags && <span className="note-tag"><i className="fas fa-tag"></i> {data.tags}</span>}
```

`A && B` in JSX means "show B only if A has a value", so notes without tags show nothing.

**6. CSS,** in `src/styles/note-page.css`, next to `.note-chips a`:

```css
/* The tag chip in a note's header (Note.jsx) */
.note-chips .note-tag {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    border: 1px dashed rgba(255, 255, 255, 0.6);
}
```

**7. Tests,** in `backend/tests/test_importer.py`:

```python
def test_parse_note_tags():
    html = '<!-- tags: Vector -->\n<h1 class="note-title">Dot Product</h1>'
    assert parse_note("math-c/01-plane-vectors/05-dot-product", html)["tags"] == "Vector"
```

and in `test_api.py`:

```python
def test_note_has_its_tags(client):
    data = client.get("/api/notes/" + NOTE).get_json()
    assert data["tags"]          # e.g. "Quadratic Functions"
```

The test database is built from `models.py` each run (`conftest.py`), so it has the new column without a migration.

**8. Commit everything together,** including the migration file. Then document it: add a line about the new field to section 11 of this guide.

## E8. Writing a test

A test is a function starting with `test_` in `backend/tests/`. It does something, then checks the result with `assert`. If the check is `False`, pytest reports which test failed and why.

```python
def test_home_counts_match_the_database(client, app):
    response = client.get("/api/home")               # a fake browser asks for /api/home
    assert response.status_code == 200               # it answered "OK"
    data = response.get_json()                       # the JSON, as Python dicts and lists
    with app.app_context():                          # needed to read the database here
        assert data["stats"]["notes"] == Note.query.count()
```

- **Fixtures:** `client` and `app` are given to the test because it names them. They come from `conftest.py`.
- **`client.post(url, json={...})`** sends JSON, like `sendJson` in React. `client` keeps cookies, so after signing up it stays logged in (see `test_accounts.py`).
- **Running only some tests:**
  - `../venv/bin/pytest tests/test_api.py` runs one file.
  - `../venv/bin/pytest -k random` runs the tests with "random" in their name.
  - `-v` shows each test's name.
- **Good tests check behaviour, not exact content.** For example, "the count matches the database", not "262". That way adding a note doesn't break them.
- **Write a test whenever you fix a bug,** so the bug can't come back unnoticed.

The frontend has no automatic tests. Check React changes by clicking through the pages in the browser (the "Before merging" list in section 10).

## E9. Adding or updating packages

**A Python package** (from the project root):

```bash
venv/bin/pip install some-package                  # install it
venv/bin/pip freeze | grep -i some-package         # see its exact version, e.g. some-package==1.2.3
```

Add that line to `backend/requirements.txt`, so Render, the Oracle server and other computers install the same version.

**A JavaScript package** (from `frontend/`):

```bash
npm install some-package           # installs it AND adds it to package.json and package-lock.json
npm outdated                       # which packages have newer versions
npm update                         # update within the allowed range (package.json's ^ versions)
```

Commit `package.json` and `package-lock.json` together.

**Before adding a package,** check it's widely used and still looked after (on its GitHub page), and that you really need it: every package is code that runs on your site. After updating anything, run the tests and click through the site.

# Part F: When something goes wrong

## F1. Where errors appear

| Where | What shows there | How to open it |
|---|---|---|
| **Flask's terminal** | Python errors while answering a request: a "Traceback" | The terminal running `python app.py` |
| **The browser's Console** | JavaScript errors, `console.log` output | F12 → Console |
| **The browser's Network tab** | Every request, its status (200, 404, 500…) and answer | F12 → Network, then reload |
| **Vite's terminal / the page** | Mistakes in `.jsx` / `.js` / `.css`: Vite shows a red box on the page with the file and line | The terminal running `npm run dev` |
| **pytest** | Which test failed, the line, and the values that didn't match | `../venv/bin/pytest` |
| **Render** | Build and start logs of the live site | Render dashboard → the service → **Logs** |
| **The Oracle server** | `sudo journalctl -u learnsolo -n 50 --no-pager` | `docs/oracle-server.md`, section 16 |

**How to read a Python traceback:** read it **from the bottom up**.
- The **last line** is the error, e.g. `KeyError: 'tags'`.
- The lines above show the way there, the most recent call last.
- Find the last line that mentions **your** files (`services/…`, `api/…`): that's usually where to look.

## F2. Common problems

| What you see | What it means | Fix |
|---|---|---|
| `RuntimeError: DATABASE_URL is not set` | There's no `.env`, or it's missing the line | `cp .env.example .env` in the project root |
| `RuntimeError: SECRET_KEY is not set` | The same, for `SECRET_KEY` | Add one to `.env` (`.env.example` says how) |
| `connection refused` … `port 5432` | PostgreSQL isn't running | `docker compose up -d` |
| `column notes.tags does not exist` (or any "does not exist") | `models.py` has a column the database doesn't have yet | `../venv/bin/flask db upgrade` (and `flask db migrate` first if you haven't made the migration) |
| A page says "couldn't be loaded" | React got no answer from `/api/...` | Is Flask running on :5000? Check the Network tab and Flask's terminal. If Flask runs fine, restart `npm run dev` (section 12) |
| "Sorry, this note doesn't exist" for a new file | The file isn't in the database yet | `flask import-content` |
| A change in content doesn't show | Same: the site reads the database, not the files | `flask import-content`, then refresh |
| A change in `.py` doesn't show | Flask hasn't restarted | Use `FLASK_DEBUG=1` in `.env`, or restart Flask |
| Formulas show as `$x^2$` | MathJax didn't run on that element, or the `$` are inside an HTML attribute | Check the Console for `MathJax:` errors |
| A demo stays blank | Its script has an error | Console: the error and the line. Check the ids match the HTML |
| `npm run build` fails on Render but `npm run dev` works | The build is stricter: often a wrong import path or the wrong upper/lower case in a file name (Linux cares, Windows/Mac often don't) | Run `npm run build` locally and fix what it reports |
| `git push` says `rejected … fetch first` | GitHub has commits your branch doesn't | `git pull`, then push again |
| `error: src refspec … does not match any` | Pushing a branch that doesn't exist locally (e.g. already deleted) | `git branch` to see your branches, then push the right one |

**When stuck:**
1. Read the error.
2. Undo your last change to see if it was the cause (`git stash`, test, `git stash pop`).
3. Search for the exact error message online.
4. Ask with the message, the file, and what you changed.

## F3. A learning path through this project

Learn one layer at a time, each with a small task in this project. Do every task on a branch (E1). The answers are in the parts named.

**Level 1: HTML and CSS** (you already write HTML in `content/`)
1. Change the text of a note, run `flask import-content`, and see it. (Section 6)
2. Change `--brand` in `note-page.css` to another colour; then put it back. (E3)
3. Inspect the purple header with right-click → Inspect, and find its rule in the CSS. (E2)

**Level 2: JavaScript and a demo**
1. Read a note's demo script with section 3 next to it. Change a colour or a slider range.
2. Add `console.log(P)` in a demo's `draw()`, then watch the Console while you drag a point.

**Level 3: React**
1. Read `App.jsx`, then `pages/NotFound.jsx` (the smallest page), then `pages/Note.jsx`, with A3 and A4 open.
2. Build the About page (E5).
3. Change the "Note 5 of 8" text in `Note.jsx` to "5 / 8", and see `useState` at work in `FloatBar.jsx` (the ☰ menu).

**Level 4: Python and Flask**
1. Open http://localhost:5000/api/home, then read `services/home.py` and match each JSON field to the line that makes it.
2. Build the "Surprise me" button (E6), with its test.
3. Run `../venv/bin/pytest -v` and read one test file (`test_api.py`).

**Level 5: the database**
1. Look at the tables: `docker compose exec db psql -U learnsolo learnsolo`, then:
   - `\dt` lists the tables,
   - `\d notes` shows one table's columns,
   - `SELECT path, title FROM notes LIMIT 5;` reads rows,
   - `\q` quits.
2. Add the tags column (E7), all the way to the screen.

**Free resources:**
- **HTML, CSS, JavaScript:** MDN Web Docs (developer.mozilla.org).
- **React:** the official tutorial at react.dev/learn, especially "Describing the UI", "Adding Interactivity" and "Synchronizing with Effects".
- **Python:** the official tutorial at docs.python.org/3/tutorial.
- **Flask:** the "Quickstart" and "Tutorial" at flask.palletsprojects.com.
- **SQL:** SQLBolt (sqlbolt.com), interactive lessons.
- **Git:** "Pro Git", free at git-scm.com/book, chapters 2 and 3.
