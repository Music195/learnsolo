import re

# Display names for the content folders, in one place.
#
# Folders are lowercase-hyphen names with a number for the order, and the
# same course/topic folders are used in content/notes and content/practice:
#   content/notes/math-1/03-quadratic-functions/04-maximum-and-minimum-values.html
#   content/practice/math-1/03-quadratic-functions/01-graphs-and-vertex-form.html
# Page titles come from each file's <h1>, not from these names.

# Subjects in home-page tab order. A subject with no notes yet shows as
# "Coming soon".
SUBJECTS = [
    {"name": "Mathematics", "icon": "fa-square-root-variable"},
    {"name": "Physics", "icon": "fa-atom"},
]

# Course folder -> display name and subject. A folder missing here is shown
# with a name made from the folder ("physics-basic" -> "Physics Basic") and
# goes under the subject named by its first word.
COURSES = {
    "math-1": {"name": "Math I", "subject": "Mathematics"},
    "math-2": {"name": "Math II", "subject": "Mathematics"},
    "math-3": {"name": "Math III", "subject": "Mathematics"},
    "math-a": {"name": "Math A", "subject": "Mathematics"},
    "math-b": {"name": "Math B", "subject": "Mathematics"},
    "math-c": {"name": "Math C", "subject": "Mathematics"},
}

# Past question folders (content/past/<folder>/) -> name, icon and description.
# A folder may hold subfolders (content/past/eju/course-1/); "groups" names
# them, and the list page shows one tab per subfolder.
PAST_CATEGORIES = {
    "eju": {
        "name": "EJU Past Questions",
        "icon": "fa-file-pen",
        "about": "Original mock papers in the format of the EJU (Examination for Japanese University Admission): "
                 "Mathematics Course 1 and Course 2, six problems each.",
        "groups": {"course-1": "Course 1 (Basic)", "course-2": "Course 2 (Advanced)"},
    },
    "university": {
        "name": "University Past Questions",
        "icon": "fa-building-columns",
        "about": "Entrance exams of Japanese universities: longer problems with written solutions.",
    },
}

# Topic names are made from the folder: "03-quadratic-functions" ->
# "Quadratic Functions". Add a folder here only if that gives the wrong name.
TOPIC_NAMES = {}

_SMALL_WORDS = {"and", "of", "the", "in", "on", "to", "a", "an", "for"}


def _from_folder(folder):
    words = re.sub(r"^\d+-", "", folder).split("-")
    return " ".join(w if i and w in _SMALL_WORDS else w.capitalize() for i, w in enumerate(words))


def course_name(folder):
    return COURSES.get(folder, {}).get("name") or _from_folder(folder)


def course_subject(folder):
    return COURSES.get(folder, {}).get("subject") or _from_folder(folder).split()[0]


def topic_name(folder):
    return TOPIC_NAMES.get(folder) or _from_folder(folder)


def past_category(folder):
    """{"folder", "name", "icon", "about", "groups"} for a folder in content/past/."""
    info = PAST_CATEGORIES.get(folder, {})
    return {
        "folder": folder,
        "name": info.get("name") or _from_folder(folder),
        "icon": info.get("icon", "fa-folder-open"),
        "about": info.get("about", "Past exam problems with hints and full solutions."),
        "groups": info.get("groups", {}),
    }


def past_group(category, folder):
    """Name of a subfolder of a past category: "course-1" -> "Course 1 (Basic)"."""
    return past_category(category)["groups"].get(folder) or _from_folder(folder)
