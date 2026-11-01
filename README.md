# LearnSolo (learningNoteByMin)

An interactive, Flask-based educational web application designed for organizing, managing, and presenting digital learning notes. 

This project is built to act as a personal study companion, helping users structure their learning process and access their study materials through a clean, intuitive web interface.

---

## 🚀 Project Overview

* **Educational Focus:** Designed specifically to facilitate self-directed study and note organization.
* **Architecture:** Built using a lightweight **Flask** (Python) backend to handle routing, application logic, and data management.
* **Frontend:** Uses clean **HTML templates** and modern styling to create a responsive, user-friendly reader and organizer interface.
* **Status:** Under active development as I continue to implement new interactive learning features.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Frontend:** HTML5, CSS3, JavaScript
* **Data Handling:** Python-based file/data structures to serve and organize dynamic notes.

---

## 📂 Project Structure (Conceptual)

```text
├── backend/                # The Flask app (run it from here)
│   ├── app.py              #   Creates the Flask app and registers the routes
│   ├── routes/             #   home.py, notes.py, practice.py, past.py
│   ├── utils/              #   content_loader.py (reads content/), courses.py (display names)
│   ├── templates/          #   Page templates (partials/ holds shared pieces)
│   ├── static/             #   css/, js/ (js/demos/ holds the demo helpers)
│   └── requirements.txt    #   Python packages
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
docker compose up -d          # PostgreSQL (not used by the app yet)
cd backend && python app.py   # http://localhost:5000
```
