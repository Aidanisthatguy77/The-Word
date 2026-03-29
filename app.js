const TABS = [
  { id: "bible", label: "📖 Bible" },
  { id: "daily", label: "☀️ Daily Scripture" },
  { id: "guide", label: "🤖 AI Scripture Guide" },
  { id: "church", label: "⛪ Church / GBT" },
  { id: "notes", label: "📝 Notepad" },
  { id: "plans", label: "✅ Study Plans" },
  { id: "prayer", label: "🙏 Prayer Journal" },
  { id: "history", label: "🗂️ Saved History" },
  { id: "admin", label: "⚙️ Admin" },
];

const API_BASE = localStorage.getItem("the_word_api_base") || "http://localhost:8000";

const BOOKS = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34], ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25],
  ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13], ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31], ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52],
  ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9], ["Obadiah", 1], ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4],
  ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4],
  ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6], ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5], ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

const DAILY_TOPICS = {
  anxiety: ["Philippians 4:6-7", "1 Peter 5:7", "Isaiah 41:10"], faith: ["Hebrews 11:1", "2 Corinthians 5:7", "Romans 10:17"], purpose: ["Jeremiah 29:11", "Ephesians 2:10", "Romans 8:28"],
  strength: ["Isaiah 40:31", "Philippians 4:13", "Psalm 46:1"], forgiveness: ["Colossians 3:13", "Ephesians 4:32", "1 John 1:9"], leadership: ["Proverbs 11:14", "Mark 10:45", "1 Timothy 4:12"],
  perseverance: ["James 1:2-4", "Galatians 6:9", "Romans 5:3-5"], family: ["Joshua 24:15", "Proverbs 22:6", "Ephesians 6:1-4"], "financial wisdom": ["Proverbs 3:9-10", "Luke 14:28", "Proverbs 21:5"],
  identity: ["2 Corinthians 5:17", "1 Peter 2:9", "Psalm 139:14"], hope: ["Romans 15:13", "Lamentations 3:22-23", "Hebrews 6:19"],
};

