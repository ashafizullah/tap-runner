// ─── Socket.io Connection & Events ───

const socket = io();

socket.on('joinedRoom', (data) => {
  myId = data.playerId;
  currentRoom = data.roomId;
  players = data.players;

  showScreen('lobby');
  showChatButton();
  document.getElementById('lobbyRoomCode').textContent = data.roomId;

  updatePlayerList();

  if (data.players.length > 0 && data.players[0].id === myId) {
    document.getElementById('startBtn').style.display = 'block';
  }
});

socket.on('playerJoined', (player) => {
  players.push(player);
  updatePlayerList();
  addChatMessage({ message: `${player.name} bergabung!` }, true);

  if (players.length >= 2 && players[0].id === myId) {
    document.getElementById('startBtn').style.display = 'block';
  }
});

socket.on('playerLeft', (data) => {
  const left = players.find(p => p.id === data.playerId);
  if (left) addChatMessage({ message: `${left.name} keluar` }, true);
  players = players.filter(p => p.id !== data.playerId);
  updatePlayerList();
});

socket.on('chatMessage', (data) => {
  addChatMessage(data);
});

socket.on('countdown', (data) => {
  countdownActive = true;
  showScreen('game');
  const el = document.getElementById('countdown');
  el.style.display = 'flex';
  el.textContent = data.count;
});

socket.on('raceStart', () => {
  countdownActive = false;
  gameRunning = true;
  document.getElementById('countdown').style.display = 'none';
  showScreen('game');
  resizeCanvas();
});

socket.on('gameState', (state) => {
  gameState = state;
  updateHUD();
  drawGame();
});

socket.on('powerUpSpawned', (pu) => {
  powerUps.push(pu);
});

socket.on('powerUpCollected', (data) => {
  powerUps = powerUps.filter(p => p.id !== data.powerUpId);
});

socket.on('powerUpUsed', (data) => {
  showPowerUpNotification(data);
});

socket.on('playerFinished', (data) => {});

socket.on('winner', (data) => {});

socket.on('gameFinished', (data) => {
  gameRunning = false;
  showResults(data.rankings);
});

socket.on('gameRestarted', (data) => {
  players = data.players;
  powerUps = [];
  gameState = {};
  gameRunning = false;
  document.getElementById('results').style.display = 'none';
  showScreen('lobby');
  updatePlayerList();
});

socket.on('error', (data) => {
  alert(data.message);
});
