const { FINISH_LINE, GAME_TICK_MS, POWER_UP_INTERVAL } = require('../config');
const { updateSpeed, getState } = require('./Player');
const PowerUp = require('./PowerUp');

function checkFinish(room, io) {
  const now = Date.now();

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

      // First to finish = winner → end immediately
      if (!room.winner) {
        room.winner = pid;
        io.to(room.id).emit('winner', {
          playerId: pid,
          name: player.name,
          time: player.finishTime,
        });

        // Rank remaining by position
        const unfinished = [...room.players.entries()]
          .filter(([p]) => p !== pid && !room.players.get(p).finished)
          .sort((a, b) => b[1].position - a[1].position);

        for (const [up, uplayer] of unfinished) {
          const ratio = uplayer.position / FINISH_LINE;
          const estimatedTime = ratio > 0.05
            ? Math.round(player.finishTime / ratio)
            : player.finishTime * 2;

          room.rankings.push({
            id: up,
            name: uplayer.name,
            color: uplayer.color,
            time: estimatedTime,
            position: room.rankings.length + 1,
          });
        }

        room.state = 'finished';
        io.to(room.id).emit('gameFinished', { rankings: room.rankings });

        if (room.powerUpTimer) {
          clearInterval(room.powerUpTimer);
          room.powerUpTimer = null;
        }
        return;
      }
    }
  }
}

function tick(roomId, rooms, io) {
  const room = rooms.get(roomId);
  if (!room || room.state !== 'racing') return;

  const now = Date.now();
  const dt = GAME_TICK_MS / 1000;

  // Update positions
  for (const player of room.players.values()) {
    if (player.finished) continue;
    updateSpeed(player, now);
    player.position += player.speed * dt;
  }

  // Check power-up collection
  const collected = PowerUp.checkCollection(room);
  if (collected) {
    PowerUp.apply(room, collected.playerId, collected.powerUp, io);
  }

  checkFinish(room, io);

  // Broadcast state
  const state = {};
  for (const [pid, player] of room.players) {
    state[pid] = getState(player, now);
  }
  io.to(roomId).emit('gameState', state);
}

function start(room, io, rooms) {
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

      room.powerUpTimer = setInterval(() => {
        PowerUp.spawn(room, io);
      }, POWER_UP_INTERVAL);

      io.to(room.id).emit('raceStart');

      const loopInterval = setInterval(() => {
        if (room.state !== 'racing') {
          clearInterval(loopInterval);
          return;
        }
        tick(room.id, rooms, io);
      }, GAME_TICK_MS);
    }
  }, 1000);
}

module.exports = { start, tick };