const storage = {
  get: (k, fallback) => JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const state = {
  highlighted: storage.get("highlighted", {}),
  notes: storage.get("notes", []),
  prayers: storage.get("prayers", []),
  planProgress: storage.get("planProgress", {}),
  churchVideos: storage.get("churchVideos", []),
  clipCollections: storage.get("clipCollections", []),
  savedHistory: storage.get("savedHistory", []),
  adminAuthed: storage.get("adminAuthed", false),
};

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

function pushSavedItem(item) {
  const record = { ...item, created_at: new Date().toLocaleString() };
  state.savedHistory.unshift(record);
  state.savedHistory = state.savedHistory.slice(0, 500);
  storage.set("savedHistory", state.savedHistory);
  api("/api/saved", { method: "POST", body: JSON.stringify(record) }).catch(() => {});
  buildHistory();
}

function initTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = TABS.map((t, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("");
  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
}

async function fetchPassage(ref) {
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`);
  if (!res.ok) throw new Error("Could not load scripture right now.");
  return res.json();
}

function buildBible() {
  const el = document.getElementById("bible");
  el.innerHTML = `<div class="card"><h2>Complete KJV Bible</h2><div class="grid"><div><label>Book</label><select id="bookSelect"></select></div><div><label>Chapter</label><select id="chapterSelect"></select></div><div><label>Quick Search</label><input id="quickSearch" placeholder="Romans 8:28 or anxiety" /></div></div><div class="row" style="margin-top:.7rem"><button id="loadChapter" class="btn">Load Chapter</button><button id="searchVerse" class="btn secondary">Search</button></div></div><div id="bibleOutput" class="card"><p class="muted">Choose a passage.</p></div>`;

  const bookSel = document.getElementById("bookSelect");
  const chapterSel = document.getElementById("chapterSelect");
  bookSel.innerHTML = BOOKS.map(([b]) => `<option>${b}</option>`).join("");
  const refresh = () => {
    const chapters = BOOKS.find(([b]) => b === bookSel.value)[1];
    chapterSel.innerHTML = Array.from({ length: chapters }, (_, i) => `<option>${i + 1}</option>`).join("");
  };
  refresh();
  bookSel.addEventListener("change", refresh);
  document.getElementById("loadChapter").addEventListener("click", () => renderPassage(`${bookSel.value} ${chapterSel.value}`));
  document.getElementById("searchVerse").addEventListener("click", () => renderPassage(document.getElementById("quickSearch").value.trim()));
}

async function renderPassage(ref) {
  if (!ref) return;
  const out = document.getElementById("bibleOutput");
  out.innerHTML = `<p class="muted">Loading...</p>`;
  try {
    const data = await fetchPassage(ref);
    out.innerHTML = `<h3>${data.reference}</h3><button id="savePassage" class="btn">Save Passage</button>${data.verses.map((v) => {
      const key = `${data.reference}::${v.verse}`;
      return `<div class="verse ${state.highlighted[key] ? "highlighted" : ""}" data-key="${key}"><strong>${v.verse}</strong> ${v.text.trim()}<div class="row" style="margin-top:.4rem"><button data-a="hl" class="btn secondary">Highlight</button><button data-a="cp" class="btn secondary">Copy</button><button data-a="save" class="btn secondary">Save Verse</button></div></div>`;
    }).join("")}`;

    document.getElementById("savePassage").addEventListener("click", () => pushSavedItem({ type: "scripture", title: data.reference, content: data.text }));
    out.querySelectorAll("button[data-a]").forEach((btn) => btn.addEventListener("click", (e) => {
      const verseEl = e.target.closest(".verse");
      const key = verseEl.dataset.key;
      const text = verseEl.innerText.replace("HighlightCopySave Verse", "").trim();
      if (btn.dataset.a === "hl") {
        state.highlighted[key] = !state.highlighted[key];
        storage.set("highlighted", state.highlighted);
        verseEl.classList.toggle("highlighted");
      }
      if (btn.dataset.a === "cp") navigator.clipboard.writeText(text);
      if (btn.dataset.a === "save") pushSavedItem({ type: "verse", title: key, content: text });
    }));
  } catch (e) {
    out.innerHTML = `<p>${e.message}</p>`;
  }
}

async function buildDaily() {
  const el = document.getElementById("daily");
  const topics = Object.keys(DAILY_TOPICS);
  const day = Math.floor(Date.now() / 86400000);
  const topic = topics[day % topics.length];
  const reference = DAILY_TOPICS[topic][day % DAILY_TOPICS[topic].length];
  const verse = await fetchPassage(reference).catch(() => null);
  el.innerHTML = `<div class="card"><h2>Daily Scripture</h2><p><strong>${topic}</strong> — ${reference}</p><p>${verse ? verse.text : "Unavailable."}</p><button id="saveDaily" class="btn">Save Daily Scripture</button></div>`;
  document.getElementById("saveDaily").addEventListener("click", () => pushSavedItem({ type: "daily", title: reference, content: verse?.text || "" }));
}

function buildGuide() {
  const el = document.getElementById("guide");
  el.innerHTML = `<div class="card"><h2>AI Scripture Guide</h2><div id="chatWindow" class="chat-window"></div><div class="row" style="margin-top:.7rem"><input id="chatInput" placeholder="Ask your question"/><button id="chatSend" class="btn">Send</button></div></div>`;
  const box = document.getElementById("chatWindow");
  const add = (who, text, savable = false) => {
    const row = document.createElement("div");
    row.className = "chat-bubble";
    row.innerHTML = `<div class="who">${who}</div><p class="text">${text}</p>${savable ? '<button class="btn secondary save-chat">Save Answer</button>' : ''}`;
    box.appendChild(row);
    if (savable) row.querySelector(".save-chat").addEventListener("click", () => pushSavedItem({ type: "ai_answer", title: "AI Response", content: text }));
    box.scrollTop = box.scrollHeight;
  };
  add("Guide", "Ask anything about scripture.");
  document.getElementById("chatSend").addEventListener("click", async () => {
    const input = document.getElementById("chatInput");
    const q = input.value.trim();
    if (!q) return;
    add("You", q);
    input.value = "";
    let answer = "";
    try {
      const data = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ prompt: q }) });
      answer = data.answer;
    } catch {
      answer = "Backend AI is unavailable. Start the API and try again.";
    }
    add("Guide", answer, true);
  });
}

function buildChurch() {
  const el = document.getElementById("church");
  el.innerHTML = `<div class="card"><h2>Church — GBT</h2><div class="row"><button id="syncGbt" class="btn">Full Import from @GBT</button><input id="videoSearch" placeholder="Search videos"/></div><div id="videoGrid" class="video-grid" style="margin-top:.8rem"></div></div><div class="card"><h3>Clip Render</h3><div class="grid"><input id="clipVideoId" placeholder="YouTube Video ID"/><input id="clipStart" placeholder="Start seconds"/><input id="clipEnd" placeholder="End seconds"/><input id="clipTitle" placeholder="Clip title"/></div><div class="row" style="margin-top:.7rem"><button id="renderClip" class="btn">Render Clip (MP4)</button></div><div id="clipStatus" class="muted"></div></div>`;

  const renderVideos = (q = "") => {
    const grid = document.getElementById("videoGrid");
    const scoped = state.churchVideos.filter((v) => `${v.title} ${v.description}`.toLowerCase().includes(q.toLowerCase()));
    grid.innerHTML = scoped.map((v) => `<article class="card"><h4>${v.title}</h4><iframe allowfullscreen src="https://www.youtube.com/embed/${v.youtube_id || v.id}"></iframe><div class="row"><button class="btn secondary" data-save="${v.youtube_id || v.id}">Save Video</button></div></article>`).join("") || `<p class="muted">No videos yet. Run import.</p>`;
    grid.querySelectorAll("button[data-save]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.save;
      pushSavedItem({ type: "video", title: `GBT ${id}`, content: `https://www.youtube.com/watch?v=${id}` });
    }));
  };

  document.getElementById("syncGbt").addEventListener("click", async () => {
    try {
      await api("/api/gbt/import", { method: "POST" });
      state.churchVideos = await api("/api/gbt/videos");
      storage.set("churchVideos", state.churchVideos);
      renderVideos(document.getElementById("videoSearch").value);
    } catch {
      renderVideos("");
    }
  });

  document.getElementById("videoSearch").addEventListener("input", (e) => renderVideos(e.target.value));

  document.getElementById("renderClip").addEventListener("click", async () => {
    const payload = {
      video_id: document.getElementById("clipVideoId").value.trim(),
      start_seconds: Number(document.getElementById("clipStart").value),
      end_seconds: Number(document.getElementById("clipEnd").value),
      title: document.getElementById("clipTitle").value.trim() || "Rendered clip",
    };
    try {
      const clip = await api("/api/clips/render", { method: "POST", body: JSON.stringify(payload) });
      document.getElementById("clipStatus").textContent = `Rendered: ${clip.file_path}`;
      pushSavedItem({ type: "clip", title: clip.title, content: clip.file_path });
    } catch {
      document.getElementById("clipStatus").textContent = "Clip render failed. Confirm backend + ffmpeg + yt-dlp.";
    }
  });

  renderVideos("");
}

