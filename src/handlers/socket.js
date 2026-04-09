const { MAX_PLAYERS, MIN_PLAYERS, TAP_COOLDOWN_MS } = require('../config');
const { addPlayer, removePlayer, resetRoom, getPlayersList, isEmpty } = require('../game/Room');
const { toPublic } = require('../game/Player');
const GameLoop = require('../game/GameLoop');

const lastTapTime = {};

function registerSocketHandlers(io, rooms) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, playerName }) => {
      let room = rooms.get(roomId);
      if (!room) {
        const { createRoom } = require('../game/Room');
        room = createRoom(roomId);
        rooms.set(roomId, room);
      }

      if (room.players.size >= MAX_PLAYERS) {
        socket.emit('error', { message: 'Room penuh! Maksimal 4 player.' });
        return;
      }

      if (room.state === 'racing') {
        socket.emit('error', { message: 'Game sudah dimulai!' });
        return;
      }

      const player = addPlayer(room, socket.id, playerName);
      socket.join(roomId);
      socket.roomId = roomId;

      socket.emit('joinedRoom', {
        roomId,
        playerId: socket.id,
        player: toPublic(player),
        players: getPlayersList(room),
        state: room.state,
      });

      socket.to(roomId).emit('playerJoined', toPublic(player));
    });

    socket.on('startGame', () => {
      const room = rooms.get(socket.roomId);
      if (!room) return;

      if (room.players.size < MIN_PLAYERS) {
        socket.emit('error', { message: 'Butuh minimal 2 player!' });
        return;
      }

      GameLoop.start(room, io, rooms);
    });

    socket.on('tap', () => {
      const room = rooms.get(socket.roomId);
      if (!room || room.state !== 'racing') return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      const now = Date.now();
      if (lastTapTime[socket.id] && now - lastTapTime[socket.id] < TAP_COOLDOWN_MS) return;
      lastTapTime[socket.id] = now;

      player.tapTimestamps.push(now);
      player.tapCount += 1;
    });

    socket.on('restartGame', () => {
      const room = rooms.get(socket.roomId);
      if (!room) return;

      resetRoom(room);
      io.to(room.id).emit('gameRestarted', { players: getPlayersList(room) });
    });

    socket.on('disconnect', () => {
      delete lastTapTime[socket.id];

      const room = rooms.get(socket.roomId);
      if (room) {
        removePlayer(room, socket.id);
        io.to(room.id).emit('playerLeft', { playerId: socket.id });

        if (isEmpty(room)) {
          if (room.powerUpTimer) clearInterval(room.powerUpTimer);
          rooms.delete(room.id);
          console.log(`Room ${room.id} deleted (empty)`);
        }
      }
      console.log(`Player disconnected: ${socket.id}`);
    });
  });
}

module.exports = { registerSocketHandlers };
