# LearnSolo: Frontend Guide (`frontend/`)

## Start here

The LearnSolo frontend (`frontend/`) is a **React** single-page application built with **Vite** and **React Router**. Every page of the site—the home page, notes, practice hub, practice sets, mock question lists, mock papers, account login/signup, and the floating 3-way dictionary—is rendered by React in the browser using JSON data from the Flask backend (`/api/...`).

The project documentation is split into three connected guides:

| Guide | What it covers |
|---|---|
| **[docs/content-guide.md](content-guide.md)** | Writing **Notes**, **Practice sets**, **Mock Questions**, interactive **TRY IT demos**, and **dictionary entries** in `content/` |
| **[docs/backend-guide.md](backend-guide.md)** | The **Flask + PostgreSQL** server in `backend/`: importing content, database models & migrations, services, JSON API (`/api/...`), accounts, deployment, and `pytest` |
| **[docs/frontend-guide.md](frontend-guide.md)** *(this guide)* | The **React + Vite** app in `frontend/`: architecture, every file, pages, components, hooks, CSS styles, MathJax, answer checking, `localStorage`, and frontend recipes |
| **[docs/dictionary-guide.md](dictionary-guide.md)** | Deep dive into the 3-way English/Burmese/Japanese dictionary (`content/dictionary.json`, CLI commands, hybrid lookup) |
| **[docs/oracle-server.md](oracle-server.md)** | How the Oracle Cloud production server (`https://learnsolo.duckdns.org`) is set up and deployed |

---

## 1. How Frontend Connects to Backend and Content

When someone opens LearnSolo in a browser, the **Frontend (`frontend/`)** talks to the **Backend (`backend/`)** over `/api/...`, and renders the HTML fragments authored in **Content (`content/`)**:

```
┌──────────────────────── the student's computer ─────────────────────────┐
│  BROWSER (Chrome, Safari…)                                               │
│    runs the REACT APP: JavaScript from frontend/src/                     │
│    1. React Router picks the page component for the URL (App.jsx)        │
│    2. useApi('/api/...') asks Flask for the page's JSON (api.js)         │
│    3. NoteContent.jsx puts the HTML fragment from content/ onto the page,│
│       runs its <script> demo helpers (/static/js/demos/...),             │
│       and calls MathJax (mathjax.js) to typeset $...$ formulas           │
│    4. practice.js adds answer boxes / multiple-choice buttons and saves  │
│       progress via progress.js (localStorage or /api/progress/...)       │
└───────────────┬─────────────────────────────────────────▲───────────────┘
                │ GET /api/notes/...                       │ JSON response
                │ POST /api/auth/... / PUT /api/progress   │
                ▼                                           │
┌──────────────────────────── the server ──────────────────┴──────────────┐
│  FLASK (backend/)  ◄──SQL──►  POSTGRESQL  ◄──import──  content/*.html   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Development (two servers) vs. Production (one server)

```
YOUR LAPTOP (developing)                         LIVE SITE (Render, Oracle)
browser → http://localhost:5173                  browser → https://...
            │                                                │
       Vite (npm run dev)                             gunicorn running Flask
       ├─ serves the React app (and updates           ├─ /api/...      → JSON
       │  the page instantly when you save)           └─ anything else → the built React
       └─ /api/... → proxied to Flask :5000              app (frontend/dist, made by
                     (vite.config.js)                    npm run build; backend/frontend.py)