function buildNotes() {
  const el = document.getElementById("notes");
  el.innerHTML = `<div class="card"><h2>Scripture Notepad</h2><div class="grid"><input id="noteBook" placeholder="Book"/><input id="noteTopic" placeholder="Topic"/><input id="noteTags" placeholder="Tags comma-separated"/></div><textarea id="noteBody" placeholder="Write note"></textarea><div class="row" style="margin-top:.7rem"><button id="saveNote" class="btn">Save Note</button><input id="searchNotes" placeholder="Search notes"/></div></div><div id="notesList" class="card"></div>`;

  const render = (q = "") => {
    const list = document.getElementById("notesList");
    const notes = state.notes.filter((n) => JSON.stringify(n).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = notes.map((n, i) => `<article class="card"><strong>${n.topic}</strong><p>${n.body}</p><div class="row"><button class="btn secondary" data-save-note="${i}">Save to History</button><button class="btn secondary" data-del="${i}">Delete</button></div></article>`).join("") || `<p class="muted">No notes.</p>`;
    list.querySelectorAll("button[data-del]").forEach((b) => b.addEventListener("click", () => {
      state.notes.splice(Number(b.dataset.del), 1);
      storage.set("notes", state.notes);
      render(q);
    }));
    list.querySelectorAll("button[data-save-note]").forEach((b) => b.addEventListener("click", () => {
      const n = notes[Number(b.dataset.saveNote)];
      pushSavedItem({ type: "note", title: n.topic, content: n.body });
    }));
  };

  document.getElementById("saveNote").addEventListener("click", async () => {
    const note = {
      book: document.getElementById("noteBook").value,
      topic: document.getElementById("noteTopic").value,
      tags: document.getElementById("noteTags").value.split(",").map((x) => x.trim()).filter(Boolean),
      body: document.getElementById("noteBody").value,
      date: new Date().toLocaleString(),
    };
    state.notes.unshift(note);
    storage.set("notes", state.notes);
    pushSavedItem({ type: "note", title: note.topic, content: note.body });
    api("/api/notes", { method: "POST", body: JSON.stringify(note) }).catch(() => {});
    render();
  });
  document.getElementById("searchNotes").addEventListener("input", (e) => render(e.target.value));
  render();
}

function buildPlans() {
  const plans = {
    "Beginner Bible Reading Plan": ["John 1", "Mark 1", "Psalm 1", "Genesis 1", "Romans 8", "Matthew 5", "Proverbs 1"],
    "30 Day Anxiety & Peace": Array.from({ length: 30 }, (_, i) => DAILY_TOPICS.anxiety[i % 3]),
  };
  const el = document.getElementById("plans");
  el.innerHTML = `<div class="card"><h2>Study Plans</h2>${Object.entries(plans).map(([name, arr]) => {
    const d = state.planProgress[name] || 0;
    return `<div class="card"><strong>${name}</strong><p>${d}/${arr.length}</p><div class="row"><button class="btn secondary" data-p="${name}">Mark Complete</button><button class="btn secondary" data-save-plan="${name}">Save Progress</button></div></div>`;
  }).join("")}</div>`;
  el.querySelectorAll("button[data-p]").forEach((b) => b.addEventListener("click", () => {
    const name = b.dataset.p;
    state.planProgress[name] = (state.planProgress[name] || 0) + 1;
    storage.set("planProgress", state.planProgress);
    buildPlans();
  }));
  el.querySelectorAll("button[data-save-plan]").forEach((b) => b.addEventListener("click", () => {
    const name = b.dataset.savePlan;
    pushSavedItem({ type: "plan", title: name, content: `${state.planProgress[name] || 0} completed` });
  }));
}

function buildPrayer() {
  const el = document.getElementById("prayer");
  el.innerHTML = `<div class="card"><h2>Prayer Journal</h2><textarea id="prayerText" placeholder="Type prayer"></textarea><div class="row" style="margin-top:.7rem"><button id="savePrayer" class="btn">Save Prayer</button></div></div><div id="prayerList" class="card"></div>`;
  const render = () => {
    const list = document.getElementById("prayerList");
    list.innerHTML = state.prayers.map((p, i) => `<article class="card"><p>${p.text}</p><p class="muted">${p.date}</p><div class="row"><button class="btn secondary" data-answer="${i}">${p.answered ? "Answered ✅" : "Mark Answered"}</button><button class="btn secondary" data-save-prayer="${i}">Save to History</button></div></article>`).join("") || `<p class="muted">No prayers yet.</p>`;
    list.querySelectorAll("button[data-answer]").forEach((b) => b.addEventListener("click", () => {
      state.prayers[Number(b.dataset.answer)].answered = true;
      storage.set("prayers", state.prayers);
      render();
    }));
    list.querySelectorAll("button[data-save-prayer]").forEach((b) => b.addEventListener("click", () => {
      const p = state.prayers[Number(b.dataset.savePrayer)];
      pushSavedItem({ type: "prayer", title: "Prayer Entry", content: p.text });
    }));
  };
  document.getElementById("savePrayer").addEventListener("click", () => {
    const text = document.getElementById("prayerText").value.trim();
    if (!text) return;
    const prayer = { text, date: new Date().toLocaleString(), answered: false };
    state.prayers.unshift(prayer);
    storage.set("prayers", state.prayers);
    pushSavedItem({ type: "prayer", title: "Prayer Entry", content: text });
    api("/api/prayers", { method: "POST", body: JSON.stringify({ text }) }).catch(() => {});
    render();
  });
  render();
}

function buildHistory() {
  const el = document.getElementById("history");
  el.innerHTML = `<div class="card"><h2>Dedicated Save History Sidebar</h2><p class="muted">Everything you saved from scriptures, AI answers, notes, plans, prayers, videos, and clips.</p><input id="historySearch" placeholder="Search saved history"/><div id="historyList" style="margin-top:.7rem"></div></div>`;
  const render = (q = "") => {
    document.getElementById("historyList").innerHTML = state.savedHistory
      .filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
      .map((x, i) => `<article class="card"><strong>${x.type.toUpperCase()} • ${x.title}</strong><p>${x.content || ""}</p><p class="muted">${x.created_at}</p><button class="btn secondary" data-copy="${i}">Copy</button></article>`)
      .join("") || `<p class="muted">No saved history yet.</p>`;
    document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", () => navigator.clipboard.writeText(state.savedHistory[Number(b.dataset.copy)].content || "")));
  };
  document.getElementById("historySearch").addEventListener("input", (e) => render(e.target.value));
  render();
}

function buildAdmin() {
  const el = document.getElementById("admin");
  el.innerHTML = `<div class="card"><h2>Admin Panel</h2><p class="muted">Control API base URL, trigger full GBT import, and edit admin password anytime.</p><div class="grid"><input id="apiBaseInput" value="${API_BASE}"/><input id="adminPassword" type="password" placeholder="Admin password"/></div><div class="row" style="margin-top:.7rem"><button id="adminLogin" class="btn">Login</button><button id="adminImport" class="btn secondary">Run Full GBT Import</button></div><hr/><h3>Change Password</h3><div class="grid"><input id="currentPassword" type="password" placeholder="Current password"/><input id="newPassword" type="password" placeholder="New password"/></div><div class="row" style="margin-top:.7rem"><button id="changePassword" class="btn">Update Password</button></div><hr/><h3>Feature Flags</h3><textarea id="featureJson" placeholder='{"new_feature": true}'></textarea><div class="row" style="margin-top:.7rem"><button id="saveFeatures" class="btn">Save Features</button></div><p id="adminStatus" class="muted"></p></div>`;

  const status = document.getElementById("adminStatus");
  document.getElementById("apiBaseInput").addEventListener("change", (e) => {
    localStorage.setItem("the_word_api_base", e.target.value.trim());
    status.textContent = "API base updated. Refresh page.";
  });

  document.getElementById("adminLogin").addEventListener("click", async () => {
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: document.getElementById("adminPassword").value }) });
      state.adminAuthed = true;
      storage.set("adminAuthed", true);
      status.textContent = "Admin authenticated.";
    } catch {
      status.textContent = "Admin login failed.";
    }
  });

  document.getElementById("adminImport").addEventListener("click", async () => {
    try {
      await api("/api/gbt/import", { method: "POST" });
      status.textContent = "Full GBT import completed.";
    } catch {
      status.textContent = "GBT import failed.";
    }
  });

  document.getElementById("changePassword").addEventListener("click", async () => {
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: document.getElementById("currentPassword").value,
          new_password: document.getElementById("newPassword").value,
        }),
      });
      status.textContent = "Password updated.";
    } catch {
      status.textContent = "Password update failed.";
    }
  });

  document.getElementById("saveFeatures").addEventListener("click", async () => {
    try {
      const payload = JSON.parse(document.getElementById("featureJson").value || "{}");
      await api("/api/admin/features", { method: "POST", body: JSON.stringify({ features: payload }) });
      status.textContent = "Feature configuration saved.";
    } catch {
      status.textContent = "Feature config save failed. JSON may be invalid.";
    }
  });
}

function initTheme() {
  const saved = storage.get("theme", "light");
  if (saved === "dark") document.body.classList.add("dark");
  const btn = document.getElementById("themeToggle");
  const sync = () => {
    const dark = document.body.classList.contains("dark");
    btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
    storage.set("theme", dark ? "dark" : "light");
  };
  sync();
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    sync();
  });
}

(async function init() {
  initTabs();
  initTheme();
  buildBible();
  await buildDaily();
  buildGuide();
  buildChurch();
  buildNotes();
  buildPlans();
  buildPrayer();
  buildHistory();
  buildAdmin();
})();
