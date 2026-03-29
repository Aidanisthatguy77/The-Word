# The Word

The Word now includes a static front-end **plus** a production-style backend API for persistent data, local AI inference, full historical GBT ingestion, and real clip rendering.

## What you now have

- Full Bible study front-end (Bible, Daily Scripture, AI Guide, Church/GBT, Notes, Study Plans, Prayer)
- Real backend database (SQLite) for notes, prayers, imported videos, and rendered clips
- Local model inference endpoint using your own model weights via Hugging Face Transformers
- Full-history GBT import pipeline using `yt-dlp` (channel videos index + per-video metadata)
- True clip rendering/export pipeline using `yt-dlp` + `ffmpeg`

## Project structure

- `index.html`, `styles.css`, `app.js`: front-end app
- `backend/app.py`: FastAPI backend API
- `backend/requirements.txt`: backend dependencies
- `backend/the_word.db`: SQLite database (created at runtime)
- `backend/media/`: downloaded video and rendered clip outputs

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

2) Ensure system tools exist:

- `yt-dlp`
- `ffmpeg`

3) Start API:

```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## Key API endpoints

- `GET /api/health`
- `POST /api/ai/chat` (true local-model inference)
- `POST /api/gbt/import` (full historical import from @GBT)
- `GET /api/gbt/videos`
- `POST /api/clips/render` (renders and exports an mp4 clip)
- `GET /api/clips`
- `GET/POST /api/notes`
- `GET/POST /api/prayers`
- `POST /api/prayers/{id}/answer`

## Notes

- Model path is configurable via `THE_WORD_MODEL_PATH` (default: `distilgpt2`).
- Database path is configurable via `THE_WORD_DB`.
- Media output folder is configurable via `THE_WORD_MEDIA_DIR`.
- GBT channel source is configurable via `GBT_CHANNEL_URL` (default: `https://www.youtube.com/@GBT`).
