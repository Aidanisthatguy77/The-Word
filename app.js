const TABS = [
  { id: "bible", label: "📖 Bible" },
  { id: "daily", label: "☀️ Daily Scripture" },
  { id: "guide", label: "🤖 AI Scripture Guide" },
  { id: "church", label: "⛪ Church / GBT" },
  { id: "notes", label: "📝 Notepad" },
  { id: "plans", label: "✅ Study Plans" },
  { id: "prayer", label: "🙏 Prayer Journal" },
  { id: "giving", label: "💸 Tithe & Offering" },
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
  notes: [],
  prayers: [],
  planProgress: storage.get("planProgress", {}),
  churchVideos: [],
  clipCollections: storage.get("clipCollections", []),
  savedHistory: [],
  adminAuthed: storage.get("adminAuthed", false),
  giving: [],
  givingTotals: {},
  givingGrandTotal: 0,
  paymentMethods: [],
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
  api("/api/saved", { method: "POST", body: JSON.stringify(record) })
    .then((saved) => {
      state.savedHistory.unshift(saved);
      state.savedHistory = state.savedHistory.slice(0, 500);
      buildHistory();
    })
    .catch(() => {});
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
    list.innerHTML = notes.map((n) => `<article class="card"><strong>${n.topic}</strong><p>${n.body}</p><div class="row"><button class="btn secondary" data-save-note="${n.id || ''}">Save to History</button><button class="btn secondary" data-del="${n.id || ''}">Delete</button></div></article>`).join("") || `<p class="muted">No notes.</p>`;
    list.querySelectorAll("button[data-del]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.del);
      api(`/api/notes/${id}`, { method: "DELETE" })
        .then(() => {
          state.notes = state.notes.filter((x) => x.id !== id);
          render(q);
        })
        .catch(() => {});
    }));
    list.querySelectorAll("button[data-save-note]").forEach((b) => b.addEventListener("click", () => {
      const n = notes.find((x) => Number(x.id) === Number(b.dataset.saveNote)) || notes[0];
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
    api("/api/notes", { method: "POST", body: JSON.stringify(note) })
      .then((saved) => {
        state.notes.unshift(saved);
        pushSavedItem({ type: "note", title: saved.topic, content: saved.body });
        render();
      })
      .catch(() => {});
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
    list.innerHTML = state.prayers.map((p) => `<article class="card"><p>${p.text}</p><p class="muted">${p.created_at || p.date}</p><div class="row"><button class="btn secondary" data-answer="${p.id || ''}">${p.answered ? "Answered ✅" : "Mark Answered"}</button><button class="btn secondary" data-save-prayer="${p.id || ''}">Save to History</button><button class="btn secondary" data-del-prayer="${p.id || ''}">Delete</button></div></article>`).join("") || `<p class="muted">No prayers yet.</p>`;
    list.querySelectorAll("button[data-answer]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.answer);
      api(`/api/prayers/${id}/answer`, { method: "POST" }).then((updated) => {
        state.prayers = state.prayers.map((x) => (x.id === updated.id ? updated : x));
        render();
      }).catch(() => {});
    }));
    list.querySelectorAll("button[data-save-prayer]").forEach((b) => b.addEventListener("click", () => {
      const p = state.prayers.find((x) => Number(x.id) === Number(b.dataset.savePrayer)) || state.prayers[0];
      pushSavedItem({ type: "prayer", title: "Prayer Entry", content: p.text });
    }));
    list.querySelectorAll("button[data-del-prayer]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.delPrayer);
      api(`/api/prayers/${id}`, { method: "DELETE" }).then(() => {
        state.prayers = state.prayers.filter((x) => x.id !== id);
        render();
      }).catch(() => {});
    }));
  };
  document.getElementById("savePrayer").addEventListener("click", () => {
    const text = document.getElementById("prayerText").value.trim();
    if (!text) return;
    const prayer = { text, date: new Date().toLocaleString(), answered: false };
    api("/api/prayers", { method: "POST", body: JSON.stringify({ text }) }).then((saved) => {
      state.prayers.unshift(saved);
      pushSavedItem({ type: "prayer", title: "Prayer Entry", content: saved.text });
      render();
    }).catch(() => {});
  });
  render();
}

