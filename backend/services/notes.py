from utils.content_loader import get_notes_with_titles, get_practice_sets, load_note, ContentNotFound
from utils.courses import course_name, topic_name
from services.urls import note_url

# Data for a note page (/notes/<path>).


def build_nav_links(notes_list, current_note):
    """The paths of the notes before and after this one (None at either end)."""
    if current_note not in notes_list:
        return {"prev": None, "next": None}

    index = notes_list.index(current_note)

    return {
        "prev": notes_list[index - 1] if index > 0 else None,
        "next": notes_list[index + 1] if index < len(notes_list) - 1 else None,
    }


def build_location(notes_list, note_path):
    """ "Where you are" for the floating bar and the note header,
    e.g. Math C › Plane Vectors · 17 of 17, with the first note of the course
    and of the topic (their links)."""
    parts = note_path.split("/")
    folder = note_path.rsplit("/", 1)[0]                 # "math-c/01-plane-vectors"
    siblings = [p for p in notes_list if p.rsplit("/", 1)[0] == folder]   # notes in the same topic
    course_first = next(p for p in notes_list if p.startswith(parts[0] + "/"))
    return {
        "course": course_name(parts[0]),
        "course_first": course_first,
        "topic": topic_name(parts[1]) if len(parts) > 2 else None,
        "topic_first": siblings[0],
        "index": siblings.index(note_path) + 1,          # counting from 1 for people
        "total": len(siblings),
    }


def build_practice(note_path):
    """Practice after a note: the set that practises this note, then the topic's
    other sets. The main set is the first concept set whose problems link to
    the note; if none does, the topic's first set. None if the topic has no sets."""
    folder = note_path.rsplit("/", 1)[0]
    sets = [s for s in get_practice_sets() if s["path"].rsplit("/", 1)[0] == folder]
    if not sets:
        return None
    main = next((s for s in sets if not s["review"] and note_path in s["notes"]), sets[0])
    return {"main": main, "more": [s for s in sets if s is not main], "topic": topic_name(folder.split("/")[-1])}


def note_page(note_path):
    """Everything one note page shows, apart from the Topics sidebar
    (see notes_sidebar). Raises ContentNotFound for an unknown path."""
    notes_meta = get_notes_with_titles()
    notes_list = [n["path"] for n in notes_meta]

    # Only paths from the database are accepted, which also blocks tricks like "../"
    if note_path not in notes_list:
        raise ContentNotFound(note_path)
    content = load_note(note_path)

    nav = build_nav_links(notes_list, note_path)

    # Titles come from each note's <h1 class="note-title"> (see importer.py)
    titles = {n["path"]: n["title"] for n in notes_meta}
    # Previous / next cards: the title, and the course · topic shown under it
    for key in ("prev", "next"):
        if nav[key]:
            location = build_location(notes_list, nav[key])
            nav[key] = {
                "url": note_url(nav[key]), "title": titles[nav[key]],
                "where": " · ".join(filter(None, [location["course"], location["topic"]])),
            }

    return {
        "note_path": note_path,
        "note_title": titles[note_path],
        "content": content,                      # the note's HTML
        "location": build_location(notes_list, note_path),
        "nav": nav,
        "practice": build_practice(note_path),
    }


def notes_sidebar():
    """The Topics sidebar: every note with its title, and display names
    for the course and topic folders (for its two dropdowns)."""
    notes_meta = get_notes_with_titles()
    notes_list = [n["path"] for n in notes_meta]
    courses = sorted({p.split("/")[0] for p in notes_list})
    topics = {p.split("/")[1] for p in notes_list if p.count("/") >= 2}
    return {
        "notes_meta": notes_meta,
        "folders": courses,
        "display_names": {"courses": {c: course_name(c) for c in courses},
                          "topics": {t: topic_name(t) for t in topics}},
    }
