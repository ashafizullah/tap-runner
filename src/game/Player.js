const { FINISH_LINE } = require('../config');

function createPlayer(id, name, color) {
  return {
    id,
    name,
    color,
    position: 0,
    speed: 0,
    tapCount: 0,
    tapTimestamps: [],
    effects: [],
    finished: false,
    finishTime: 0,
    lane: 0,
  };
}

function resetPlayer(player) {
  player.position = 0;
  player.speed = 0;
  player.tapCount = 0;
  player.tapTimestamps = [];
  player.effects = [];
  player.finished = false;
  player.finishTime = 0;
}

function updateSpeed(player, now) {
  // Clean expired effects
  player.effects = player.effects.filter(e => e.endTime > now);

  // Clean old tap timestamps (keep only last 1 second)
  player.tapTimestamps = player.tapTimestamps.filter(t => now - t < 1000);

  // Check if frozen
  const frozen = player.effects.some(e => e.type === 'frozen');
  if (frozen) {
    player.speed = 0;
    return;
  }

  // Taps per second → speed
  let speed = Math.min(player.tapTimestamps.length * 1.5, 15);

  for (const effect of player.effects) {
    if (effect.type === 'speed') speed *= 1.5;
    if (effect.type === 'slowed') speed *= 0.5;
  }

  player.speed = speed;
}

function getState(player, now) {
  return {
    position: player.position,
    speed: player.speed,
    effects: player.effects.map(e => ({
      type: e.type,
      remaining: Math.max(0, e.endTime - now),
    })),
    finished: player.finished,
    tapCount: player.tapTimestamps.length,
  };
}

function toPublic(player) {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    lane: player.lane,
  };
}

module.exports = { createPlayer, resetPlayer, updateSpeed, getState, toPublic };
