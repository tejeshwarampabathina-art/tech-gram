# Techgram

Techgram uses a Vite + React frontend and a Flask backend.

## Local run

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The frontend reads its backend URL from `VITE_API_BASE_URL`. If that variable is not set, it falls back to `http://localhost:5000`.

## GitHub deployment

This repo includes `.github/workflows/deploy-pages.yml`, which deploys the frontend to GitHub Pages whenever you push to `main` or `master`.

Important:

- GitHub Pages can host only the frontend.
- The Flask backend, SQLite database, and uploaded files need a separate host such as Render, Railway, Fly.io, or a VPS.
- Add a GitHub repository secret named `VITE_API_BASE_URL` and set it to your deployed backend URL, for example `https://your-backend.example.com`.

## First push to GitHub

After creating an empty GitHub repository, run:

```bash
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Then in GitHub:

1. Open `Settings` -> `Pages`.
2. Set the source to `GitHub Actions`.
3. Add the `VITE_API_BASE_URL` secret if your backend is already deployed.

## Notes

- `vite.config.js` uses a relative base, which is better for GitHub Pages.
- The backend now generates uploaded file URLs from the active request host instead of hardcoding localhost.