```

### Following one click through the frontend

Here is what happens step-by-step in `frontend/` when a student clicks a link to `/notes/math-1/03-quadratic-functions/05-quadratic-formula`:

1. **React Router picks the page (`frontend/src/App.jsx`):**
   ```jsx
   <Route path="/notes/*" element={<Note />} />
   ```
   The URL starts with `/notes/`, so React Router renders the `Note` component without reloading the browser page. The `*` matches the rest of the path.
2. **The page asks Flask for its data (`frontend/src/pages/Note.jsx`):**
   ```jsx
   const path = useParams()['*']                          // "math-1/03-quadratic-functions/05-quadratic-formula"
   const { data, error } = useApi(`/api/notes/${path}`)   // ask Flask for this note
   ...
   if (error) return <LoadError error={error} what="note" />   // 404 or network error
   if (!data) return <p className="section">Loading…</p>      // waiting for response
   ```
   `useApi` (in `src/api.js`) calls `fetch()` and re-renders `Note` once the JSON arrives from `backend/api/content.py` → `backend/services/notes.py`.
3. **React draws the page layout (`Note.jsx`):**
   ```jsx
   <FloatBar location={location} nav={nav} ... />       // Slim Icon Rail (AppRail) + Topics flyout
   <header className="note-header"> ... <h1>{title}</h1> ... </header>
   <NoteContent html={content} ... />                   // the note's HTML fragment
   <PagerCard link={nav.prev} side="prev" />            // previous / next cards
   ```
4. **The note's HTML, demo script, and formulas come alive (`frontend/src/components/NoteContent.jsx`):**
   - Injects `data.content` (the HTML fragment from `content/notes/...`) into the DOM.
   - Runs any `<script>` tags inside the note in order, which draw the interactive TRY IT demo using `/static/js/demos/plot.js`, `physkit.js`, or `jsxgraphcore.js`.
   - Calls `typeset()` (`src/mathjax.js`) so MathJax turns `$x^2$` into typeset formulas.
5. **CSS styles every block (`frontend/src/styles/`):**
   - `note-page.css` styles the purple header, card width, sidebar, and pager cards.
   - `note-blocks.css` styles the 8 blocks inside the note (`note-concept`, `note-formula`, `note-demo`, etc.) and adds their coloured labels (`CONCEPT`, `FORMULA`, `TRY IT`…).

### How every React page & component connects to the Backend

| Page / Component | React file (`frontend/src/`) | API route (`backend/api/`) | Backend service (`backend/services/`) |
|---|---|---|---|
| Home `/` | `pages/Home.jsx` | `/api/home` | `home_page()` in `services/home.py` |
| A note | `pages/Note.jsx` | `/api/notes/<path>`, `/api/notes` | `note_page()`, `notes_sidebar()` in `services/notes.py` |
| Practice hub | `pages/PracticeList.jsx` | `/api/practice` | `practice_courses()` in `services/practice.py` |
| A practice set | `pages/PracticeSet.jsx` | `/api/practice/<path>` | `practice_page()` in `services/practice.py` |
| Mock Questions lists | `pages/PastList.jsx` | `/api/past`, `/api/past/<exam>` | `past_categories()`, `past_category_page()` in `services/past.py` |
| A mock paper | `pages/PastPaper.jsx` | `/api/past/<exam>/<paper>` | `past_paper_page()` in `services/past.py` |
| Search box | `components/SearchBox.jsx` | `/api/search-index` | `build_search_index()` in `services/home.py` |
| Floating dictionary | `components/FloatingDictionary.jsx` | `/api/dictionary?q=...` | `lookup_word()` in `services/dictionary.py` |
| Log in / sign up | `pages/Account.jsx` (via `auth.jsx`) | `/api/auth/...` | in `api/auth.py` itself |
| Saved progress | `progress.js` | `/api/progress/...` | in `api/progress.py` itself |

---

## 2. Languages and Words You'll Meet in the Frontend Code

### Languages used in `frontend/`

| Language | What it's for | Where in this project | Looks like |
|---|---|---|---|
| **HTML** | The outer shell page and the content fragments | `frontend/index.html`, `content/**/*.html` | `<div id="root"></div>` |
| **CSS** | How things look: colours, sizes, layout | `frontend/src/styles/*.css` | `.note-header { background: #667eea; }` |
| **JavaScript** | Making pages do things in the browser | `frontend/src/*.js`, `public/static/js/demos/*.js` | `button.addEventListener('click', check)` |
| **JSX** | JavaScript with HTML-like tags mixed in: how React components are written | `frontend/src/**/*.jsx` | `return <h1>{title}</h1>` |
| **JSON** | The format data travels in between Flask and React | Every `/api/...` response | `{"note_title": "Law of Sines", "nav": {...}}` |

### React & Vite vocabulary

| Word | Meaning | Example here |
|---|---|---|
| **Component** | A function that returns what to draw (JSX). Names start with a capital letter | `function Note() { ... return <header>...</header> }` |
| **Props** | The inputs a component gets, like HTML attributes | `<FloatBar location={location} nav={nav} />` |
| **State** | A value a component remembers; changing it redraws the component | `const [topicsOpen, setTopicsOpen] = useState(false)` |
| **Hook** | A function starting with `use` that gives a component some ability | `useApi(url)` (load data), `useState`, `useEffect` |
| **Effect** | Code that runs *after* drawing, e.g. to load data or listen for keys | `useEffect(() => {...}, [path])`: runs again when `path` changes |
| **Router** | Picks the page component for the address, without reloading the page | `<Route path="/notes/*" element={<Note />} />` in `App.jsx` |
| **`<Link to=...>`** | A link that changes the page without a full reload (faster than `<a href>`) | `<Link to="/practice">` |
| **Context** | A value every component can read without passing props down | `useAuth()` gives the logged-in user anywhere |
| **Vite** | The tool that runs the React app while you develop and **builds** it for the server | `npm run dev`, `npm run build` |
| **npm / package** | Node's package manager; packages are listed in `package.json` | `react`, `react-router`, `vite` |
| **Build** | Turning `src/` into a few plain files browsers can load fast | `frontend/dist/` |

---

## 3. Every File in `frontend/`

### Setup and static files (`frontend/`)

| File / folder | What it does | Open it when… |
|---|---|---|
| `package.json` | The project's npm settings: its packages (`react`, `react-router`, `vite`…) and scripts (`npm run dev`, `npm run build`) | Adding a JavaScript package (Section 6.6) |
| `package-lock.json` | The **exact** version of every package and sub-package, written by npm | Never by hand; commit it when npm changes it |
| `vite.config.js` | Vite's settings: the React plugin, port 5173, and the **proxy** that passes `/api` to Flask on `:5000` | Changing the dev server |
| `index.html` | **The one HTML page.** Loads Bootstrap (CSS framework), Font Awesome (icons), MathJax (formulas), JSXGraph (`jsxgraph.css` + `jsxgraphcore.js`) and the demo helpers (`geom.js`, `plot.js`, `physkit.js`), then `src/main.jsx`. React draws everything inside `<div id="root">` | Adding something every page needs, like a font or a global library |
| `public/static/favicon.png`, `logo.png`, `apple-touch-icon.png` | The browser tab icon and brand logos | Changing the icon or logo |
| `public/static/js/demos/`, `public/static/css/jsxgraph.css` | `geom.js`, `plot.js`, `venn.js`, `physkit.js`, `jsxgraphcore.js`: the drawing helpers for TRY IT demos ([docs/content-guide.md](content-guide.md)). Files in `public/` are copied and served as they are | Adding or editing a drawing tool for demos |
| `node_modules/` | Installed npm packages (thousands of files; not in git) | Never edit by hand (`npm install` manages it) |
| `dist/` | Output of `npm run build` served in production (not in git) | Never edit by hand (`npm run build` recreates it) |

### The app's backbone (`frontend/src/`)

| File | What it does | Open it when… |
|---|---|---|
| `main.jsx` | **The starting point.** Draws `<App />` inside `#root`, wrapped in `BrowserRouter` (addresses) and `AuthProvider` (who is logged in), and loads the styles | Rarely: wrapping the whole app in something new |
| `App.jsx` | **Which page for which address**: one `<Route>` per page, plus `<FloatingDictionary />` on every page | Adding a new page (Section 6.3) |
| `api.js` | Talking to Flask: `fetchJson(url)`, `sendJson(method, url, data)`, and the `useApi(url)` hook | Changing how all requests are made |
| `auth.jsx` | `AuthProvider` and `useAuth()`: who is logged in, `signup`, `login`, `logout`, and moving browser progress into the account | Changing what happens at log in or out |
| `progress.js` | **The only place progress is read and saved**: in `localStorage` when logged out, in the account (`/api/progress/...`) when logged in | Changing how progress is stored |
| `practice.js` | Adds the answer boxes (or multiple-choice option buttons with `data-choice`), answer checking (`toNumber`), score updates, and "I got it / Review later" buttons to a set's problems | Changing how answers are checked or marked |
| `pageHooks.js` | Shared hooks: dark mode (`useTheme`), global font scale (`useFontSize`), font family (`useFontFamily`), text size (`useTextSize`), ← / → keys (`useArrowKeys`), the tab title (`usePageTitle`), back to top (`useScrollToTop`) | Changing these behaviours on every page |
| `mathjax.js` | `typeset(element)`: draws formulas inside an element, once, one job at a time | Formulas draw wrongly |
| `styles.js` | Imports every CSS file in `styles/` | Adding a new CSS file |

