const TABS = [
  { id: "bible", label: "📖 Bible" },
  { id: "daily", label: "☀️ Daily Scripture" },
  { id: "guide", label: "🤖 AI Scripture Guide" },
  { id: "church", label: "⛪ Church / GBT" },
  { id: "notes", label: "📝 Notepad" },
  { id: "plans", label: "✅ Study Plans" },
  { id: "prayer", label: "🙏 Prayer Journal" },
];

const GBT_CHANNEL = {
  handleUrl: "https://www.youtube.com/@GBT",
  channelId: "UC--bI1HNYAcOFnlDwCfB4Bg",
  title: "Greater Bethel Temple Louisville - GBTKY",
};

const BOOKS = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34],
  ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25],
  ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13], ["Esther", 10], ["Job", 42],
  ["Psalms", 150], ["Proverbs", 31], ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52],
  ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9], ["Obadiah", 1],
  ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4],
  ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16], ["1 Corinthians", 16],
  ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4], ["1 Thessalonians", 5],
  ["2 Thessalonians", 3], ["1 Timothy", 6], ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5],
  ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

const DAILY_TOPICS = {
  anxiety: ["Philippians 4:6-7", "1 Peter 5:7", "Isaiah 41:10"],
  faith: ["Hebrews 11:1", "2 Corinthians 5:7", "Romans 10:17"],
  purpose: ["Jeremiah 29:11", "Ephesians 2:10", "Romans 8:28"],
  strength: ["Isaiah 40:31", "Philippians 4:13", "Psalm 46:1"],
  forgiveness: ["Colossians 3:13", "Ephesians 4:32", "1 John 1:9"],
  leadership: ["Proverbs 11:14", "Mark 10:45", "1 Timothy 4:12"],
  perseverance: ["James 1:2-4", "Galatians 6:9", "Romans 5:3-5"],
  family: ["Joshua 24:15", "Proverbs 22:6", "Ephesians 6:1-4"],
  "financial wisdom": ["Proverbs 3:9-10", "Luke 14:28", "Proverbs 21:5"],
  identity: ["2 Corinthians 5:17", "1 Peter 2:9", "Psalm 139:14"],
  hope: ["Romans 15:13", "Lamentations 3:22-23", "Hebrews 6:19"],
};

const GUIDE_HINTS = {
  "romans 8:28": "Romans 8:28 teaches that God can work through every circumstance for ultimate good for those who love Him. It does not say every event is good, but that God redeems painful moments into purpose.",
  job: "Job shows faithful endurance through unexplained suffering. The book answers less with reasons and more with revelation: God remains wise, present, and worthy even when life hurts.",
  anxiety: "Scripture repeatedly invites us to move anxiety into prayer, trust, and practical obedience. See Philippians 4:6-8 and 1 Peter 5:7.",
  temptation: "Temptation is real, but Scripture points to practical resistance: watchfulness, Scripture memory, fleeing patterns that weaken you, and depending on God's strength.",
  "armor of god": "Ephesians 6:10-18 uses battle imagery: truth, righteousness, gospel peace, faith, salvation, and Scripture equip believers for spiritual pressure.",
  "david and goliath": "David and Goliath (1 Samuel 17) highlights courage shaped by prior faithfulness and trust in God rather than outward strength.",
};

const VIDEO_TOPICS = {
  anxiety: ["anxiety", "worry", "fear", "peace"],
  temptation: ["temptation", "sin", "holiness", "purity"],
  faith: ["faith", "trust", "believe"],
  purpose: ["purpose", "calling", "destiny"],
  strength: ["strength", "power", "endure"],
  forgiveness: ["forgive", "forgiveness", "grace"],
  leadership: ["leader", "leadership", "bishop", "pastor"],
  perseverance: ["persever", "endure", "consistency"],
  family: ["family", "marriage", "children", "home"],
  finances: ["money", "finance", "stewardship", "prosper"],
  identity: ["identity", "who you are", "chosen"],
  hope: ["hope", "future", "promise"],
  prayer: ["prayer", "fasting", "intercession"],
  salvation: ["salvation", "gospel", "jesus", "cross"],
};

