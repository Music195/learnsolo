<!--
  GitHub puts this checklist into every new pull request.
  Tick a box by writing [x] instead of [ ]. Delete the parts that don't
  apply to this change (e.g. "Content" for a code-only change).
  How to check each point: docs/content-guide.md (section in brackets).
-->

## Summary
What this PR changes, and why.

---

## Checklist

### Branch
- [ ] Made on its own branch, not on `main` (E1)
- [ ] No force-pushes

### Content (notes, practice sets, past papers)
- [ ] Ran `flask import-content` and opened every changed page (section 10)
- [ ] Notes keep the 8 blocks in order, with no `<style>` block (section 2)
- [ ] Demo scripts are wrapped in `(function () { ... })();` with a unique id prefix (section 3)
- [ ] Formulas render, and demos draw (no errors in the browser's Console, F12)
- [ ] Practice sets: every `data-answer` is accepted when typed, the "Uses:" links open the right notes, the set appears on `/practice` (section 7)
- [ ] A renamed set or paper lists its old path in `data-moved-from` (sections 7 and 8)

### Code
- [ ] `../venv/bin/pytest` passes, from `backend/` (E8)
- [ ] `npm run build` works, from `frontend/` (E1)
- [ ] New behaviour has a test, if it's in the backend (E8)
- [ ] `models.py` changed? The migration file from `flask db migrate` is included (E7)
- [ ] New package? Added to `requirements.txt` or `package.json` with `package-lock.json` (E9)
- [ ] No secrets in the code (`.env` stays out of git)

### Pages
- [ ] Clicked through the changed pages: home, a note, a practice set, a past paper
- [ ] Still readable on a phone-sized window (F12 → the phone icon)
- [ ] Logging in and saving progress still work, if this PR touches them

### Documentation
- [ ] `docs/content-guide.md` updated if something works differently now
- [ ] Commit messages say what changed and why

---

## Screenshots (optional)
For changes you can see.
