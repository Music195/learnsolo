# LearnSolo (learningNoteByMin)

An interactive educational web application (Flask API + React) designed for organizing, managing, and presenting digital learning notes. 

This project is built to act as a personal study companion, helping users structure their learning process and access their study materials through a clean, intuitive web interface.

---

## 🚀 Project Overview

* **Educational Focus:** Designed specifically to facilitate self-directed study and note organization.
* **Architecture:** A **Flask** (Python) JSON API with a **PostgreSQL** database, and a **React** single-page app for every page.
* **Frontend:** A responsive reader with interactive demos, practice sets with answer checks, and progress saved to your account.
* **Status:** Under active development as I continue to implement new interactive learning features.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Frontend:** React (Vite, React Router). `npm run build` makes the files Flask serves on the live site
* **Database:** PostgreSQL via SQLAlchemy (Flask-SQLAlchemy, Flask-Migrate). Notes are written as HTML files in `content/` and imported with `flask import-content`.
* **Accounts:** Flask-Login. Anyone can sign up; practice progress is then saved to the account instead of only in the browser.

---

## 📂 Project Structure (Conceptual)

```text
├── backend/                # The Flask app (run it from here)
│   ├── app.py              #   Creates the Flask app: /api/... and the React app
│   ├── frontend.py         #   Sends the built React app (frontend/dist) for every other address
│   ├── config.py           #   Settings from .env (DATABASE_URL, SECRET_KEY)
│   ├── models.py           #   Database tables (SQLAlchemy); migrations/ holds their history
│   ├── importer.py         #   flask import-content: copies content/ into the database
│   ├── api/                #   JSON API under /api, for the React frontend
│   │                       #   (content.py, auth.py: accounts, progress.py: saved progress)
│   ├── services/           #   The data behind each page, used by api/
│   ├── tests/              #   Automatic tests (pytest)
│   ├── utils/              #   content_loader.py (reads the database), courses.py (display names)
│   └── requirements.txt    #   Python packages
├── frontend/               # The React app (Vite): every page of the site
│   ├── index.html          #   The one page React draws into
│   ├── public/static/      #   Copied as they are: favicon, js/demos/ (the notes' drawing helpers)
│   └── src/                #   main.jsx (start), App.jsx (which page for which address),
│                           #   api.js, auth.jsx (who is logged in), progress.js, pages/, components/, styles/
├── content/                # All learning material, as HTML fragments
│   ├── notes/              #   notes/<course>/<topic>/<nn-name>.html
│   ├── practice/           #   practice sets, same course/topic folders as notes/
│   └── past/               #   past question papers by exam (eju/, university/)
├── docker-compose.yml      # Local PostgreSQL (docker compose up -d)
├── .env.example            # Copy to .env: DATABASE_URL, SECRET_KEY
├── docs/content-guide.md   # How the project fits together, and how to write notes, practice sets and past papers
└── README.md               # Project documentation

---

## ▶️ Running locally

```bash
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env          # then edit SECRET_KEY
docker compose up -d          # PostgreSQL
cd backend
flask db upgrade              # create the tables
flask import-content          # copy content/ into the database (again after editing content)
python app.py                 # the API on http://localhost:5000 (e.g. /api/home)
```

Then, in a second terminal, the React app (needs Node.js):

```bash
cd frontend
npm install                   # once, and after package.json changes
npm run dev                   # open http://localhost:5173 (keep Flask running: React gets its data from it)
```

To try the site the way it runs on Render, build it once: `npm run build` in `frontend/`. Flask on :5000 then serves the whole site too.

Run the tests from `backend/` (they use a separate `learnsolo_test` database):

```bash
pip install -r requirements-dev.txt   # once
pytest
```
