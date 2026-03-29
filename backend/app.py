from __future__ import annotations

import json
import os
import shutil
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import hashlib

DB_PATH = Path(os.getenv("THE_WORD_DB", "backend/the_word.db"))
MODEL_PATH = os.getenv("THE_WORD_MODEL_PATH", "distilgpt2")
GBT_CHANNEL_URL = os.getenv("GBT_CHANNEL_URL", "https://www.youtube.com/@GBT")
MEDIA_DIR = Path(os.getenv("THE_WORD_MEDIA_DIR", "backend/media"))

app = FastAPI(title="The Word API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory=".", html=False), name="assets")


class ChatRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 180


class NoteIn(BaseModel):
    book: str | None = None
    topic: str
    tags: list[str] = Field(default_factory=list)
    body: str


class PrayerIn(BaseModel):
    text: str


class ClipRequest(BaseModel):
    video_id: str
    start_seconds: int
    end_seconds: int
    title: str


class AdminLoginRequest(BaseModel):
    password: str


class AdminPasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AdminFeaturesRequest(BaseModel):
    features: dict[str, Any]


def db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book TEXT,
            topic TEXT NOT NULL,
            tags_json TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prayers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            answered INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            youtube_id TEXT UNIQUE NOT NULL,
            title TEXT,
            description TEXT,
            channel TEXT,
            published_at TEXT,
            duration INTEGER,
            payload_json TEXT NOT NULL,
            imported_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            youtube_id TEXT NOT NULL,
            title TEXT NOT NULL,
            start_seconds INTEGER NOT NULL,
            end_seconds INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    )
    default_hash = hashlib.sha256("admin123".encode()).hexdigest()
    conn.execute(
        "INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_password_hash', ?)",
        (default_hash,),
    )
    conn.execute(
        "INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('feature_flags', '{}')"
    )
    conn.commit()
    conn.close()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def app_index() -> FileResponse:
    return FileResponse("index.html")


@app.get("/app.js")
def app_js() -> FileResponse:
    return FileResponse("app.js")


@app.get("/styles.css")
def app_css() -> FileResponse:
    return FileResponse("styles.css")


@app.get("/api/notes")
def list_notes() -> list[dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT * FROM notes ORDER BY id DESC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "book": r["book"],
            "topic": r["topic"],
            "tags": json.loads(r["tags_json"]),
            "body": r["body"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


@app.post("/api/notes")
def create_note(payload: NoteIn) -> dict[str, Any]:
    conn = db()
    now = datetime.utcnow().isoformat()
    cur = conn.execute(
        "INSERT INTO notes (book, topic, tags_json, body, created_at) VALUES (?, ?, ?, ?, ?)",
        (payload.book, payload.topic, json.dumps(payload.tags), payload.body, now),
    )
    conn.commit()
    note_id = cur.lastrowid
    conn.close()
    return {"id": note_id, **payload.model_dump(), "created_at": now}


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int) -> dict[str, bool]:
    conn = db()
    cur = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"ok": True}