### Pages (`frontend/src/pages/`, one per kind of URL)

| File | Address | What it shows |
|---|---|---|
| `Home.jsx` | `/` | Hero with a live demo (`HeroDemo`), subject tabs (`Mathematics`, `Physics`, `Grade 12 Myanmar`), course cards (icon and colour per course: `COURSE_STYLE`), "how a note works", links to Practice and Mock Questions, and the full site footer (`Footer`) |
| `Note.jsx` | `/notes/...` | Header (course, topic, title, "Note 5 of 8"), the note (`NoteContent`), "Practise this note", previous/next cards, Topics sidebar |
| `PracticeList.jsx` | `/practice` | Course tabs; a card per topic listing its sets with "Solved n of m", and the site footer |
| `PracticeSet.jsx` | `/practice/...` | Header with "Solved 2 of 5" and "Start again", the problems, "Review the notes" and the next set |
| `PastList.jsx` | `/past`, `/past/<exam>` | A card per exam category (`EJU Mock Papers`, `JLPT Mock Tests`, `University Mock Questions`); then one exam's papers (with tabs for EJU Course 1/2 and JLPT N1–N5 levels and skill sections), and site footer |
| `PastPaper.jsx` | `/past/<exam>/...` | One mock paper or test, with live scoring header, hints/solutions, choices, and end-of-test `<TestScoreCard />` |
| `Account.jsx` | `/login`, `/signup` | The email + password form; goes back to the page you came from |
| `AccountSettings.jsx` | `/settings`, `/account` | Settings hub with 3 tabs: Account & Security (password change, progress reset, logout), Theme & Appearance (Light/Dark selection), and Font & Typography (font size presets and live preview) |
| `NotFound.jsx` | anything else | "Page not found" |