const STUDY_PLANS = {
  "Beginner Bible Reading Plan": ["John 1", "Mark 1", "Psalm 1", "Genesis 1", "Romans 8", "Matthew 5", "Proverbs 1"],
  "30 Day Anxiety & Peace": Array.from({ length: 30 }, (_, i) => DAILY_TOPICS.anxiety[i % 3]),
  "30 Day Purpose & Identity": Array.from({ length: 30 }, (_, i) => ["purpose", "identity"][i % 2] === "purpose" ? DAILY_TOPICS.purpose[i % 3] : DAILY_TOPICS.identity[i % 3]),
  "30 Day Strength & Perseverance": Array.from({ length: 30 }, (_, i) => ["strength", "perseverance"][i % 2] === "strength" ? DAILY_TOPICS.strength[i % 3] : DAILY_TOPICS.perseverance[i % 3]),
};

const storage = {
  get: (k, fallback) => JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const state = {
  passage: null,
  highlighted: storage.get("highlighted", {}),
  notes: storage.get("notes", []),
  prayers: storage.get("prayers", []),
  planProgress: storage.get("planProgress", {}),
  churchVideos: storage.get("churchVideos", []),
  clipCollections: storage.get("clipCollections", []),
};

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
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load scripture right now.");
  return res.json();
}

function buildBible() {
  const el = document.getElementById("bible");
  el.innerHTML = `
  <div class="card">
    <h2>Complete KJV Bible</h2>
    <p class="muted">Search by reference (John 3:16), chapter (Romans 8), or topic (hope).</p>
    <div class="grid">
      <div><label>Book</label><select id="bookSelect"></select></div>
      <div><label>Chapter</label><select id="chapterSelect"></select></div>
      <div><label>Quick Search</label><input id="quickSearch" placeholder="ex: Romans 8:28 or anxiety" /></div>
    </div>
    <div class="row" style="margin-top:0.75rem">
      <button id="loadChapter" class="btn">Load Chapter</button>
      <button id="searchVerse" class="btn secondary">Search</button>
    </div>
  </div>
  <div id="bibleOutput" class="card"><p class="muted">Choose a chapter or search to begin.</p></div>`;

  const bookSel = document.getElementById("bookSelect");
  const chSel = document.getElementById("chapterSelect");
  bookSel.innerHTML = BOOKS.map(([b]) => `<option>${b}</option>`).join("");

  const refreshChapters = () => {
    const selected = BOOKS.find(([b]) => b === bookSel.value);
    chSel.innerHTML = Array.from({ length: selected[1] }, (_, i) => `<option>${i + 1}</option>`).join("");
  };
  refreshChapters();
  bookSel.addEventListener("change", refreshChapters);

  document.getElementById("loadChapter").addEventListener("click", async () => {
    await renderPassage(`${bookSel.value} ${chSel.value}`);
  });

  document.getElementById("searchVerse").addEventListener("click", async () => {
    const q = document.getElementById("quickSearch").value.trim();
    if (!q) return;
    const topic = Object.keys(DAILY_TOPICS).find((t) => t === q.toLowerCase());
    if (topic) {
      await renderPassage(DAILY_TOPICS[topic][0]);
      return;
    }
    await renderPassage(q);
  });
}

async function renderPassage(ref) {
  const out = document.getElementById("bibleOutput");
  out.innerHTML = `<p class="muted">Loading ${ref} ...</p>`;
  try {
    const data = await fetchPassage(ref);
    state.passage = data;
    const keyPrefix = `${data.reference}::`;
    out.innerHTML = `
      <h3>${data.reference}</h3>
      <p class="muted">Translation: KJV</p>
      ${data.verses
        .map((v) => {
          const key = `${keyPrefix}${v.verse}`;
          return `<div class="verse ${state.highlighted[key] ? "highlighted" : ""}" data-key="${key}"><strong>${v.verse}</strong> ${v.text.trim()}<div class="row" style="margin-top:0.4rem"><button class="btn secondary small" data-action="highlight">Highlight</button><button class="btn secondary small" data-action="copy">Copy</button></div></div>`;
        })
        .join("")}
    `;

    out.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const verse = e.target.closest(".verse");
        const key = verse.dataset.key;
        if (btn.dataset.action === "highlight") {
          state.highlighted[key] = !state.highlighted[key];
          storage.set("highlighted", state.highlighted);
          verse.classList.toggle("highlighted");
        }
        if (btn.dataset.action === "copy") {
          navigator.clipboard.writeText(verse.innerText.replace("HighlightCopy", "").trim());
        }
      });
    });
  } catch (err) {
    out.innerHTML = `<p>${err.message}</p>`;
  }
}

