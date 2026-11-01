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
import '../../backend/static/css/note-page.css'     // the page around a note
import '../../backend/static/css/note-blocks.css'   // the 8 blocks inside a note
import '../../backend/static/css/practice.css'      // practice sets, and the "Practise this note" cards
import '../../backend/static/css/practice-list.css' // the practice hub, and tabs on the past paper lists
import '../../backend/static/css/past.css'          // the past question lists

// New for React (not used by the old pages): the log in / sign up pages
// and the account button in the floating bar
import './account.css'