### Components (`frontend/src/components/`, reusable pieces)

| File | What it is | Used by |
|---|---|---|
| `AppRail.jsx` / `FloatBar.jsx` | **Slim Icon Rail Navigation**: 58px left vertical rail on desktop (bottom tab bar on mobile) giving 100% full-height reading canvas. Holds Home, Topics flyout, Practice, Exams, Search, Announcements, and Settings | Every page |
| `TopicsFlyout.jsx` | **Course & Topics Flyout (State B)**: docked curriculum drawer beside the rail with course/topic dropdowns, live filter, note index, and `▶ Now` indicator | `AppRail` (all pages) |
| `SearchModal.jsx` | **Command Palette Search Modal**: centered quick find modal (`Ctrl + K` / `Cmd + K`) for instant note and topic lookups | `AppRail` |
| `SettingsPopover.jsx` | Quick Settings popover with Theme switcher (Light/Dark), Font scale controls (85%–130% + stepper + live preview), Account quick view, and nested Send Feedback button | `AppRail` |
| `NotificationBell.jsx` | The announcement bell: unread badge counter, popover drawer with creator announcements, and "Mark all as read" | `AppRail` |
| `FeedbackModal.jsx` | Feedback dialog modal: category selector, message textarea, and submission to `/api/feedback` | `AppRail`, `AccountSettings` |
| `Footer.jsx` | Site footer: logo, platform description, About Me portfolio link (`https://music195.github.io/portfolio/`), GitHub repository, subjects, and mock exam links | `Home`, `PracticeList`, `PastList`, `AccountSettings` |
| `TestScoreCard.jsx` | Test completion summary card: pass/review badges (`合格`/`要復習`), score stats, "Retake Test", "Jump to First Mistake", and "Next Test" | `PastPaper` |
| `FloatingDictionary.jsx` | The floating 📖 button (bottom-right) and resizable 3-way dictionary window (English ↔ Burmese ↔ Japanese) | Every page (mounted in `App.jsx`) |
| `SearchBox.jsx` | The inline search box: loads `/api/search-index` once, shows up to 8 matches, keyboard ↑ ↓ Enter Esc | Search components |
| `NoteContent.jsx` | Puts a note's or set's HTML on the page, runs its scripts, cleans up any JSXGraph boards on unmount, then draws the formulas | `Note`, `PracticeSet`, `PastPaper` |
| `HubTabs.jsx` | A row of tabs with a panel each (remembered in `localStorage`), and the "Solved n of m" or "Score: X/Y (Z%)" badge | `PracticeList`, `PastList` |
| `HeroDemo.jsx` | The draggable tangent-line demo on the home page | `Home` |
| `LoadError.jsx` | "Sorry, this … doesn't exist" / "couldn't be loaded" | Every page with data |