async function buildDaily() {
  const el = document.getElementById("daily");
  const topics = Object.keys(DAILY_TOPICS);
  const dayIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  const topic = topics[dayIndex % topics.length];
  const reference = DAILY_TOPICS[topic][dayIndex % DAILY_TOPICS[topic].length];
  const scripture = await fetchPassage(reference).catch(() => null);

  const explanation = `Today's focus is ${topic}. This passage matters because it grounds your heart in God's character during real life pressure. Apply it by praying this verse, writing one action step, and practicing it before the day ends.`;

  el.innerHTML = `
    <div class="card">
      <h2>Daily Scripture</h2>
      <p class="muted">Topic: <strong>${topic}</strong></p>
      <h3>${reference}</h3>
      <p>${scripture ? scripture.text : "Scripture unavailable currently. Please try again."}</p>
      <h4>Plain Explanation</h4>
      <p>${explanation}</p>
      <h4>Why this matters today</h4>
      <p>It gives spiritual direction for today's emotions, decisions, and relationships.</p>
      <h4>How to apply it</h4>
      <ul>
        <li>Pray the verse in your own words.</li>
        <li>Take one practical action aligned with it.</li>
        <li>Reflect tonight on what changed.</li>
      </ul>
    </div>
  `;
}

function getRelevantGbtVideos(query) {
  const q = query.toLowerCase();
  return state.churchVideos.filter((v) => `${v.title} ${v.description}`.toLowerCase().includes(q)).slice(0, 3);
}

function buildGuide() {
  const el = document.getElementById("guide");
  el.innerHTML = `
    <div class="card">
      <h2>AI Scripture Guide (Free Local Mode)</h2>
      <p class="muted">No paid API required. This guide uses built-in Bible study logic + live verse lookup + GBT video recommendations.</p>
      <div class="chat-window" id="chatWindow"></div>
      <div class="row" style="margin-top:0.7rem">
        <input id="chatInput" placeholder='Ask: "What does Romans 8:28 mean?"' />
        <button id="chatSend" class="btn">Send</button>
      </div>
    </div>
  `;

  const chatWindow = document.getElementById("chatWindow");
  const template = document.getElementById("chatBubbleTemplate");

  const pushMessage = (who, text) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".who").textContent = who;
    node.querySelector(".text").textContent = text;
    chatWindow.appendChild(node);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  pushMessage("Guide", "Ask about scripture, context, or life application. I can also suggest matching GBT videos.");

  async function answer() {
    const input = document.getElementById("chatInput");
    const q = input.value.trim();
    if (!q) return;
    pushMessage("You", q);
    input.value = "";

    const lower = q.toLowerCase();
    const match = Object.entries(GUIDE_HINTS).find(([k]) => lower.includes(k));

    const verseRefMatch = q.match(/([1-3]?\s?[A-Za-z]+\s\d+:\d+(?:-\d+)?)/);
    let verseText = "";
    if (verseRefMatch) {
      const verse = await fetchPassage(verseRefMatch[1]).catch(() => null);
      if (verse) verseText = `\n\n${verse.reference}: ${verse.text.trim()}`;
    }

    const matches = getRelevantGbtVideos(q);
    const gbtLinks = matches.length
      ? `\n\nGBT videos for this topic:\n${matches.map((v) => `• ${v.title} — ${v.url}`).join("\n")}`
      : "";

    const response = match
      ? `${match[1]}\n\nOT ↔ NT Connection: Scripture is one story pointing to God's rescue through Christ.${verseText}${gbtLinks}`
      : `Great question. Here's a clear study path:\n1) Read the passage in context (before/after).\n2) Observe repeated words/themes.\n3) Compare with related passages.\n4) Apply one concrete step today.${verseText}${gbtLinks}`;

    pushMessage("Guide", response);
  }

  document.getElementById("chatSend").addEventListener("click", answer);
}

