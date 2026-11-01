// The stylesheets of the site (in src/styles/).
//
// Importing a .css file in Vite adds it to the page; `npm run build` joins
// them into one file. They all share the same colours and page settings,
// so loading them together is safe.

import './styles/floatbar.css'       // the floating bar at the top
import './styles/home.css'           // the home page
import './styles/note-page.css'      // the page around a note
import './styles/note-blocks.css'    // the 8 blocks inside a note
import './styles/practice.css'       // practice sets, and the "Practise this note" cards
import './styles/practice-list.css'  // the practice hub, and tabs on the past paper lists
import './styles/past.css'           // the past question lists
import './styles/account.css'        // log in / sign up, and the account button