### Styles (`frontend/src/styles/`, plain CSS)

| File | Styles |
|---|---|
| `siderail.css` | The Slim Icon Rail (58px vertical desktop rail & mobile bottom bar), State B Topics Flyout, and Command Palette search modal |
| `floatbar.css` | Popovers, notifications dropdown, and legacy menu styling |
| `dark-mode.css` | **Complete dark mode theme**: background colors, cards, note blocks, choices, score cards, rail, flyout, and dictionary when `[data-theme="dark"]` |
| `footer.css` | The 4-column responsive site footer and creator about-me portfolio links |
| `test-score.css` | The test completion score summary card, pass/review badges, and action buttons |
| `dictionary.css` | The floating dictionary button, popup window, resize handle and result cards |
| `home.css` | The home page |
| `note-page.css` | The page around a note: colours (`--brand`…), header, card width, previous/next cards |
| `note-blocks.css` | The 8 blocks inside notes (`CONCEPT`, `FORMULA`…), with their colours and labels |
| `practice.css` | A practice set or paper: problems, levels, answer boxes, multiple-choice buttons, "Practise this note" |
| `practice-list.css` | The practice hub and the tabs on `/past/eju` and `/past/jlpt` |
| `past.css` | The mock question lists |
| `account.css` | The log in / sign up form and the account settings page (`/account`) |
| `settings.css` | Quick Settings popover, theme selector cards, font size presets, font style chips, live preview, feedback cards, and full `/settings` page tabs |

---

## 4. How Key Frontend Features Work

### 4.1 Rendering notes, demos, and formulas (`NoteContent.jsx` & `mathjax.js`)

- **Scripts in notes (`NoteContent.jsx`):** React does not execute `<script>` tags inside `dangerouslySetInnerHTML`. Instead, `NoteContent.jsx` finds every `<script>` inside the injected HTML and runs them in order (loading external helper scripts like `venn.js` once if needed, and freeing any JSXGraph boards via `JXG.JSXGraph.freeBoard` when leaving a note). Because moving between notes does not reload the browser tab, note scripts must wrap their variables in `(function () { ... })();` and never wait for `DOMContentLoaded`.
- **MathJax (`src/mathjax.js`):** Each element must be typeset **only once**. A rendered MathJax formula keeps a hidden MathML copy for screen readers, and typesetting the same element a second time would render a duplicate formula inside the first. `typeset(element)` in `src/mathjax.js` tracks which DOM elements it has already processed and runs jobs sequentially.

### 4.2 Interactive practice & mock questions (`practice.js`)

When `PracticeSet.jsx` or `PastPaper.jsx` mounts a set's HTML, `setupPractice()` in `src/practice.js` scans every `<section class="practice-problem">` and attaches interactive controls:
- If `data-choices` is present (e.g. JLPT mock tests), it builds clickable multiple-choice buttons and checks the selected choice against `data-answer`.
- Otherwise, if `data-answer` is present, it builds a numeric input box and **Check** button. `toNumber()` parses expressions with `+ − × ÷ ^ ( )`, `√`, `π` and `e` and accepts answers within `0.01`.
- It adds **"I got it"** (`"solved"`) and **"Review later"** (`"review"`) buttons, updating the "Solved n of m" counter in the header and saving progress via `src/progress.js`.

### 4.3 Saving progress and `localStorage` (`progress.js` & `auth.jsx`)

Pages never talk directly to `localStorage` or `/api/progress`. They only call functions in `src/progress.js`:
- **Logged out:** `progress.js` reads and writes `localStorage` in the browser.
- **Logged in:** `progress.js` reads from the in-memory account cache loaded at login and sends updates to `PUT /api/progress/<path>`.
- **On login or signup (`src/auth.jsx`):** `startAccount()` sends any progress stored in `localStorage` to `POST /api/progress/merge`, clears it from `localStorage`, and increments the `<Routes key={...}>` in `App.jsx` so the current page immediately re-renders with the user's merged account progress.

