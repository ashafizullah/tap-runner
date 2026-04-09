const { PLAYER_COLORS } = require('../config');
const { createPlayer, resetPlayer, toPublic } = require('./Player');

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

function addPlayer(room, socketId, playerName) {
  const color = PLAYER_COLORS[room.players.size] || PLAYER_COLORS[0];
  const player = createPlayer(socketId, playerName || `Player ${room.players.size + 1}`, color);
  player.lane = room.players.size;
  room.players.set(socketId, player);
  return player;
}

function removePlayer(room, socketId) {
  room.players.delete(socketId);
}

function resetRoom(room) {
  if (room.powerUpTimer) clearInterval(room.powerUpTimer);

  room.state = 'waiting';
  room.winner = null;
  room.rankings = [];
  room.powerUps = [];
  room.startTime = 0;

  for (const player of room.players.values()) {
    resetPlayer(player);
  }
}

function getPlayersList(room) {
  return [...room.players.values()].map(toPublic);
}

function isEmpty(room) {
  return room.players.size === 0;
}

module.exports = { createRoom, addPlayer, removePlayer, resetRoom, getPlayersList, isEmpty };
