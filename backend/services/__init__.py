# services/ holds the "thinking" part of each page: which notes to show,
# where a page sits, what comes before and after it.
#
# Each function returns plain Python data (dicts, lists, strings), and the
# routes in api/ send it to the React frontend as JSON. Keeping the logic
# here keeps the routes short: they only pick a function and return its data.
#
# When something doesn't exist, the functions raise ContentNotFound
# (utils/content_loader.py) and let the route decide what to send back.
