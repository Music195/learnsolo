import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite settings. Vite runs the React app while you develop (npm run dev)
// and makes the finished files for the server (npm run build).
export default defineConfig({
  // Lets Vite understand React's JSX (the HTML-like code in .jsx files)
  plugins: [react()],

  server: {
    port: 5173,

    // The React app runs on :5173 and Flask on :5000. A request React makes to
    // /api/... arrives here first; "proxy" passes it on to Flask. So the
    // browser only ever talks to one address, and in code we can write
    // fetch('/api/home') without the Flask address.
    // (On the live site Flask serves the React app too, so it's one address
    // anyway; see backend/frontend.py.)
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },

  // Files in public/ (favicon, /static/js/demos/...) are served as they are,
  // at the same address, and copied into dist/ by `npm run build`.

})
