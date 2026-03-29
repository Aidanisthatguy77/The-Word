# The Word

The Word is now a **full web app** powered by FastAPI + SQLite (not static-only usage). The backend serves the frontend, stores data, runs AI inference, imports GBT videos, renders real clips, and supports admin controls.

## What is live in this build

- Full app tabs: Bible, Daily Scripture, AI Guide, Church/GBT, Notes, Plans, Prayer, Saved History, Admin
- Backend-first persistence for notes, prayers, saved history, imported videos, and clips
- Local AI inference endpoint (`/api/ai/chat`) via Transformers/Torch
- Full-history GBT import endpoint (`/api/gbt/import`) via yt-dlp
- True clip rendering endpoint (`/api/clips/render`) via yt-dlp + ffmpeg
- Admin login, password change, and feature flags

## Run as a real web app (single backend service)

```bash
python3 -m pip install -r backend/requirements.txt
python3 -m pip install yt-dlp
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Open: `http://localhost:8000`

## Free VM deployment (outside Render/Railway)

Deployment assets are included:

- `deploy/install_free_vm.sh`
- `deploy/the-word.service`
- `deploy/Caddyfile`

Typical flow on a free VM (Oracle Always Free or similar):

```bash
git clone <your_repo_url> /opt/the-word
cd /opt/the-word
DOMAIN=your-domain.com APP_DIR=/opt/the-word ./deploy/install_free_vm.sh
```

This script installs dependencies, configures systemd for FastAPI, configures Caddy reverse proxy + HTTPS, and starts services.

## Key endpoints

- `GET /` (serves web app)
- `GET /api/health`
- `GET/POST/DELETE /api/notes`
- `GET/POST/DELETE /api/prayers`
- `POST /api/prayers/{id}/answer`
- `GET/POST/DELETE /api/saved`
- `POST /api/ai/chat`
- `POST /api/gbt/import`
- `GET /api/gbt/videos`
- `POST /api/clips/render`
- `GET /api/clips`
- `POST /api/admin/login`
- `POST /api/admin/password`
- `GET/POST /api/admin/features`

## Admin defaults

- Default password: `admin123`
- Change it immediately in Admin tab.

## Environment variables

- `THE_WORD_MODEL_PATH` (default: `distilgpt2`)
- `THE_WORD_DB` (default: `backend/the_word.db`)
- `THE_WORD_MEDIA_DIR` (default: `backend/media`)
- `GBT_CHANNEL_URL` (default: `https://www.youtube.com/@GBT`)
