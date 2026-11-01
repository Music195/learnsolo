// The stylesheets of the React pages.
//
// They are the same files the old Flask pages use, in backend/static/css/,
// so both sites look the same while we move pages over. (Step 6 moves them
// into frontend/ when the old pages are deleted.)
//
// Importing a .css file in Vite adds it to the page. These all share the
// same colours and page settings, so loading them together is safe.

import '../../backend/static/css/floatbar.css'
import '../../backend/static/css/home.css'