function buildGiving() {
  const el = document.getElementById("giving");
  el.innerHTML = `<div class="card"><h2>Tithe & Offering Envelope</h2><p class="muted">Track giving from your shoe business <strong>Pure Sole</strong> into tithe or offering envelopes.</p><div class="grid"><select id="givingEnvelope"><option value="tithe">Tithe</option><option value="offering">Offering</option></select><input id="givingAmount" type="number" min="0.01" step="0.01" placeholder="Amount"/><input id="givingSource" value="Pure Sole"/><input id="givingNote" placeholder="Note (optional)"/></div><div class="row" style="margin-top:.7rem"><button id="saveGiving" class="btn">Add to Envelope</button></div></div><div class="card"><h3>Integrated Payment Methods</h3><p class="muted">Use configured methods like Cash App, PayPal, Venmo, Stripe checkout (cards/Apple Pay/Google Pay), or bank transfer.</p><div class="row"><select id="paymentMethodSelect"></select><button id="openPaymentMethod" class="btn secondary">Open Payment Method</button></div><p id="paymentMethodStatus" class="muted" style="margin-top:.7rem"></p></div><div class="card" id="givingSummary"></div><div class="card" id="givingList"></div>`;

  const render = () => {
    const summary = document.getElementById("givingSummary");
    const tithe = state.givingTotals.tithe || 0;
    const offering = state.givingTotals.offering || 0;
    summary.innerHTML = `<h3>Envelope Totals</h3><p><strong>Tithe:</strong> $${Number(tithe).toFixed(2)}</p><p><strong>Offering:</strong> $${Number(offering).toFixed(2)}</p><p><strong>Grand Total:</strong> $${Number(state.givingGrandTotal || 0).toFixed(2)}</p>`;

    const list = document.getElementById("givingList");
    list.innerHTML = state.giving.map((g) => `<article class="card"><strong>${g.envelope.toUpperCase()}</strong> — $${Number(g.amount).toFixed(2)}<p class="muted">Source: ${g.source} • ${g.created_at}</p><p>${g.note || ""}</p><div class="row"><button class="btn secondary" data-save-giving="${g.id}">Save to History</button><button class="btn secondary" data-del-giving="${g.id}">Delete</button></div></article>`).join("") || `<p class="muted">No giving entries yet.</p>`;
    list.querySelectorAll("button[data-save-giving]").forEach((b) => b.addEventListener("click", () => {
      const entry = state.giving.find((x) => x.id === Number(b.dataset.saveGiving));
      if (entry) pushSavedItem({ type: "giving", title: `${entry.envelope} envelope`, content: `${entry.source} - $${Number(entry.amount).toFixed(2)}` });
    }));
    list.querySelectorAll("button[data-del-giving]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.delGiving);
      api(`/api/giving/${id}`, { method: "DELETE" })
        .then(() => refreshGiving())
        .catch(() => {});
    }));
  };

  const refreshGiving = () => api("/api/giving")
    .then((data) => {
      state.giving = data.entries || [];
      state.givingTotals = data.totals || {};
      state.givingGrandTotal = data.grand_total || 0;
      render();
    })
    .catch(() => {});

  document.getElementById("saveGiving").addEventListener("click", () => {
    const payload = {
      envelope: document.getElementById("givingEnvelope").value,
      amount: Number(document.getElementById("givingAmount").value),
      source: document.getElementById("givingSource").value || "Pure Sole",
      note: document.getElementById("givingNote").value || "",
    };
    api("/api/giving", { method: "POST", body: JSON.stringify(payload) })
      .then((saved) => {
        pushSavedItem({ type: "giving", title: `${saved.envelope} envelope`, content: `${saved.source} - $${Number(saved.amount).toFixed(2)}` });
        return refreshGiving();
      })
      .catch(() => {});
  });

  const refreshPaymentMethods = () => api("/api/payments/methods")
    .then((data) => {
      state.paymentMethods = (data.methods || []).filter((m) => m.enabled);
      const sel = document.getElementById("paymentMethodSelect");
      sel.innerHTML = state.paymentMethods.length
        ? state.paymentMethods.map((m) => `<option value="${m.id}">${m.label}</option>`).join("")
        : `<option>No methods configured (set in Admin)</option>`;
    })
    .catch(() => {});

  document.getElementById("openPaymentMethod").addEventListener("click", () => {
    const method = document.getElementById("paymentMethodSelect").value;
    const amount = Number(document.getElementById("givingAmount").value || 0);
    const note = document.getElementById("givingNote").value || "The Word giving";
    const status = document.getElementById("paymentMethodStatus");
    api("/api/payments/create-checkout", { method: "POST", body: JSON.stringify({ method, amount, note }) })
      .then((out) => {
        if (out.url) {
          window.open(out.url, "_blank");
          status.textContent = `Opened ${method} payment link.`;
        } else if (out.instructions) {
          status.textContent = `Bank transfer instructions: ${out.instructions}`;
        } else {
          status.textContent = "Payment method response received.";
        }
      })
      .catch(() => { status.textContent = "Payment method launch failed. Configure it in Admin first."; });
  });

  render();
  refreshGiving();
  refreshPaymentMethods();
}

