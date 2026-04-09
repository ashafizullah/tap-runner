// ─── State ───
let myId = null;
let currentRoom = null;
let players = [];
let gameState = {};
let gameRunning = false;
let powerUps = [];
let countdownActive = false;

// ─── Screen Management ───
function showScreen(id) {
  ['menu', 'lobby', 'game', 'results', 'countdown'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'flex';
  document.getElementById('hud').style.display = id === 'game' ? 'flex' : 'none';
}

// ─── Menu Actions ───
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function joinGame() {
  const name = document.getElementById('playerName').value.trim();
  let code = document.getElementById('roomCode').value.trim().toUpperCase();
  if (!code) code = generateRoomCode();

  currentRoom = code;
  socket.emit('joinRoom', { roomId: code, playerName: name });
}

function startGame() {
  socket.emit('startGame');
}

function restartGame() {
  socket.emit('restartGame');
  document.getElementById('results').style.display = 'none';
}

function backToMenu() {
  location.reload();
}

function leaveLobby() {
  socket.disconnect();
  location.reload();
}

function shareRoom() {
  const url = `${window.location.origin}?room=${currentRoom}`;
  if (navigator.share) {
    navigator.share({
      title: '🏃 Tap Runner',
      text: `Join room ${currentRoom}! Tap secepatnya!`,
      url,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('[onclick="shareRoom()"]');
      btn.textContent = '✅ COPIED!';
      setTimeout(() => { btn.textContent = '📤 SHARE ROOM'; }, 2000);
    });
  }
}

// ─── Player List ───
function updatePlayerList() {
  const list = document.getElementById('playerList');
  list.innerHTML = players.map(p => `
    <div class="player-card">
      <div class="player-dot" style="background: ${p.color}"></div>
      <span>${p.name}${p.id === myId ? ' (kamu)' : ''}</span>
    </div>
  `).join('');

  document.getElementById('waitingMsg').textContent =
    players.length < 2 ? 'Menunggu player lain...' : `${players.length}/4 player siap!`;
}

// ─── HUD ───
function updateHUD() {
  const my = gameState[myId];
  if (my) {
    document.getElementById('hudDistance').textContent = `${my.position.toFixed(1)}m / 100m`;
    const tps = my.tapCount || 0;
    document.getElementById('hudSpeed').textContent = `${tps} taps/s · ${my.speed.toFixed(1)} m/s`;
  }
}

// ─── Results ───
function showResults(rankings) {
  document.getElementById('results').style.display = 'flex';

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  const list = document.getElementById('rankList');
  list.innerHTML = rankings.map((r, i) => `
    <div class="rank-item" style="border-color: ${i === 0 ? '#f1c40f' : '#0f3460'}">
      <div class="rank-pos">${medals[i] || (i + 1)}</div>
      <div class="player-dot" style="background: ${r.color}"></div>
      <span>${r.name}</span>
      <span class="rank-time">${(r.time / 1000).toFixed(2)}s</span>
    </div>
  `).join('');

  document.getElementById('resultTitle').textContent =
    rankings[0]?.id === myId ? '🏆 KAMU MENANG!' : '🏆 HASIL LOMBA';
}

// ─── Power-up Notification ───
function showPowerUpNotification(data) {
  const el = document.getElementById('power-up-notify');
  const messages = {
    speed: `${data.emoji} ${data.name} dapat Speed Boost!`,
    freeze: `${data.emoji} ${data.name} membekukan semua musuh!`,
    slow: `${data.emoji} ${data.name} memperlambat musuh!`,
    dash: `${data.emoji} ${data.name} Dash ke depan!`,
  };
  el.textContent = messages[data.type] || '';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ─── Tap Handler ───
let lastTapTime = 0;
const TAP_COOLDOWN = 100;

function handleTap() {
  if (!gameRunning) return;
  const now = Date.now();
  if (now - lastTapTime < TAP_COOLDOWN) return;
  lastTapTime = now;
  socket.emit('tap');
}

// ─── Auto-fill room from URL ───
(function() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) document.getElementById('roomCode').value = room;
})();

// ─── Canvas resize ───
window.addEventListener('resize', () => {
  if (gameRunning || countdownActive) resizeCanvas();
});
