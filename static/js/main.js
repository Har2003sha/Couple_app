// =========================
// Couple App Main JS
// =========================

let currentPhotos = [];
let currentPhotoIndex = 0;
let playing = false;
let photoToDeleteId = null;

const playlist = [
  { title: "Tum Hi Ho", artist: "Arijit Singh", scUrl: "https://soundcloud.com/arijitsingh/tum-hi-ho" },
  { title: "Raabta", artist: "Arijit Singh", scUrl: null },
  { title: "Perfect", artist: "Ed Sheeran", scUrl: null },
  { title: "Until I Found You", artist: "Stephen Sanchez", scUrl: null }
];

const reasons = [
  "Your smile brightens my day ❤️",
  "You understand me better than anyone 🥰",
  "You support my dreams 🌟",
  "You make me laugh 😄",
  "You are my safe place 🤗",
  "You make ordinary days special ✨",
  "Your kindness inspires me 💕",
  "Life is better with you 💑"
];

// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadTimeline();
  loadPhotos();
  loadMemories();
  renderReasons();
  renderPlaylist();
  createFloatingHearts();
  updateCounter();
  setInterval(updateCounter, 1000);
  setupEvents();
});

// =========================
// NAVIGATION
// =========================

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.section === id) btn.classList.add("active");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });
  document.getElementById("name1")?.addEventListener("input", saveProfile);
  document.getElementById("name2")?.addEventListener("input", saveProfile);
  document.getElementById("startDate")?.addEventListener("change", saveProfile);
  document.getElementById("profileUpload")?.addEventListener("change", uploadProfilePhoto);
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadPhotos(btn.dataset.tag);
    });
  });
  document.getElementById("modeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
  });
}

// =========================
// PROFILE
// =========================

async function loadProfile() {
  try {
    const res = await fetch("/api/profile");
    const data = await res.json();
    name1.value = data.name1;
    name2.value = data.name2;
    startDate.value = data.together_since;
    namesDisplay.textContent = `${data.name1} ❤️ ${data.name2}`;
    if (data.profile_photo) {
      couplePhotoImg.src = data.profile_photo;
      couplePhotoImg.style.display = "block";
      coupleEmoji.style.display = "none";
    }
    if (data.love_letter) {
      letterBody.textContent = data.love_letter;
      letterEdit.value = data.love_letter;
    }
  } catch (e) { console.error(e); }
}

async function saveProfile() {
  namesDisplay.textContent = `${name1.value} ❤️ ${name2.value}`;
  await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name1: name1.value,
      name2: name2.value,
      together_since: startDate.value
    })
  });
}

function uploadProfilePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function () {
    couplePhotoImg.src = reader.result;
    couplePhotoImg.style.display = "block";
    coupleEmoji.style.display = "none";
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_photo: reader.result })
    });
    toast("Profile photo updated ❤️");
  };
  reader.readAsDataURL(file);
}

// =========================
// LOVE COUNTER
// =========================

function updateCounter() {
  const start = new Date(startDate.value);
  const now = new Date();
  const diff = now - start;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const mins = Math.floor(diff / 60000) % 60;
  const secs = Math.floor(diff / 1000) % 60;
  cDays.textContent = days;
  cHours.textContent = String(hours).padStart(2, "0");
  cMins.textContent = String(mins).padStart(2, "0");
  cSecs.textContent = String(secs).padStart(2, "0");
  counterMsg.textContent = `${days} days of love together 💕`;
}

// =========================
// TIMELINE
// =========================

async function loadTimeline() {
  const res = await fetch("/api/timeline");
  const data = await res.json();
  timelineContainer.innerHTML = data.map(item => `
    <div class="tl-item">
      <div class="tl-card">
        <div class="tl-emoji">${item.emoji}</div>
        <div class="tl-title">${item.title}</div>
        <div class="tl-desc">${item.description}</div>
        <div class="tl-date">${item.event_date}</div>
      </div>
    </div>
  `).join("");
}

async function addTimelineEvent() {
  await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emoji: tlEmoji.value,
      title: tlTitle.value,
      description: tlDesc.value,
      event_date: tlDate.value
    })
  });
  closeModal("addTimelineModal");
  loadTimeline();
}

// =========================
// PHOTOS
// =========================