function buildHistory() {
  const el = document.getElementById("history");
  el.innerHTML = `<div class="card"><h2>Dedicated Save History Sidebar</h2><p class="muted">Everything you saved from scriptures, AI answers, notes, plans, prayers, videos, and clips.</p><input id="historySearch" placeholder="Search saved history"/><div id="historyList" style="margin-top:.7rem"></div></div>`;
  const render = (q = "") => {
    document.getElementById("historyList").innerHTML = state.savedHistory
      .filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
      .map((x, i) => `<article class="card"><strong>${x.type.toUpperCase()} • ${x.title}</strong><p>${x.content || ""}</p><p class="muted">${x.created_at}</p><button class="btn secondary" data-copy="${i}">Copy</button><button class="btn secondary" data-del="${x.id || ''}">Delete</button></article>`)
      .join("") || `<p class="muted">No saved history yet.</p>`;
    document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", () => navigator.clipboard.writeText(state.savedHistory[Number(b.dataset.copy)].content || "")));
    document.querySelectorAll("button[data-del]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.del);
      api(`/api/saved/${id}`, { method: "DELETE" }).then(() => {
        state.savedHistory = state.savedHistory.filter((x) => x.id !== id);
        render(q);
      }).catch(() => {});
    }));
  };
  document.getElementById("historySearch").addEventListener("input", (e) => render(e.target.value));
  render();
}

