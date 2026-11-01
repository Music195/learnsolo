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
    // /api/... or /static/... arrives here first; "proxy" passes it on to Flask.
    // So the browser only ever talks to one address, and in code we can write
    // fetch('/api/home') without the Flask address.
    proxy: {
      '/api': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
    },

    // Allow importing files from the whole project, not just frontend/:
    // the pages use the CSS in backend/static/css/ (see src/styles.js).
    fs: { allow: ['..'] },
  },
})
