# The address of each kind of page, in one place.
#
# These are plain strings rather than Flask's url_for(), because the React
# frontend will use the very same addresses for its pages. Content paths are
# lowercase letters, numbers, hyphens and slashes, so they need no escaping.


def note_url(path):
    return "/notes/" + path            # /notes/math-1/03-quadratic-functions/05-quadratic-formula


def practice_url(path):
    return "/practice/" + path         # /practice/math-1/03-quadratic-functions/01-graphs-and-vertex-form


def practice_hub_url(course=None):
    # "#math-1" opens that course's tab on the practice page
    return "/practice" + ("#" + course if course else "")


def past_category_url(category, group=None):
    return "/past/" + category + ("#" + group if group else "")


def past_paper_url(path):
    return "/past/" + path             # /past/eju/course-1/03-mock-paper
