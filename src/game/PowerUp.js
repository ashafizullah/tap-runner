const { POWER_UPS, POWER_UP_POSITIONS, FINISH_LINE } = require('../config');

function spawn(room, io) {
  if (room.state !== 'racing') return;
  if (room.powerUps.length >= 3) return;

  const type = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
  const pos = POWER_UP_POSITIONS[Math.floor(Math.random() * POWER_UP_POSITIONS.length)];

  // Don't spawn too close to existing power-up
  const tooClose = room.powerUps.some(pu => Math.abs(pu.position - pos) < 10);
  if (tooClose) return;

  const powerUp = {
    id: Date.now() + Math.random(),
    type: type.id,
    name: type.name,
    emoji: type.emoji,
    duration: type.duration,
    position: pos + (Math.random() * 10 - 5),
    collected: false,
  };

  room.powerUps.push(powerUp);
  io.to(room.id).emit('powerUpSpawned', powerUp);
}

function apply(room, playerId, powerUp, io) {
  const player = room.players.get(playerId);
  if (!player || player.finished) return;

  const now = Date.now();

  switch (powerUp.type) {
    case 'speed':
      player.effects.push({ type: 'speed', endTime: now + powerUp.duration });
      broadcastUse(io, room.id, playerId, 'speed', powerUp.emoji, player.name);
      break;

    case 'freeze':
      for (const [pid, p] of room.players) {
        if (pid !== playerId && !p.finished) {
          p.effects.push({ type: 'frozen', endTime: now + powerUp.duration });
          broadcastUse(io, room.id, playerId, 'freeze', powerUp.emoji, player.name);
        }
      }
      break;

    case 'slow':
      for (const [pid, p] of room.players) {
        if (pid !== playerId && !p.finished) {
          p.effects.push({ type: 'slowed', endTime: now + powerUp.duration });
          broadcastUse(io, room.id, playerId, 'slow', powerUp.emoji, player.name);
        }
      }
      break;

    case 'dash':
      player.position = Math.min(player.position + 5, FINISH_LINE);
      broadcastUse(io, room.id, playerId, 'dash', powerUp.emoji, player.name);
      break;
  }

  room.powerUps = room.powerUps.filter(p => p.id !== powerUp.id);
  io.to(room.id).emit('powerUpCollected', { powerUpId: powerUp.id, playerId });
}

function broadcastUse(io, roomId, playerId, type, emoji, name) {
  io.to(roomId).emit('powerUpUsed', { playerId, type, emoji, name, targetPlayerId: playerId });
}

function checkCollection(room) {
  for (const player of room.players.values()) {
    if (player.finished) continue;
    for (const powerUp of room.powerUps) {
      if (!powerUp.collected && Math.abs(player.position - powerUp.position) < 3) {
        powerUp.collected = true;
        return { playerId: player.id, powerUp };
      }
    }
  }
  return null;
}

module.exports = { spawn, apply, checkCollection };