@app.get("/api/prayers")
def list_prayers() -> list[dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT * FROM prayers ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/prayers")
def create_prayer(payload: PrayerIn) -> dict[str, Any]:
    conn = db()
    now = datetime.utcnow().isoformat()
    cur = conn.execute(
        "INSERT INTO prayers (text, answered, created_at) VALUES (?, 0, ?)",
        (payload.text, now),
    )
    conn.commit()
    prayer_id = cur.lastrowid
    conn.close()
    return {"id": prayer_id, "text": payload.text, "answered": 0, "created_at": now}


@app.delete("/api/prayers/{prayer_id}")
def delete_prayer(prayer_id: int) -> dict[str, bool]:
    conn = db()
    cur = conn.execute("DELETE FROM prayers WHERE id = ?", (prayer_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Prayer not found")
    return {"ok": True}


@app.post("/api/prayers/{prayer_id}/answer")
def mark_prayer_answered(prayer_id: int) -> dict[str, Any]:
    conn = db()
    cur = conn.execute("UPDATE prayers SET answered = 1 WHERE id = ?", (prayer_id,))
    conn.commit()
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Prayer not found")
    row = conn.execute("SELECT * FROM prayers WHERE id = ?", (prayer_id,)).fetchone()
    conn.close()
    return dict(row)


@app.post("/api/ai/chat")
def ai_chat(payload: ChatRequest) -> dict[str, str]:
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
    except Exception as exc:  # runtime dependency guard
        raise HTTPException(status_code=500, detail=f"Transformers not installed: {exc}") from exc

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
    prompt = (
        "You are The Word Scripture Guide. Explain in plain language, connect practical application, "
        "and keep tone clear and non-preachy.\nUser question: " + payload.prompt + "\nAnswer:"
    )
    inputs = tokenizer(prompt, return_tensors="pt")
    with torch.no_grad():
        out = model.generate(**inputs, max_new_tokens=payload.max_new_tokens, do_sample=True, temperature=0.8)
    text = tokenizer.decode(out[0], skip_special_tokens=True)
    answer = text.split("Answer:", 1)[-1].strip()
    return {"answer": answer}


def _run(cmd: list[str]) -> str:
    proc = subprocess.run(cmd, check=False, capture_output=True, text=True)
    if proc.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Command failed: {' '.join(cmd)}\n{proc.stderr[:2000]}")
    return proc.stdout


@app.post("/api/gbt/import")
def import_gbt_history() -> dict[str, Any]:
    if shutil.which("yt-dlp") is None:
        raise HTTPException(status_code=500, detail="yt-dlp not installed")

    playlist_json = _run(["yt-dlp", "--flat-playlist", "-J", f"{GBT_CHANNEL_URL}/videos"])
    data = json.loads(playlist_json)
    entries = data.get("entries", [])
    ids = [e.get("id") for e in entries if e.get("id")]

    conn = db()
    imported = 0
    for vid in ids:
        meta_raw = _run(["yt-dlp", "-J", f"https://www.youtube.com/watch?v={vid}"])
        meta = json.loads(meta_raw)
        conn.execute(
            """
            INSERT INTO videos (youtube_id, title, description, channel, published_at, duration, payload_json, imported_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(youtube_id) DO UPDATE SET
              title=excluded.title,
              description=excluded.description,
              channel=excluded.channel,
              published_at=excluded.published_at,
              duration=excluded.duration,
              payload_json=excluded.payload_json,
              imported_at=excluded.imported_at
            """,
            (
                vid,
                meta.get("title"),
                meta.get("description"),
                meta.get("channel"),
                meta.get("upload_date"),
                meta.get("duration") or 0,
                json.dumps(meta),
                datetime.utcnow().isoformat(),
            ),
        )
        imported += 1
    conn.commit()
    total = conn.execute("SELECT COUNT(*) AS c FROM videos").fetchone()["c"]
    conn.close()
    return {"imported_this_run": imported, "videos_total": total}


@app.get("/api/gbt/videos")
def list_gbt_videos() -> list[dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT youtube_id, title, description, channel, published_at, duration FROM videos ORDER BY published_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/clips/render")
def render_clip(payload: ClipRequest) -> dict[str, Any]:
    if shutil.which("yt-dlp") is None:
        raise HTTPException(status_code=500, detail="yt-dlp not installed")
    if shutil.which("ffmpeg") is None:
        raise HTTPException(status_code=500, detail="ffmpeg not installed")
    if payload.end_seconds <= payload.start_seconds:
        raise HTTPException(status_code=400, detail="end_seconds must be greater than start_seconds")

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    source = MEDIA_DIR / f"{payload.video_id}.mp4"
    output = MEDIA_DIR / f"clip_{payload.video_id}_{payload.start_seconds}_{payload.end_seconds}.mp4"

    _run([
        "yt-dlp",
        "-f",
        "mp4",
        "-o",
        str(source),
        f"https://www.youtube.com/watch?v={payload.video_id}",
    ])

    _run([
        "ffmpeg",
        "-y",
        "-i",
        str(source),
        "-ss",
        str(payload.start_seconds),
        "-to",
        str(payload.end_seconds),
        "-c",
        "copy",
        str(output),
    ])

    conn = db()
    now = datetime.utcnow().isoformat()
    cur = conn.execute(
        "INSERT INTO clips (youtube_id, title, start_seconds, end_seconds, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (payload.video_id, payload.title, payload.start_seconds, payload.end_seconds, str(output), now),
    )
    conn.commit()
    clip_id = cur.lastrowid
    conn.close()
    return {
        "id": clip_id,
        "youtube_id": payload.video_id,
        "title": payload.title,
        "start_seconds": payload.start_seconds,
        "end_seconds": payload.end_seconds,
        "file_path": str(output),
        "created_at": now,
    }


@app.get("/api/clips")
def list_clips() -> list[dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT * FROM clips ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/saved")
def list_saved_items() -> list[dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT * FROM saved_items ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/saved")
def create_saved_item(payload: dict[str, Any]) -> dict[str, Any]:
    conn = db()
    cur = conn.execute(
        "INSERT INTO saved_items (type, title, content, created_at) VALUES (?, ?, ?, ?)",
        (
            str(payload.get("type", "item")),
            str(payload.get("title", "Saved Item")),
            str(payload.get("content", "")),
            str(payload.get("created_at", datetime.utcnow().isoformat())),
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM saved_items WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/saved/{saved_id}")
def delete_saved_item(saved_id: int) -> dict[str, bool]:
    conn = db()
    cur = conn.execute("DELETE FROM saved_items WHERE id = ?", (saved_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return {"ok": True}


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginRequest) -> dict[str, bool]:
    conn = db()
    row = conn.execute("SELECT value FROM admin_settings WHERE key = 'admin_password_hash'").fetchone()
    conn.close()
    incoming = hashlib.sha256(payload.password.encode()).hexdigest()
    if not row or row["value"] != incoming:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"ok": True}


@app.post("/api/admin/password")
def update_admin_password(payload: AdminPasswordRequest) -> dict[str, bool]:
    conn = db()
    current = conn.execute("SELECT value FROM admin_settings WHERE key = 'admin_password_hash'").fetchone()
    current_hash = hashlib.sha256(payload.current_password.encode()).hexdigest()
    if not current or current["value"] != current_hash:
        conn.close()
        raise HTTPException(status_code=401, detail="Current password invalid")
    new_hash = hashlib.sha256(payload.new_password.encode()).hexdigest()
    conn.execute("UPDATE admin_settings SET value = ? WHERE key = 'admin_password_hash'", (new_hash,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/admin/features")
def update_feature_flags(payload: AdminFeaturesRequest) -> dict[str, Any]:
    conn = db()
    conn.execute(
        "UPDATE admin_settings SET value = ? WHERE key = 'feature_flags'",
        (json.dumps(payload.features),),
    )
    conn.commit()
    row = conn.execute("SELECT value FROM admin_settings WHERE key = 'feature_flags'").fetchone()
    conn.close()
    return {"ok": True, "features": json.loads(row["value"]) if row else {}}


@app.get("/api/admin/features")
def get_feature_flags() -> dict[str, Any]:
    conn = db()
    row = conn.execute("SELECT value FROM admin_settings WHERE key = 'feature_flags'").fetchone()
    conn.close()
    return {"features": json.loads(row["value"]) if row else {}}
