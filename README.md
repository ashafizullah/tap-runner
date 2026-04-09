# 🏃 Tap Runner

Multiplayer browser-based 100m sprint race. Siapa yang paling cepat tap, dia yang menang!

## 🎮 Cara Main

1. Masukkan nama & buat/join room
2. Tunggu player lain (minimal 2, maksimal 4)
3. Klik **START RACE**
4. Ketika mulai, **klik/tap layar secepatnya!** 🖱️📱
5. Player pertama yang sampai garis finish menang!

## ⚡ Power-ups

| Power-up | Efek |
|----------|------|
| ⚡ Speed Boost | Kecepatan ×1.5 selama 3 detik |
| 🧊 Freeze | Bekukan semua musuh selama 2 detik |
| 🐌 Slow Trap | Lambatkan musuh selama 2.5 detik |
| 🦘 Dash | Loncat maju 5m instan |

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Font**: Press Start 2P (pixel art)
- **No framework** — vanilla JS, pure canvas rendering

## ⚙️ Setup

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/ashafizullah/tap-runner.git
cd tap-runner
npm install
node server.js
```

Buka browser di `http://localhost:3000`

### Deploy

```bash
# Deploy ke VPS dengan systemd
/opt/projects/deploy.sh tap-runner
```

Server listen di port `3000` (configurable via `PORT` env var).

## 🏗️ Architecture

```
Client (Browser)                    Server (Node.js)
┌──────────────────┐                ┌──────────────────┐
│  HTML5 Canvas    │  Socket.io     │  Express +       │
│  Pixel Art       │◄──────────────►│  Socket.io       │
│  Tap Handler     │  Events:       │  Game Loop       │
│  HUD / Results   │  - tap         │  (20 ticks/s)    │
│                  │  - gameState   │                  │
│                  │  - powerUp     │  Rooms + Players │
└──────────────────┘  - join/leave  └──────────────────┘
```

### Game Mechanics

- **Speed**: Setiap tap = 1.5 m/s, max 15 m/s (berdasarkan taps per detik)
- **Anti-hold**: Cooldown 100ms (client) + 80ms (server) antar tap
- **Game end**: Langsung selesai saat player pertama finish
- **Ranking**: Player lain di-rank berdasarkan posisi terakhir

## 📡 Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRoom` | Client → Server | `{ roomId, playerName }` |
| `startGame` | Client → Server | - |
| `tap` | Client → Server | - |
| `restartGame` | Client → Server | - |
| `joinedRoom` | Server → Client | `{ playerId, roomId, players }` |
| `playerJoined` | Server → Client | `{ id, name, color, lane }` |
| `countdown` | Server → Client | `{ count }` |
| `raceStart` | Server → Client | - |
| `gameState` | Server → Client | `{ [playerId]: { position, speed, effects } }` |
| `powerUpSpawned` | Server → Client | `{ id, type, position }` |
| `powerUpUsed` | Server → Client | `{ playerId, type, name }` |
| `winner` | Server → Client | `{ playerId, name, time }` |
| `gameFinished` | Server → Client | `{ rankings[] }` |

## 📁 Project Structure

```
tap-runner/
├── server.js          # Game server + Socket.io logic
├── public/
│   └── index.html     # Frontend (canvas, UI, socket client)
├── package.json
└── README.md
```

## 📄 License

MIT
