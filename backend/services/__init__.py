# services/ holds the "thinking" part of each page: which notes to show,
# where a page sits, what comes before and after it.
#
# Each function returns plain Python data (dicts, lists, strings). Two kinds
# of routes use the same functions:
#   routes/  turn the data into an HTML page with a template (the current site)
#   api/     turn the data into JSON for the React frontend
# Keeping the logic here means both always agree.
#
# When something doesn't exist, the functions raise ContentNotFound
# (utils/content_loader.py) and let the route decide what to send back.
