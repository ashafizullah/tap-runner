// Game configuration constants

const TRACK_LENGTH = 100; // meters
const FINISH_LINE = TRACK_LENGTH;
const GAME_TICK_MS = 50; // 20 ticks per second
const POWER_UP_INTERVAL = 8000; // spawn power-up every 8s
const POWER_UP_POSITIONS = [25, 50, 75]; // power-up zones
const TAP_COOLDOWN_MS = 80; // min ms between taps (server-side anti-hold)
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;
const COUNTDOWN_SECONDS = 3;

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

const POWER_UPS = [
  { id: 'speed', name: 'Speed Boost', emoji: '⚡', duration: 3000 },
  { id: 'freeze', name: 'Freeze Enemy', emoji: '🧊', duration: 2000 },
  { id: 'slow', name: 'Slow Trap', emoji: '🐌', duration: 2500 },
  { id: 'dash', name: 'Dash', emoji: '🦘', duration: 0 }, // instant
];

module.exports = {
  TRACK_LENGTH,
  FINISH_LINE,
  GAME_TICK_MS,
  POWER_UP_INTERVAL,
  POWER_UP_POSITIONS,
  TAP_COOLDOWN_MS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  COUNTDOWN_SECONDS,
  PLAYER_COLORS,
  POWER_UPS,
};
