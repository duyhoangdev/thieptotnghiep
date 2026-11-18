const TAKEOFF = new Date("2026-11-28T11:00:00+07:00");

const $ = (id) => document.getElementById(id);
const music = $("music");
const musicBtn = $("music-btn");

// Optional guest personalization via ?guest= or ?to=
const params = new URLSearchParams(location.search);
const guest = (params.get("guest") || params.get("to") || "").trim();
if (guest) {
  $("guest-name").textContent = guest.toUpperCase();
}

// Returns "" once the time has passed.
function formatLeft(ms) {
  if (ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d} ngày ${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

function tick() {
  const left = formatLeft(TAKEOFF - Date.now());
  $("cd-val").textContent = left || "🎓 Đã sẵn sàng đón mọi người tại góc sân banh!";
  if (!left) clearInterval(timer);
}
const timer = setInterval(tick, 1000);
tick();

function confetti() {
  const colors = ["#d7263d", "#e8b04a", "#f7f0e1", "#4aa3df"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    c.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

// Night sky stars
for (let i = 0; i < 70; i++) {
  const s = document.createElement("span");
  s.className = "star";
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 100 + "%";
  s.style.animationDelay = Math.random() * 3 + "s";
  s.style.opacity = 0.3 + Math.random() * 0.7;
  $("sky").appendChild(s);
}

// Split-flap departure board: each cell shuffles, then lands on its letter
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
document.querySelectorAll(".flap").forEach((row, r) => {
  [...row.dataset.text].forEach((ch, i) => {
    const cell = document.createElement("b");
    row.appendChild(cell);
    let n = 6 + r * 3 + i;
    const spin = setInterval(() => {
      cell.classList.remove("flip");
      void cell.offsetWidth; // restart flip animation
      cell.classList.add("flip");
      cell.textContent = --n > 0 ? FLAP_CHARS[(Math.random() * FLAP_CHARS.length) | 0] : ch;
      if (n <= 0) {
        clearInterval(spin);
        if (row.classList.contains("status") && i === row.dataset.text.length - 1) row.classList.add("done");
      }
    }, 70);
  });
});

let opened = false;
const tear = $("tear");

function playTakeoffSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Soft airline boarding chime (D5 -> A5)
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.48);
    });

    // 2. Jet takeoff whoosh (filtered noise sweep + subtle low engine rumble)
    const dur = 1.65;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(1.2, now);
    filter.frequency.setValueAtTime(160, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(1350, now + 0.72);
    filter.frequency.exponentialRampToValueAtTime(240, now + dur);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.24, now + 0.55);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(filter).connect(nGain).connect(ctx.destination);
    noise.start(now + 0.1);
    noise.stop(now + dur);

    const rumble = ctx.createOscillator();
    const rGain = ctx.createGain();
    rumble.type = "triangle";
    rumble.frequency.setValueAtTime(72, now + 0.1);
    rumble.frequency.exponentialRampToValueAtTime(118, now + 0.65);
    rumble.frequency.exponentialRampToValueAtTime(55, now + dur);
    rGain.gain.setValueAtTime(0.0001, now + 0.1);
    rGain.gain.linearRampToValueAtTime(0.11, now + 0.48);
    rGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    rumble.connect(rGain).connect(ctx.destination);
    rumble.start(now + 0.1);
    rumble.stop(now + dur);

    setTimeout(() => ctx.close().catch(() => {}), 2200);
  } catch {}
}

function launchBigPlane() {
  const wrap = document.createElement("div");
  wrap.className = "takeoff-plane";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
    <svg viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trailGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#e8b04a" stop-opacity="0"/>
          <stop offset="65%" stop-color="#f7f0e1" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <path d="M4 62 Q95 58 178 55 L178 63 Q95 66 4 68 Z" fill="url(#trailGrad)"/>
      <path d="M268 55 C268 50 250 47 228 47 L200 47 L170 12 L156 12 L173 47 L142 47 L128 32 L118 32 L126 52 L118 72 L128 72 L142 57 L173 57 L156 92 L170 92 L200 57 L228 57 C250 57 268 59 268 55 Z" fill="#f7f0e1" stroke="#e8b04a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M235 50 L254 53 L235 55 Z" fill="#0b1d3a"/>
    </svg>`;
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1500);
}

function openTicket() {
  if (opened) return;
  opened = true;
  tear.style.transform = ""; // let the CSS .torn animation take over from the drag
  $("stub").classList.add("torn");
  playTakeoffSound();
  launchBigPlane();
  music.play().catch(() => {}); // missing mp3 or blocked: page still works
  confetti();
  setTimeout(() => {
    $("intro").remove();
    $("ticket").hidden = false;
    musicBtn.hidden = false;
    scrollTo(0, 0);
  }, 1000);
}

// Drag the stub down to tear it; a tap/click also works on mobile and desktop
let startY = null, dragged = 0;
tear.addEventListener("pointerdown", (e) => {
  startY = e.clientY;
  dragged = 0;
  tear.setPointerCapture(e.pointerId);
});
tear.addEventListener("pointermove", (e) => {
  if (startY === null) return;
  dragged = Math.max(0, e.clientY - startY);
  tear.style.transform = `translateY(${dragged}px) rotate(${Math.min(dragged / 6, 18)}deg)`;
  if (dragged > 70) openTicket();
});
tear.addEventListener("pointerup", () => {
  startY = null;
  if (!opened) tear.style.transform = "";
});
tear.addEventListener("pointercancel", () => {
  startY = null;
  if (!opened) tear.style.transform = "";
});
tear.addEventListener("click", () => {
  if (dragged < 10) openTicket();
});

musicBtn.addEventListener("click", () => {
  if (music.paused) music.play().catch(() => {});
  else music.pause();
});
music.addEventListener("play", () => (musicBtn.textContent = "🔊"));
music.addEventListener("pause", () => (musicBtn.textContent = "🔇"));

// Map tabs (3D campus vs Google Maps) + gate/parking focus
const mapTabs = document.querySelectorAll(".map-tab");
const campusView = $("map-campus-view");
const googleView = $("map-google-view");
const mapFrame = $("map-3d-frame");
const legendItems = document.querySelectorAll("#map-legend p");

mapTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.mapMode;
    mapTabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    campusView.hidden = mode !== "campus";
    googleView.hidden = mode !== "google";
  });
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const focus = chip.dataset.focus;
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    mapFrame.dataset.focus = focus;
    if (legendItems.length >= 3) {
      legendItems[1].classList.toggle("is-dim", focus === "tht");
      legendItems[2].classList.toggle("is-dim", focus === "ltk");
    }
  });
});

// Toggle fullscreen zoom for 3D campus map (great on mobile)
const zoomBtn = $("map-zoom-btn");
if (zoomBtn && mapFrame) {
  const toggleModal = () => {
    const open = mapFrame.classList.toggle("is-modal");
    zoomBtn.textContent = open ? "✕ Đóng" : "🔍 Phóng to";
  };
  zoomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleModal();
  });
  mapFrame.addEventListener("click", () => {
    if (mapFrame.classList.contains("is-modal")) toggleModal();
  });
}