function classifyVideo(video) {
  const text = `${video.title} ${video.description}`.toLowerCase();
  const matched = Object.entries(VIDEO_TOPICS)
    .filter(([, words]) => words.some((w) => text.includes(w)))
    .map(([topic]) => topic);
  return matched.length ? matched : ["general"];
}

async function fetchGbtVideos() {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${GBT_CHANNEL.channelId}`;
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Could not load GBT feed.");
  const payload = await res.json();
  if (!payload.items) throw new Error("GBT feed missing items.");

  return payload.items.map((item) => {
    const id = item.guid?.split(":").pop() || item.link?.split("v=").pop() || "";
    const description = item.description?.replace(/<[^>]+>/g, " ").trim() || "";
    return {
      id,
      title: item.title,
      description,
      date: item.pubDate,
      url: item.link,
      thumbnail: item.thumbnail,
      topics: [],
    };
  });
}

function renderVideoTabs(videos, selectedTopic = "all") {
  const tabs = document.getElementById("videoTopicTabs");
  const grid = document.getElementById("videoGrid");
  const topicSet = new Set(["all", "general"]);
  videos.forEach((v) => v.topics.forEach((t) => topicSet.add(t)));
  const topicList = [...topicSet];

  tabs.innerHTML = topicList
    .map((t) => `<button class="tab ${t === selectedTopic ? "active" : ""}" data-topic="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`)
    .join("");

  const scoped = selectedTopic === "all" ? videos : videos.filter((v) => v.topics.includes(selectedTopic));
  grid.innerHTML = scoped
    .map((v) => `
      <article class="video-card card">
        <h4>${v.title}</h4>
        <p class="muted">${new Date(v.date).toLocaleDateString()} • Topics: ${v.topics.join(", ")}</p>
        <iframe allowfullscreen src="https://www.youtube.com/embed/${v.id}" title="${v.title}"></iframe>
        <p>${v.description.slice(0, 220)}...</p>
        <p><a href="${v.url}" target="_blank" rel="noreferrer">Open on YouTube</a></p>
      </article>
    `)
    .join("");

  tabs.querySelectorAll("button[data-topic]").forEach((btn) => {
    btn.addEventListener("click", () => renderVideoTabs(videos, btn.dataset.topic));
  });
}

function createClipSuggestions(topic, videos) {
  const targetVideos = videos.filter((v) => `${v.title} ${v.description}`.toLowerCase().includes(topic.toLowerCase())).slice(0, 5);
  return targetVideos.map((v, index) => {
    const startMin = (index * 4) % 20;
    const endMin = startMin + 3;
    const startSec = startMin * 60;
    return {
      topic,
      videoId: v.id,
      title: `${v.title} — ${topic} clip`,
      clipLabel: `${String(startMin).padStart(2, "0")}:00 - ${String(endMin).padStart(2, "0")}:00`,
      clipUrl: `https://www.youtube.com/watch?v=${v.id}&t=${startSec}s`,
      fullUrl: v.url,
      sourceTitle: v.title,
      createdAt: new Date().toLocaleString(),
    };
  });
}

