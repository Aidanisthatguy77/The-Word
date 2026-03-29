# The Word

The Word is a complete Bible study web platform (mobile-first + desktop friendly) built as a static app.

## Features

- Complete KJV Bible navigation (all 66 books + chapter selector)
- Verse/chapter/topic search with instant load
- Verse highlighting + one-click copy
- Daily Scripture with rotating topic, context, and practical application
- AI Scripture Guide (free local mode, no paid API) with GBT video recommendations
- Church Classes section connected to `https://www.youtube.com/@GBT` feed, topic tabs, embedded playback, and search
- Clip Studio to generate on-demand topic clip suggestions + full-video links from GBT content
- Scripture Notepad with tags, topic, date, and instant search
- Study Plans with progress tracking + streak counter
- Prayer Journal with answered prayer history
- Dark mode + light mode

## Run locally

No build step needed.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Notes

- Bible passages are fetched from `bible-api.com` using KJV translation.
- GBT videos are fetched through the public YouTube RSS feed for the `@GBT` channel via `rss2json`.
- Notes, highlights, journal entries, clip collections, and plan progress are saved in browser `localStorage`.