function buildAdmin() {
  const el = document.getElementById("admin");
  el.innerHTML = `<div class="card"><h2>Admin Panel</h2><p class="muted">Control API base URL, trigger full GBT import, edit password, and configure Pure Sole payout forwarding.</p><div class="grid"><input id="apiBaseInput" value="${API_BASE}"/><input id="adminPassword" type="password" placeholder="Admin password"/></div><div class="row" style="margin-top:.7rem"><button id="adminLogin" class="btn">Login</button><button id="adminImport" class="btn secondary">Run Full GBT Import</button></div><hr/><h3>Change Password</h3><div class="grid"><input id="currentPassword" type="password" placeholder="Current password"/><input id="newPassword" type="password" placeholder="New password"/></div><div class="row" style="margin-top:.7rem"><button id="changePassword" class="btn">Update Password</button></div><hr/><h3>Pure Sole Integration</h3><p class="muted">Webhook endpoint: <code>${API_BASE}/api/integrations/pure-sole/payout</code></p><div class="grid"><input id="pureSoleSecret" placeholder="Webhook secret"/><input id="pureSoleTithePct" type="number" step="0.1" placeholder="Tithe %"/><input id="pureSoleOfferingPct" type="number" step="0.1" placeholder="Offering %"/></div><div class="row" style="margin-top:.7rem"><button id="savePureSoleConfig" class="btn">Save Pure Sole Config</button></div><hr/><h3>Feature Flags</h3><textarea id="featureJson" placeholder='{"new_feature": true}'></textarea><div class="row" style="margin-top:.7rem"><button id="saveFeatures" class="btn">Save Features</button></div><p id="adminStatus" class="muted"></p></div>`;

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

  api("/api/admin/pure-sole-config").then((cfg) => {
    document.getElementById("pureSoleTithePct").value = cfg.tithe_percent ?? 10;
    document.getElementById("pureSoleOfferingPct").value = cfg.offering_percent ?? 5;
  }).catch(() => {});

  document.getElementById("savePureSoleConfig").addEventListener("click", async () => {
    try {
      await api("/api/admin/pure-sole-config", {
        method: "POST",
        body: JSON.stringify({
          webhook_secret: document.getElementById("pureSoleSecret").value,
          tithe_percent: Number(document.getElementById("pureSoleTithePct").value || 10),
          offering_percent: Number(document.getElementById("pureSoleOfferingPct").value || 5),
        }),
      });
      status.textContent = "Pure Sole integration config saved.";
    } catch {
      status.textContent = "Pure Sole config save failed.";
    }
  });

  api("/api/admin/payment-config").then((res) => {
    const cfg = res.config || {};
    const defaults = {
      cashapp_cashtag: cfg.cashapp_cashtag || "",
      paypal_handle: cfg.paypal_handle || "",
      venmo_handle: cfg.venmo_handle || "",
      bank_transfer_instructions: cfg.bank_transfer_instructions || "",
      stripe_publishable_key: cfg.stripe_publishable_key || "",
      stripe_secret_key: cfg.stripe_secret_key || "",
      stripe_success_url: cfg.stripe_success_url || "",
      stripe_cancel_url: cfg.stripe_cancel_url || "",
    };
    const payBox = document.createElement("div");
    payBox.className = "card";
    payBox.innerHTML = `<h3>Payment Methods Config</h3><div class="grid"><input id="cashappCashtag" placeholder="Cash App Cashtag" value="${defaults.cashapp_cashtag}"/><input id="paypalHandle" placeholder="PayPal handle" value="${defaults.paypal_handle}"/><input id="venmoHandle" placeholder="Venmo handle" value="${defaults.venmo_handle}"/><input id="stripePublishableKey" placeholder="Stripe publishable key" value="${defaults.stripe_publishable_key}"/><input id="stripeSecretKey" placeholder="Stripe secret key" value="${defaults.stripe_secret_key}"/><input id="stripeSuccessUrl" placeholder="Stripe success URL" value="${defaults.stripe_success_url}"/><input id="stripeCancelUrl" placeholder="Stripe cancel URL" value="${defaults.stripe_cancel_url}"/><input id="bankTransferInstructions" placeholder="Bank transfer instructions" value="${defaults.bank_transfer_instructions}"/></div><div class="row" style="margin-top:.7rem"><button id="savePaymentConfig" class="btn">Save Payment Methods</button></div>`;
    el.appendChild(payBox);
    document.getElementById("savePaymentConfig").addEventListener("click", () => {
      const payload = {
        cashapp_cashtag: document.getElementById("cashappCashtag").value.trim(),
        paypal_handle: document.getElementById("paypalHandle").value.trim(),
        venmo_handle: document.getElementById("venmoHandle").value.trim(),
        bank_transfer_instructions: document.getElementById("bankTransferInstructions").value.trim(),
        stripe_publishable_key: document.getElementById("stripePublishableKey").value.trim(),
        stripe_secret_key: document.getElementById("stripeSecretKey").value.trim(),
        stripe_success_url: document.getElementById("stripeSuccessUrl").value.trim(),
        stripe_cancel_url: document.getElementById("stripeCancelUrl").value.trim(),
      };
      api("/api/admin/payment-config", { method: "POST", body: JSON.stringify(payload) })
        .then(() => { status.textContent = "Payment methods config saved."; })
        .catch(() => { status.textContent = "Payment methods config save failed."; });
    });
  }).catch(() => {});

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
  try {
    state.notes = await api("/api/notes");
    state.prayers = await api("/api/prayers");
    state.savedHistory = await api("/api/saved");
    state.churchVideos = await api("/api/gbt/videos");
    const giving = await api("/api/giving");
    state.giving = giving.entries || [];
    state.givingTotals = giving.totals || {};
    state.givingGrandTotal = giving.grand_total || 0;
  } catch (_) {}
  initTabs();
  initTheme();
  buildBible();
  await buildDaily();
  buildGuide();
  buildChurch();
  buildNotes();
  buildPlans();
  buildPrayer();
  buildGiving();
  buildHistory();
  buildAdmin();
})();
