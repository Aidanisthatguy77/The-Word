# The Word

The Word now includes a static front-end **plus** a backend API for persistence, local AI inference, full historical GBT import, true clip rendering, saved history, and admin controls.

## Included now

- Bible, Daily Scripture, AI Guide, Church/GBT, Notes, Study Plans, Prayer Journal
- Dedicated **Saved History** tab that stores scripture, AI answers, notes, prayers, plans, videos, and clips
- **Admin Panel** with:
  - login
  - API base URL control
  - full GBT import trigger
  - password change
  - feature flag JSON storage
- Real server/database (SQLite)
- Local model inference using your own model weights via Transformers
- True clip rendering/export with yt-dlp + ffmpeg
- Full history import pipeline for @GBT using yt-dlp

## Project structure

- `index.html`, `styles.css`, `app.js`: front-end app
- `backend/app.py`: FastAPI backend API
- `backend/requirements.txt`: backend dependencies
- `backend/the_word.db`: SQLite database (created at runtime)
- `backend/media/`: downloaded videos and rendered clips

## Run frontend

```bash
python3 -m http.server 4173
```

Open: `http://localhost:4173`

## Run backend

1) Install requirements:

```bash
python3 -m pip install -r backend/requirements.txt
```

2) Ensure tools are installed:

- `yt-dlp`
- `ffmpeg`

3) Start API:

```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## Key endpoints

- `GET /api/health`
- `POST /api/ai/chat`
- `POST /api/gbt/import`
- `GET /api/gbt/videos`
- `POST /api/clips/render`
- `GET /api/clips`
- `GET/POST /api/notes`
- `GET/POST /api/prayers`
- `POST /api/prayers/{id}/answer`
- `GET/POST /api/saved`
- `POST /api/admin/login`
- `POST /api/admin/password`
- `GET/POST /api/admin/features`

## Admin defaults

- Default admin password: `admin123`
- Change it immediately from the Admin tab.

## Environment configuration

- `THE_WORD_MODEL_PATH` (default: `distilgpt2`)
- `THE_WORD_DB`
- `THE_WORD_MEDIA_DIR`
- `GBT_CHANNEL_URL` (default: `https://www.youtube.com/@GBT`)
