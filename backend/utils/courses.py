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
    {"name": "Grade 12 Myanmar", "icon": "fa-graduation-cap"},
]

# Course folder -> display name and subject. A folder missing here is shown
# with a name made from the folder ("physics-basic" -> "Physics Basic") and
# goes under the subject named by its first word.
# Courses are listed in the order written here (folders not listed come last).
COURSES = {
    "math-1": {"name": "Math I", "subject": "Mathematics"},
    "math-2": {"name": "Math II", "subject": "Mathematics"},
    "math-3": {"name": "Math III", "subject": "Mathematics"},
    "math-a": {"name": "Math A", "subject": "Mathematics"},
    "math-b": {"name": "Math B", "subject": "Mathematics"},
    "math-c": {"name": "Math C", "subject": "Mathematics"},
    # Mechanics Basic: motion, forces, Newton's laws, equations of motion,
    # falling and projectile motion, work and energy,
    # impulse and momentum, inertial force, circular motion,
    # universal gravitation, simple harmonic motion
    "mechanics-basic": {"name": "Mechanics Basic", "subject": "Physics"},
    # Heat: temperature and heat, ideal gases, thermodynamics
    "heat": {"name": "Heat", "subject": "Physics"},
    # Waves: wave basics, superposition and standing waves, wave phenomena,
    # sound, light and lenses, interference of light
    "waves": {"name": "Waves", "subject": "Physics"},
    # Electricity: electric force and field, DC circuits, capacitors
    "electricity": {"name": "Electricity", "subject": "Physics"},
    # Magnetism: magnetic fields and forces, electromagnetic induction, AC circuits
    "magnetism": {"name": "Magnetism", "subject": "Physics"},
    # Atomic Physics: particles and waves (photoelectric effect, Compton effect,
    # matter waves, X-rays), the atom (Bohr model, spectra), the nucleus
    # (radioactive decay, half-life, binding energy, nuclear reactions)
    "atomic-physics": {"name": "Atomic Physics", "subject": "Physics"},
    # Grade 12 Myanmar: complex numbers, mathematical induction, solid geometry,
    # vector algebra, permutations and combinations, conic sections,
    # trigonometric functions, logarithmic and exponential functions,
    # application of differentiation, methods of integration, application of integration
    "g12-math": {"name": "Mathematics", "subject": "Grade 12 Myanmar"},
}

# Past question folders (content/past/<folder>/) -> name, icon and description.
# A folder may hold subfolders (content/past/eju/course-1/); "groups" names
# them, and the list page shows one tab per subfolder.
PAST_CATEGORIES = {
    "eju": {
        "name": "EJU Mock Papers",
        "icon": "fa-file-pen",
        "about": "Original mock papers in the format of the EJU (Examination for Japanese University Admission): "
                 "Mathematics Course 1 and Course 2, six problems each.",
        "groups": {"course-1": "Course 1 (Basic)", "course-2": "Course 2 (Advanced)"},
    },
    "jlpt": {
        "name": "JLPT Mock Tests",
        "icon": "fa-language",
        "about": "Original mock tests in the style of the JLPT (Japanese-Language Proficiency Test): "
                 "vocabulary, grammar and reading, 25 multiple-choice questions each, explained in English.",
        "groups": {"n2": "N2"},
    },
    "university": {
        "name": "University Past Questions",
        "icon": "fa-building-columns",
        "about": "Entrance exams of Japanese universities: longer problems with written solutions.",
    },
}

# Topic names are made from the folder: "03-quadratic-functions" ->
# "Quadratic Functions". Add a folder here only if that gives the wrong name.
TOPIC_NAMES = {
    # a folder name can't hold the apostrophe
    "03-newtons-laws": "Newton's Laws",
    # "dc" must stay capitals
    "02-dc-circuits": "DC Circuits",
    # "ac" must stay capitals
    "03-ac-circuits": "AC Circuits",
}

_SMALL_WORDS = {"and", "of", "the", "in", "on", "to", "a", "an", "for"}


def _from_folder(folder):
    words = re.sub(r"^\d+-", "", folder).split("-")
    return " ".join(w if i and w in _SMALL_WORDS else w.capitalize() for i, w in enumerate(words))


def course_name(folder):
    return COURSES.get(folder, {}).get("name") or _from_folder(folder)


def course_order(folder):
    """Sort key: courses in the order of COURSES, then other folders by name."""
    order = list(COURSES)
    return (order.index(folder) if folder in order else len(order), folder)


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