async function loadPhotos(tag = "all") {
  const res = await fetch(`/api/photos?tag=${tag}`);
  currentPhotos = await res.json();
  masonryGrid.innerHTML = currentPhotos.map((p, index) => `
    <div class="photo-item" id="photo-card-${p.id}">
      <button class="photo-delete-btn" onclick="openDeleteConfirm(${p.id}, event)">🗑️</button>
      <div onclick="openLightbox(${index})">
        ${p.url
          ? `<img src="${p.url}" alt="${p.caption}">`
          : `<div class="photo-placeholder">${p.emoji || "📷"}</div>`}
        <div class="photo-overlay">
          <span class="photo-tag">${p.tag || "photo"}</span>
          <div class="photo-caption-text">${p.caption}</div>
          <div class="photo-actions">
            <button class="pa-btn" onclick="event.stopPropagation(); openLightbox(${index})">🔍 View</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

function previewPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  photoPreviewImg.src = URL.createObjectURL(file);
  photoPreviewImg.style.display = "block";
}

async function addPhoto() {
  const fd = new FormData();
  fd.append("caption", photoCaption.value);
  fd.append("description", photoDesc.value);
  fd.append("tag", photoTag.value);
  const file = document.getElementById("photoFileInput").files[0];
  if (file) fd.append("photo", file);
  await fetch("/api/photos", { method: "POST", body: fd });
  closeModal("addPhotoModal");
  loadPhotos();
}

// =========================
// PHOTO DELETE
// =========================

function openDeleteConfirm(photoId, event) {
  event.stopPropagation();
  photoToDeleteId = photoId;
  openModal("deletePhotoModal");
}

async function confirmDeletePhoto() {
  if (!photoToDeleteId) return;
  try {
    const card = document.getElementById(`photo-card-${photoToDeleteId}`);
    if (card) {
      card.style.transition = "opacity 0.35s, transform 0.35s";
      card.style.opacity = "0";
      card.style.transform = "scale(0.85)";
    }
    await fetch(`/api/photos/${photoToDeleteId}`, { method: "DELETE" });
    closeModal("deletePhotoModal");
    setTimeout(() => { loadPhotos(); toast("Photo delete ho gayi 🗑️"); }, 350);
  } catch (err) {
    toast("Delete nahi hua ❌");
  } finally {
    photoToDeleteId = null;
  }
}

// =========================
// LIGHTBOX
// =========================

function openLightbox(index) {
  currentPhotoIndex = index;
  const p = currentPhotos[index];
  lightbox.classList.add("open");
  lbCaption.textContent = p.caption;
  lbDesc.textContent = p.description;
  lbImgWrap.innerHTML = p.url
    ? `<img src="${p.url}">`
    : `<div class="lb-placeholder">${p.emoji}</div>`;
  lbCounter.textContent = `${index + 1} / ${currentPhotos.length}`;
  lbHeart.textContent = `❤️ ${p.likes}`;
}

function closeLightbox() { lightbox.classList.remove("open"); }

function lbNav(dir) {
  currentPhotoIndex += dir;
  if (currentPhotoIndex < 0) currentPhotoIndex = currentPhotos.length - 1;
  if (currentPhotoIndex >= currentPhotos.length) currentPhotoIndex = 0;
  openLightbox(currentPhotoIndex);
}

async function lbLike() {
  const p = currentPhotos[currentPhotoIndex];
  const res = await fetch(`/api/photos/${p.id}/like`, { method: "POST" });
  const data = await res.json();
  lbHeart.textContent = `❤️ ${data.likes}`;
  lbHeart.classList.add("liked");
}

// =========================
// MEMORIES
// =========================

async function loadMemories() {
  const res = await fetch("/api/memories");
  const data = await res.json();
  memoryGrid.innerHTML = data.map(m => `
    <div class="memory-card">
      <div class="memory-emoji">${m.emoji}</div>
      <div class="memory-title">${m.title}</div>
      <div class="memory-text">${m.text}</div>
    </div>
  `).join("");
}

async function addMemory() {
  await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji: memEmoji.value, title: memTitle.value, text: memText.value })
  });
  closeModal("addMemoryModal");
  loadMemories();
}

// =========================
// REASONS
// =========================

function renderReasons() {
  reasonsGrid.innerHTML = reasons.map(r => `
    <div class="reason-card">
      <div class="reason-inner">
        <div class="reason-front">❤️</div>
        <div class="reason-back">${r}</div>
      </div>
    </div>
  `).join("");
}

// =========================
// LETTER
// =========================

function toggleLetter() { letterBox.classList.toggle("open"); }

async function saveLetter() {
  letterBody.textContent = letterEdit.value;
  await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ love_letter: letterEdit.value })
  });
  toast("Letter saved ❤️");
}

// =========================
// MUSIC — SOUNDCLOUD PLAYER
// =========================

let songIndex = 0;
let scWidget = null; // SoundCloud widget reference

// SoundCloud URL ko embed URL mein convert karo
function getSoundCloudEmbed(url) {
  // Seedha SoundCloud track/playlist URL
  if (url.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23e91e8c&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
  }
  return null;
}

// Song add karo URL se
function addMusicLink() {
  const input = document.getElementById('musicLinkInput');
  let url = input.value.trim();

  if (!url) {
    toast("Paste a SoundCloud link first! 🎵");
    return;
  }

  if (!url.includes('soundcloud.com')) {
    toast("Only SoundCloud links work! (soundcloud.com/...) 🎵");
    return;
  }

  // UTM parameters aur extra query strings hata do — sirf clean URL rakho
  try {
    const parsed = new URL(url);
    url = parsed.origin + parsed.pathname; // sirf domain + path, koi ?utm= nahi
  } catch(e) {
    // URL parse nahi hua, as-is use karo
  }

  // Clean title extract karo URL se (no UTM garbage)
  const parts = url.split('/').filter(p => p && !p.includes('?') && !p.includes('utm'));
  const rawTitle = parts[parts.length - 1] || 'My Song';
  const title = rawTitle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 40);
  const rawArtist = parts.length > 2 ? parts[parts.length - 2] : 'Artist';
  const artist = rawArtist.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 30);

  const newSong = { title, artist, scUrl: url };
  playlist.push(newSong);
  songIndex = playlist.length - 1;

  loadSoundCloudSong(url, title, artist);
  renderPlaylist();
  input.value = '';
  toast("Song added! 🎶");
}

function loadSoundCloudSong(scUrl, title, artist) {
  // Truncate for display in player header
  songTitle.textContent = title.length > 35 ? title.substring(0, 35) + '...' : title;
  songArtist.textContent = artist.length > 30 ? artist.substring(0, 30) + '...' : artist;
  musicDisc.classList.add("spinning");
  playBtn.textContent = "⏸";
  playing = true;

  const embedUrl = getSoundCloudEmbed(scUrl);
  const area = document.getElementById('scEmbedArea');
  const iframe = document.getElementById('scIframe');

  if (embedUrl) {
    iframe.src = embedUrl;
    area.style.display = 'block';
  }
}

function playSongFromList(i) {
  songIndex = i;
  const s = playlist[i];
  if (s.scUrl) {
    loadSoundCloudSong(s.scUrl, s.title, s.artist);
  } else {
    toast("No SoundCloud link for this song yet 🎵");
    songTitle.textContent = s.title;
    songArtist.textContent = s.artist;
  }
  renderPlaylist();
}

function renderPlaylist() {
  playlistList.innerHTML = playlist.map((s, i) => `
    <div class="playlist-item ${i === songIndex ? 'playing' : ''}" onclick="playSongFromList(${i})">
      <div class="pl-num">${i + 1}</div>
      <div class="pl-info" style="overflow:hidden;min-width:0;">
        <div class="pl-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</div>
        <div class="pl-artist" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.artist}</div>
      </div>
      <span style="font-size:14px;flex-shrink:0;">${s.scUrl ? '🎵' : '➕'}</span>
    </div>
  `).join("");
}

function togglePlay() {
  const iframe = document.getElementById('scIframe');
  const area = document.getElementById('scEmbedArea');

  if (!iframe.src) {
    toast("Add a SoundCloud link first! 🎵");
    return;
  }

  playing = !playing;
  playBtn.textContent = playing ? "⏸" : "▶";
  musicDisc.classList.toggle("spinning", playing);

  // Pause/Resume: src remove/restore trick
  if (!playing) {
    iframe.dataset.saved = iframe.src;
    iframe.src = '';
  } else {
    iframe.src = iframe.dataset.saved || '';
  }
}

function nextSong() {
  songIndex = (songIndex + 1) % playlist.length;
  playSongFromList(songIndex);
}

function prevSong() {
  songIndex = (songIndex - 1 + playlist.length) % playlist.length;
  playSongFromList(songIndex);
}

// =========================
// SURPRISE
// =========================

async function fetchSurprise() {
  try {
    const res = await fetch("/api/surprise");
    const data = await res.json();
    surpriseMsg.textContent = data.message;
    createConfetti();
  } catch (err) {
    surpriseMsg.textContent = "You are my everything! ❤️";
    createConfetti();
  }
}

async function saveSurprise() {
  const sender = document.getElementById('surpriseSender').value.trim();
  const message = document.getElementById('surpriseText').value.trim();
  if (!message) { toast("Kuch toh likho pehle! ✍️"); return; }
  try {
    const res = await fetch('/api/surprise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: sender || 'Someone ❤️', message })
    });
    if (res.ok) {
      toast("Surprise save ho gaya! 💝");
      document.getElementById('surpriseSender').value = '';
      document.getElementById('surpriseText').value = '';
      closeModal('addSurpriseModal');
    } else {
      toast("Save nahi hua ❌");
    }
  } catch (err) {
    toast("Network error ❌");
  }
}

// =========================
// MODALS
// =========================

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// =========================
// EFFECTS
// =========================

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

function createFloatingHearts() {
  const box = document.getElementById("heartsContainer");
  setInterval(() => {
    const h = document.createElement("div");
    h.className = "heart-float";
    h.innerHTML = "❤️";
    h.style.left = Math.random() * 100 + "%";
    box.appendChild(h);
    setTimeout(() => h.remove(), 6000);
  }, 700);
}

function createConfetti() {
  for (let i = 0; i < 40; i++) {
    const star = document.createElement("div");
    star.className = "real-star";
    star.innerHTML = Math.random() > 0.5 ? "✨" : "⭐";
    star.style.left = Math.random() * 100 + "vw";
    star.style.animationDuration = (3 + Math.random() * 4) + "s";
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 7000);
  }
}