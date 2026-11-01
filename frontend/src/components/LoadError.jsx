// What a page shows when its data couldn't be loaded.
// `error` comes from useApi() (src/api.js); error.status is the HTTP status.

export default function LoadError({ error, what = 'page' }) {
  if (error.status === 404) {
    return (
      <p className="section">
        Sorry, this {what} doesn't exist. <a href="/">Back to the home page</a>
      </p>
    )
  }
  return (
    <p className="section">
      Sorry, the {what} couldn't be loaded. Please refresh the page.
      {/* import.meta.env.DEV is true only under "npm run dev", so this hint
          never shows on the real site */}
      {import.meta.env.DEV && (
        <><br /><small>Developer hint: is Flask running on :5000? (<code>cd backend && ../venv/bin/python app.py</code>)</small></>
      )}
    </p>
  )
}