Hiding where progress is stored behind `src/progress.js` is called **encapsulation**—none of the page components need `if (loggedIn)` branches.

**All `localStorage` keys used by the frontend:**

| Key | Written by | What it holds |
|---|---|---|
| `practice:<path>` | `src/progress.js` (logged out only) | One practice set's progress, e.g. `practice:math-1/03-quadratic-functions/01-vertex-form`. A JSON map from problem index (from 0) to `"solved"` or `"review"`. Mock papers use `practice:past/<path>` so they never clash with a practice set |
| `practice-hub:course` | `src/components/HubTabs.jsx` | The course tab last opened on `/practice` |
| `past-tab:<exam>` | `src/components/HubTabs.jsx` | The tab last opened on a mock-question list, e.g. `past-tab:eju` or `past-tab:jlpt` |
| `noteFontSize` / `app_font_size` | `src/pageHooks.js` (`useFontSize`) | Reading font scaling percentage, from 70% to 160% (presets: 85%, 100%, 115%, 130%) |
| `app_font_family` | `src/pageHooks.js` (`useFontFamily`) | Selected typeface family (`"default"`, `"noto"`, `"serif"`) |
| `theme` | `src/pageHooks.js` (`useTheme`) | User's preferred color scheme (`"dark"` or `"light"`). Pre-checked by `index.html` inline script to avoid screen flash |
| `read_notifications` | `src/components/NotificationBell.jsx` | Array of broadcast notification IDs marked as read |
| `learnsolo_dict_size` | `src/components/FloatingDictionary.jsx` | The user's preferred `{width, height}` size for the floating dictionary popup |

### 4.4 Dark Mode Theme Switching (`useTheme` & `dark-mode.css`)

LearnSolo features a complete system-aware and toggleable dark theme:

- **State Hook (`src/pageHooks.js`):** `useTheme()` reads `localStorage.getItem('theme')`, falling back to the OS system preference via `window.matchMedia('(prefers-color-scheme: dark)')`. It returns `[theme, toggleTheme]` and syncs the root `data-theme="dark"` (or `"light"`) attribute on `document.documentElement`.
- **Zero-Flash Pre-render Script (`index.html`):** An inline `<script>` in `<head>` executes before the DOM renders to immediately set `data-theme` from `localStorage`, preventing any white screen flash.
- **Theme Stylesheet (`src/styles/dark-mode.css`):** Overrides color variables and card styles when `[data-theme="dark"]` is active, providing high-contrast backgrounds for notes, the 8 note blocks, multiple choice test buttons, problem checks, test score cards, and the floating dictionary.

### 4.5 Hybrid Settings & Preferences System (Theme, Font, Account)

LearnSolo provides a hybrid settings architecture designed for seamless study workflows:

1. **Quick Settings Popover (`src/components/SettingsPopover.jsx`):**
   - Opened instantly by clicking `⚙️ Settings` in the Slim Icon Rail (`AppRail.jsx`) from any page without navigating away.
   - **Theme Tab:** Instant 1-click toggle between ☀️ Light Mode and 🌙 Dark Mode with live card selection.
   - **Font Tab:** Preset scale buttons (`85% Compact`, `100% Default`, `115% Comfortable`, `130% Large`), stepper controls (`A−` / `A+`), and an interactive live preview scaling Japanese reading text and mathematical formulas in real time.
   - **Account Tab:** Displays the current logged-in email, active session status, logout button, or guest sign-up prompt.
   - **Footer Shortcut:** A direct link to the comprehensive settings page (`/settings`).

2. **Dedicated Settings Hub (`src/pages/AccountSettings.jsx` at `/settings` and `/account`):**
   - Full-page tabbed interface with 3 deep-preference tabs:
     - **Account & Security:** Change password form (current password, new password with 8-character validation, confirmation), two-step progress reset ("Danger Zone"), and session management.
     - **Theme & Appearance:** Detailed theme selector cards, zero-flash persistence overview, and full component previews.
     - **Font & Typography:** Reading text size presets, font style picker (Modern System Sans, Japanese Noto Sans, Academic Serif), and dynamic reading preview.
   - URL hash synchronization (`/settings#account`, `/settings#theme`, `/settings#font`) enables direct deep linking to any setting tab.