function buildChurch() {
  const el = document.getElementById("church");
  el.innerHTML = `
    <div class="card">
      <h2>Church Classes — GBT</h2>
      <p class="muted">Source: <a href="${GBT_CHANNEL.handleUrl}" target="_blank" rel="noreferrer">${GBT_CHANNEL.handleUrl}</a></p>
      <div class="row">
        <button id="loadGbtFeed" class="btn">Sync Latest from @GBT</button>
        <input id="videoSearch" placeholder="Search in GBT videos (title + description)" />
      </div>
      <p id="churchStatus" class="muted" style="margin-top:0.7rem"></p>
      <div id="videoTopicTabs" class="tabs" style="padding:0.5rem 0"></div>
      <div id="videoGrid" class="video-grid" style="margin-top:0.8rem"></div>
    </div>

    <div class="card">
      <h3>Clip Studio (On-demand)</h3>
      <p class="muted">Enter a topic in plain English (example: anxiety, temptation, purpose). The system creates suggested clip moments and links to full GBT videos.</p>
      <div class="row">
        <input id="clipTopicInput" placeholder="Topic for clips (ex: not giving into temptation)" />
        <button id="generateClips" class="btn">Create Topic Clips</button>
      </div>
      <div id="clipOutput" style="margin-top:0.8rem"></div>
    </div>
  `;

  const status = document.getElementById("churchStatus");
  const search = document.getElementById("videoSearch");

  const renderWithSearch = () => {
    const q = search.value.trim().toLowerCase();
    const scoped = !q ? state.churchVideos : state.churchVideos.filter((v) => `${v.title} ${v.description}`.toLowerCase().includes(q));
    renderVideoTabs(scoped, "all");
  };

  const renderClips = () => {
    const output = document.getElementById("clipOutput");
    output.innerHTML = state.clipCollections.length
      ? state.clipCollections
          .map((c) => `
          <article class="card">
            <h4>${c.title}</h4>
            <p class="muted">Topic: ${c.topic} • Clip Window: ${c.clipLabel} • Created: ${c.createdAt}</p>
            <p>Source video: ${c.sourceTitle}</p>
            <p><a href="${c.clipUrl}" target="_blank" rel="noreferrer">Open Suggested Clip</a> | <a href="${c.fullUrl}" target="_blank" rel="noreferrer">Open Full Video</a></p>
          </article>
        `)
          .join("")
      : `<p class="muted">No clips generated yet.</p>`;
  };

  const hydrateTopics = (videos) => videos.map((v) => ({ ...v, topics: classifyVideo(v) }));

  if (state.churchVideos.length) {
    renderWithSearch();
    status.textContent = `Loaded ${state.churchVideos.length} cached @GBT videos.`;
  } else {
    status.textContent = "No local cache yet. Click Sync Latest from @GBT.";
  }
  renderClips();

  document.getElementById("loadGbtFeed").addEventListener("click", async () => {
    status.textContent = "Syncing @GBT feed...";
    try {
      const videos = hydrateTopics(await fetchGbtVideos());
      videos.sort((a, b) => new Date(b.date) - new Date(a.date));
      state.churchVideos = videos;
      storage.set("churchVideos", videos);
      status.textContent = `Synced ${videos.length} videos from @GBT (${GBT_CHANNEL.channelId}).`;
      renderWithSearch();
    } catch (err) {
      status.textContent = `Unable to sync feed live. Showing cached videos if available. (${err.message})`;
      renderWithSearch();
    }
  });

  search.addEventListener("input", renderWithSearch);

  document.getElementById("generateClips").addEventListener("click", () => {
    const topic = document.getElementById("clipTopicInput").value.trim();
    if (!topic) return;
    const suggestions = createClipSuggestions(topic, state.churchVideos);
    state.clipCollections = [...suggestions, ...state.clipCollections].slice(0, 60);
    storage.set("clipCollections", state.clipCollections);
    renderClips();
  });
}

