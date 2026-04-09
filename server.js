const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game state
const rooms = new Map();

const POWER_UPS = [
  { id: 'speed', name: 'Speed Boost', emoji: '⚡', duration: 3000 },
  { id: 'freeze', name: 'Freeze Enemy', emoji: '🧊', duration: 2000 },
  { id: 'slow', name: 'Slow Trap', emoji: '🐌', duration: 2500 },
  { id: 'dash', name: 'Dash', emoji: '🦘', duration: 0 }, // instant
];

const TRACK_LENGTH = 100; // meters
const FINISH_LINE = TRACK_LENGTH;
const POWER_UP_INTERVAL = 8000; // spawn power-up every 8s
const POWER_UP_POSITIONS = [25, 50, 75]; // power-up zones at 25m, 50m, 75m

function createRoom(roomId) {
  return {
    id: roomId,
    players: new Map(),
    state: 'waiting', // waiting, countdown, racing, finished
    countdown: 3,
    powerUps: [],
    powerUpTimer: null,
    startTime: 0,
    winner: null,
    rankings: [],
  };
}

function createPlayer(id, name, color) {
  return {
    id,
    name,
    color,
    position: 0,
    speed: 0,
    tapCount: 0,
    effects: [], // active power-up effects
    finished: false,
    finishTime: 0,
    lane: 0,
  };
}

function getAvailableColor(room) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
  const used = [...room.players.values()].map(p => p.color);
  return colors.find(c => !used.used?.includes(c)) || colors[room.players.size % colors.length];
}

function spawnPowerUp(room) {
  if (room.state !== 'racing') return;
  if (room.powerUps.length >= 3) return;

  const type = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
  const pos = POWER_UP_POSITIONS[Math.floor(Math.random() * POWER_UP_POSITIONS.length)];

  // Check if there's already a power-up near this position
  const tooClose = room.powerUps.some(pu => Math.abs(pu.position - pos) < 10);
  if (tooClose) return;

  const powerUp = {
    id: Date.now() + Math.random(),
    type: type.id,
    name: type.name,
    emoji: type.emoji,
    duration: type.duration,
    position: pos + (Math.random() * 10 - 5), // slight random offset
    collected: false,
  };

  room.powerUps.push(powerUp);
  io.to(room.id).emit('powerUpSpawned', powerUp);
}

function applyPowerUp(room, playerId, powerUp) {
  const player = room.players.get(playerId);
  if (!player || player.finished) return;

  const now = Date.now();

  switch (powerUp.type) {
    case 'speed':
      player.effects.push({ type: 'speed', endTime: now + powerUp.duration });
      io.to(room.id).emit('powerUpUsed', {
        playerId,
        type: 'speed',
        emoji: powerUp.emoji,
        name: player.name,
        targetPlayerId: playerId,
      });
      break;

    case 'freeze':
      // Freeze all OTHER players
      for (const [pid, p] of room.players) {
        if (pid !== playerId && !p.finished) {
          p.effects.push({ type: 'frozen', endTime: now + powerUp.duration });
          io.to(room.id).emit('powerUpUsed', {
            playerId,
            type: 'freeze',
            emoji: powerUp.emoji,
            name: player.name,
            targetPlayerId: pid,
          });
        }
      }
      break;

    case 'slow':
      // Slow all OTHER players
      for (const [pid, p] of room.players) {
        if (pid !== playerId && !p.finished) {
          p.effects.push({ type: 'slowed', endTime: now + powerUp.duration });
          io.to(room.id).emit('powerUpUsed', {
            playerId,
            type: 'slow',
            emoji: powerUp.emoji,
            name: player.name,
            targetPlayerId: pid,
          });
        }
      }
      break;

    case 'dash':
      // Instant forward burst
      player.position = Math.min(player.position + 5, FINISH_LINE);
      io.to(room.id).emit('powerUpUsed', {
        playerId,
        type: 'dash',
        emoji: powerUp.emoji,
        name: player.name,
        targetPlayerId: playerId,
      });
      break;
  }

  // Remove collected power-up
  room.powerUps = room.powerUps.filter(p => p.id !== powerUp.id);
  io.to(room.id).emit('powerUpCollected', { powerUpId: powerUp.id, playerId });
}

function updatePlayerSpeed(player, now) {
  // Clean expired effects
  player.effects = player.effects.filter(e => e.endTime > now);

  let speed = 0;
  let frozen = false;

  for (const effect of player.effects) {
    if (effect.type === 'frozen') frozen = true;
  }

  if (frozen) {
    player.speed = 0;
    return;
  }

  // Base speed from tap count (taps per second mapped to m/s)
  // More taps = faster, with diminishing returns
  speed = Math.min(player.tapCount * 0.5, 12); // max 12 m/s

  for (const effect of player.effects) {
    if (effect.type === 'speed') speed *= 1.5;
    if (effect.type === 'slowed') speed *= 0.5;
  }

  player.speed = speed;
}