---

## 5. Running and Building the Frontend

### Running in development (`npm run dev`)

Make sure PostgreSQL and Flask (`http://localhost:5000`) are running in Terminal 1 (see [docs/backend-guide.md](backend-guide.md)), then in Terminal 2:

```bash
cd frontend
npm install        # first time, and whenever package.json changes
npm run dev        # starts Vite on http://localhost:5173
```

Open **http://localhost:5173** in your browser. Vite hot-reloads any `.jsx`, `.js`, or `.css` file as soon as you save it, and proxies `/api/...` requests to Flask on `:5000`.

### Building for production (`npm run build`)

```bash
cd frontend
npm run build      # outputs compiled assets into frontend/dist/
```

Always run `npm run build` before opening a pull request to verify there are no missing imports or case-sensitive filename issues.

---

## 6. Frontend Recipes (Changing and Expanding)

### 6.1 Finding where something on the screen comes from

- **A piece of text on the page:** search in VS Code (`Ctrl+Shift+F`) or run:
  ```bash
  grep -rn "Practise this note" frontend/src
  ```
- **How something looks (colour, spacing, font):**
  1. Right-click the element in the browser → **Inspect**.
  2. The **Elements** panel shows its HTML tag and `class`.
  3. The **Styles** panel shows the exact CSS file and line number (e.g. `note-page.css:42`). You can tweak values live in DevTools and then copy them into the `.css` file.
- **Inspecting variables:** add `console.log(data)` inside a component and check **F12 → Console** (remove before committing).

### 6.2 Small frontend changes

- **Change text on a page:** edit the `.jsx` file and save. In JSX, plain text sits between tags and `{...}` inserts a JavaScript value:
  ```jsx
  <strong>Practise this note: {main.title}</strong>
  ```
- **Change the site's main brand colour:** edit `--brand` at the top of `frontend/src/styles/note-page.css`:
  ```css
  :root {
      --brand: #667eea;        /* the purple */
      --brand-dark: #4c3fb5;
  ```
- **Change a course's icon or colour on the home page:** edit `COURSE_STYLE` at the top of `frontend/src/pages/Home.jsx`. Icons are free [Font Awesome](https://fontawesome.com/search?ic=free) names such as `fa-compass` or `fa-atom`.

### 6.3 Recipe: Adding a new page (`/about`)

Example: adding an **About** page at `/about` with static text:

1. **Create `frontend/src/pages/About.jsx`:**
   ```jsx
   // The About page: /about
   import { Link } from 'react-router'
   import { usePageTitle } from '../pageHooks.js'
   import FloatBar from '../components/FloatBar.jsx'

   export default function About() {
     usePageTitle('About · Learn Solo')
     return (
       <>
         <FloatBar />
         <header className="note-header">
           <div className="note-header-inner">
             <h1>About Learn Solo</h1>
           </div>
         </header>
         <main className="past-content">
           <p>Learn Solo is a free interactive study site.</p>
           <p><Link to="/">Back to the home page</Link></p>
         </main>
       </>
     )
   }
   ```
   - `export default function About()` defines the component so `App.jsx` can import it.
   - `<>...</>` is a React Fragment that groups elements without adding an extra `<div>`.
   - `className` is JSX's name for HTML's `class` attribute.
2. **Register its `<Route>` in `frontend/src/App.jsx`:**
   Import `About` at the top:
   ```jsx
   import About from './pages/About.jsx'
   ```
   And add the route **above** `<Route path="*" element={<NotFound />} />`:
   ```jsx
   <Route path="/about" element={<About />} />
   ```
3. **Open `http://localhost:5173/about`**, and link to it anywhere using `<Link to="/about">About</Link>`. You don't need to touch Flask, because `backend/frontend.py` already serves `index.html` for every non-`/api/` path.

### 6.4 Recipe: Calling a new API endpoint (`RandomNoteButton`)