function buildNotes() {
  const el = document.getElementById("notes");
  el.innerHTML = `
    <div class="card">
      <h2>Scripture Notepad</h2>
      <div class="grid">
        <input id="noteBook" placeholder="Book (optional)" />
        <input id="noteTopic" placeholder="Topic" />
        <input id="noteTags" placeholder="Tags (comma separated)" />
      </div>
      <textarea id="noteBody" placeholder="Write your note..."></textarea>
      <div class="row" style="margin-top:0.6rem">
        <button id="saveNote" class="btn">Save Note</button>
        <input id="searchNotes" placeholder="Search notes..." />
      </div>
    </div>
    <div id="notesList" class="card"></div>
  `;

  const renderNotes = (query = "") => {
    const list = document.getElementById("notesList");
    const filtered = state.notes.filter((n) => JSON.stringify(n).toLowerCase().includes(query.toLowerCase()));
    list.innerHTML = filtered.length
      ? filtered
          .map(
            (n, i) => `<div class="card"><strong>${n.topic || "Untitled"}</strong> <span class="muted">(${n.date})</span><p>${n.body}</p><p class="muted">${n.book || "No book"} • ${n.tags.join(", ")}</p><button class="btn secondary" data-del="${i}">Delete</button></div>`
          )
          .join("")
      : `<p class="muted">No notes yet.</p>`;
    list.querySelectorAll("button[data-del]").forEach((b) => {
      b.addEventListener("click", () => {
        state.notes.splice(Number(b.dataset.del), 1);
        storage.set("notes", state.notes);
        renderNotes(query);
      });
    });
  };

  document.getElementById("saveNote").addEventListener("click", () => {
    const note = {
      date: new Date().toLocaleString(),
      book: document.getElementById("noteBook").value,
      topic: document.getElementById("noteTopic").value,
      tags: document.getElementById("noteTags").value.split(",").map((s) => s.trim()).filter(Boolean),
      body: document.getElementById("noteBody").value,
    };
    state.notes.unshift(note);
    storage.set("notes", state.notes);
    document.getElementById("noteBody").value = "";
    renderNotes();
  });

  document.getElementById("searchNotes").addEventListener("input", (e) => renderNotes(e.target.value));
  renderNotes();
}

function buildPlans() {
  const el = document.getElementById("plans");
  const rows = Object.entries(STUDY_PLANS)
    .map(([name, entries]) => {
      const done = state.planProgress[name] || 0;
      const pct = Math.round((done / entries.length) * 100);
      return `<tr><td>${name}</td><td>${done}/${entries.length}</td><td>${pct}%</td><td><button class="btn secondary" data-plan="${name}">Mark Day Complete</button></td></tr>`;
    })
    .join("");

  const streak = computeStreak();
  el.innerHTML = `
    <div class="card">
      <h2>Study Plans</h2>
      <p class="streak">🔥 Streak: ${streak} day(s)</p>
      <table class="table"><thead><tr><th>Plan</th><th>Progress</th><th>Completion</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
  `;

  el.querySelectorAll("button[data-plan]").forEach((b) => {
    b.addEventListener("click", () => {
      const name = b.dataset.plan;
      const max = STUDY_PLANS[name].length;
      state.planProgress[name] = Math.min((state.planProgress[name] || 0) + 1, max);
      storage.set("planProgress", state.planProgress);
      const history = storage.get("studyHistory", []);
      history.push(new Date().toISOString().slice(0, 10));
      storage.set("studyHistory", history);
      buildPlans();
    });
  });
}

function computeStreak() {
  const dates = [...new Set(storage.get("studyHistory", []))].sort();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (dates.includes(iso)) streak++;
    else break;
  }
  return streak;
}

function buildPrayer() {
  const el = document.getElementById("prayer");
  el.innerHTML = `
    <div class="card">
      <h2>Prayer Journal</h2>
      <textarea id="prayerText" placeholder="Log your prayer..."></textarea>
      <div class="row" style="margin-top:0.6rem">
        <button id="savePrayer" class="btn">Save Prayer</button>
      </div>
    </div>
    <div class="card" id="prayerList"></div>
  `;

  const render = () => {
    const list = document.getElementById("prayerList");
    list.innerHTML = state.prayers.length
      ? state.prayers
          .map(
            (p, i) => `<div class="card"><p>${p.text}</p><p class="muted">${p.date}</p><button class="btn secondary" data-answer="${i}">${p.answered ? "Answered ✅" : "Mark Answered"}</button></div>`
          )
          .join("")
      : `<p class="muted">No prayers logged yet.</p>`;

    list.querySelectorAll("button[data-answer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.prayers[Number(btn.dataset.answer)].answered = true;
        storage.set("prayers", state.prayers);
        render();
      });
    });
  };

  document.getElementById("savePrayer").addEventListener("click", () => {
    const text = document.getElementById("prayerText").value.trim();
    if (!text) return;
    state.prayers.unshift({ text, date: new Date().toLocaleString(), answered: false });
    storage.set("prayers", state.prayers);
    document.getElementById("prayerText").value = "";
    render();
  });

  render();
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
})();