function checkFinish(room) {
  const now = Date.now();
  let allFinished = true;

  for (const [pid, player] of room.players) {
    if (player.position >= FINISH_LINE && !player.finished) {
      player.finished = true;
      player.finishTime = now - room.startTime;
      room.rankings.push({
        id: pid,
        name: player.name,
        color: player.color,
        time: player.finishTime,
        position: room.rankings.length + 1,
      });

      io.to(room.id).emit('playerFinished', {
        playerId: pid,
        name: player.name,
        position: room.rankings.length,
        time: player.finishTime,
      });

      if (!room.winner) {
        room.winner = pid;
        io.to(room.id).emit('winner', {
          playerId: pid,
          name: player.name,
          time: player.finishTime,
        });
      }
    }

    if (!player.finished) allFinished = false;
  }

  if (allFinished || (room.rankings.length > 0 && now - room.startTime > 60000)) {
    room.state = 'finished';
    io.to(room.id).emit('gameFinished', { rankings: room.rankings });

    if (room.powerUpTimer) {
      clearInterval(room.powerUpTimer);
      room.powerUpTimer = null;
    }
  }
}

// Game loop - 20 ticks per second
function gameLoop(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.state !== 'racing') return;

  const now = Date.now();
  const dt = 0.05; // 50ms tick

  for (const [pid, player] of room.players) {
    if (player.finished) continue;

    updatePlayerSpeed(player, now);
    player.position += player.speed * dt;

    // Reset tap count each tick (player must keep tapping)
    player.tapCount = Math.max(0, player.tapCount - 2);
  }

  // Check power-up collection
  for (const [pid, player] of room.players) {
    if (player.finished) continue;

    for (const powerUp of room.powerUps) {
      if (!powerUp.collected && Math.abs(player.position - powerUp.position) < 3) {
        powerUp.collected = true;
        applyPowerUp(room, pid, powerUp);
      }
    }
  }

  checkFinish(room);

  // Send state update
  const state = {};
  for (const [pid, player] of room.players) {
    state[pid] = {
      position: player.position,
      speed: player.speed,
      effects: player.effects.map(e => ({
        type: e.type,
        remaining: Math.max(0, e.endTime - now),
      })),
      finished: player.finished,
      tapCount: player.tapCount,
    };
  }

  io.to(roomId).emit('gameState', state);
}

// Socket handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, playerName }) => {
    let room = rooms.get(roomId);

    if (!room) {
      room = createRoom(roomId);
      rooms.set(roomId, room);
    }

    if (room.players.size >= 4) {
      socket.emit('error', { message: 'Room penuh! Maksimal 4 player.' });
      return;
    }

    if (room.state === 'racing') {
      socket.emit('error', { message: 'Game sudah dimulai!' });
      return;
    }

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    const color = colors[room.players.size];
    const player = createPlayer(socket.id, playerName || `Player ${room.players.size + 1}`, color);
    player.lane = room.players.size;

    room.players.set(socket.id, player);
    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit('joinedRoom', {
      roomId,
      playerId: socket.id,
      player: {
        id: player.id,
        name: player.name,
        color: player.color,
        lane: player.lane,
      },
      players: [...room.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        lane: p.lane,
      })),
      state: room.state,
    });

    socket.to(roomId).emit('playerJoined', {
      id: player.id,
      name: player.name,
      color: player.color,
      lane: player.lane,
    });
  });

  socket.on('startGame', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;

    if (room.players.size < 2) {
      socket.emit('error', { message: 'Butuh minimal 2 player!' });
      return;
    }

    room.state = 'countdown';
    room.countdown = 3;

    io.to(room.id).emit('countdown', { count: 3 });

    const countdownInterval = setInterval(() => {
      room.countdown--;
      if (room.countdown > 0) {
        io.to(room.id).emit('countdown', { count: room.countdown });
      } else {
        clearInterval(countdownInterval);
        room.state = 'racing';
        room.startTime = Date.now();

        // Spawn power-ups periodically
        room.powerUpTimer = setInterval(() => {
          spawnPowerUp(room);
        }, POWER_UP_INTERVAL);

        io.to(room.id).emit('raceStart');

        // Start game loop
        const loopInterval = setInterval(() => {
          if (room.state !== 'racing') {
            clearInterval(loopInterval);
            return;
          }
          gameLoop(room.id);
        }, 50);
      }
    }, 1000);
  });

  socket.on('tap', () => {
    const room = rooms.get(socket.roomId);
    if (!room || room.state !== 'racing') return;

    const player = room.players.get(socket.id);
    if (player && !player.finished) {
      player.tapCount += 1;
    }
  });

  socket.on('restartGame', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;

    // Reset room
    if (room.powerUpTimer) clearInterval(room.powerUpTimer);

    room.state = 'waiting';
    room.winner = null;
    room.rankings = [];
    room.powerUps = [];
    room.startTime = 0;

    for (const [pid, player] of room.players) {
      player.position = 0;
      player.speed = 0;
      player.tapCount = 0;
      player.effects = [];
      player.finished = false;
      player.finishTime = 0;
    }

    io.to(room.id).emit('gameRestarted', {
      players: [...room.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        lane: p.lane,
      })),
    });
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.players.delete(socket.id);
      io.to(room.id).emit('playerLeft', { playerId: socket.id });

      if (room.players.size === 0) {
        if (room.powerUpTimer) clearInterval(room.powerUpTimer);
        rooms.delete(room.id);
        console.log(`Room ${room.id} deleted (empty)`);
      }
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏃 Tap Runner running on http://localhost:${PORT}`);
});
