// The starting point of the React app (index.html loads this file).

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import './styles.js'

// createRoot(...).render(...) draws <App /> inside <div id="root">.
//   StrictMode     a development helper: it runs some code twice on purpose
//                  to reveal bugs early. It does nothing in the built site.
//   BrowserRouter  keeps track of the address in the browser bar, so App can
//                  show the page that matches it (see App.jsx).
//   AuthProvider   knows who is logged in, for every page (see auth.jsx).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