Suppose you added `GET /api/random-note` in Flask (see [docs/backend-guide.md, Section 7.4](backend-guide.md#74-recipe-adding-a-new-api-endpoint-apirandom-note)) and want a **"Surprise me"** button on the home page:

1. **In `frontend/src/pages/Home.jsx`**, import `useNavigate` from `'react-router'` and `fetchJson` from `'../api.js'`, and add this component:
   ```jsx
   function RandomNoteButton() {
     const navigate = useNavigate()
     async function openRandomNote() {
       const { url } = await fetchJson('/api/random-note')
       navigate(url)
     }
     return (
       <button className="btn-ghost" onClick={openRandomNote}>
         <i className="fas fa-shuffle"></i> Surprise me
       </button>
     )
   }
   ```
   Place `<RandomNoteButton />` inside `<div className="hero-actions">`.
2. **In `frontend/src/styles/home.css`**, reset browser default `<button>` styles on `button.btn-ghost`:
   ```css
   button.btn-ghost { background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
   ```
- **Why `fetchJson` instead of `useApi`?** `useApi` fetches automatically when a component mounts. Here we only want to fetch **when the user clicks the button**.

### 6.5 Recipe: Showing a new API field (`data.tags` chip)

Once `/api/notes/<path>` includes `"tags"` (see [docs/backend-guide.md, Section 7.5](backend-guide.md#75-recipe-adding-a-new-database-column-notetags)):

1. **In `frontend/src/pages/Note.jsx`**, inside `<p className="note-chips">`:
   ```jsx
   {data.tags && <span className="note-tag"><i className="fas fa-tag"></i> {data.tags}</span>}
   ```
   (`A && B` in JSX renders `B` only when `A` is truthy.)
2. **In `frontend/src/styles/note-page.css`:**
   ```css
   .note-chips .note-tag {
       padding: 4px 12px;
       border-radius: 999px;
       font-size: 0.85rem;
       font-weight: 600;
       color: #fff;
       border: 1px dashed rgba(255, 255, 255, 0.6);
   }
   ```

### 6.6 Adding or updating npm packages

From `frontend/`:

```bash
npm install some-package           # installs it and updates package.json + package-lock.json
npm outdated                       # see which packages have newer versions
npm update                         # update within allowed semver ranges
```

Always commit `package.json` and `package-lock.json` together.

---

## 7. Troubleshooting Frontend Errors & Learning Path

### Where frontend errors appear

| Where | What shows there | How to open it |
|---|---|---|
| **Browser Console** | JavaScript runtime errors, React warnings, `console.log` output | Press **F12 → Console** |
| **Browser Network tab** | Every `/api/...` request, its HTTP status (`200`, `404`, `500`), and JSON response | Press **F12 → Network**, then reload |
| **Vite terminal / page overlay** | Syntax errors or bad imports in `.jsx` / `.js` / `.css` | Terminal running `npm run dev` (and red overlay in browser) |

### Common frontend problems

| What you see | What it means | Fix |
|---|---|---|
| Vite says `Port 5173 is in use, trying another one...` | `npm run dev` is already running in another terminal | Open the URL Vite prints, or stop the other terminal |
| `sh: 1: vite: not found` | `frontend/node_modules/` is missing | Run `npm install` inside `frontend/` |
| Page loads empty or says `"couldn't be loaded"` | Flask isn't running on `:5000`, or Vite lost its proxy connection | Make sure `python app.py` is running in `backend/`. If it is, restart `npm run dev` (`Ctrl+C` then `npm run dev`) |
| `npm run build` fails on Render/server but `npm run dev` worked | Production build is stricter (often uppercase/lowercase mismatch in an import path on Linux) | Run `cd frontend && npm run build` locally and fix the reported import |
| Formulas show as raw `$x^2$` | MathJax didn't run on that element | Use `typeset(el)` from `src/mathjax.js` and check F12 → Console |

### Hands-on exercises for Frontend (CSS & React)

1. **Level 1 (CSS & DevTools):**
   - Right-click the purple header on a note page → **Inspect**, and find its rule in `note-page.css`.
   - Change `--brand` in `frontend/src/styles/note-page.css` to another colour, watch Vite update the page instantly, then restore it.
2. **Level 3 (React):**
   - Read `frontend/src/App.jsx`, then `pages/NotFound.jsx` (the smallest page), then `pages/Note.jsx` alongside Sections 1 and 2 above.
   - Build the `/about` page (Section 6.3) on a test branch.
   - Find `"Note 5 of 8"` in `Note.jsx`, change how it is formatted, and inspect how `useState` works in `AppRail.jsx` / `FloatBar.jsx` (the navigation rail & drawers) and `FloatingDictionary.jsx`.
