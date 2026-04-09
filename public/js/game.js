// ─── Canvas Rendering ───

const SPRITE_WIDTH = 16;
const SPRITE_HEIGHT = 24;
const PIXEL_SCALE = 2;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function generateSprite(color, frame = 0) {
  const c = document.createElement('canvas');
  c.width = SPRITE_WIDTH;
  c.height = SPRITE_HEIGHT;
  const cx = c.getContext('2d');

  const px = (x, y, w = 1, h = 1) => {
    cx.fillStyle = color;
    cx.fillRect(x, y, w, h);
  };

  // Head
  px(5, 0, 6, 5);
  cx.fillStyle = '#ffe0bd';
  px(6, 1, 4, 3);

  // Eyes
  cx.fillStyle = '#000';
  px(7, 2); px(9, 2);

  // Body
  px(5, 5, 6, 8);

  // Arms — alternate based on frame
  if (frame === 0) {
    // Left arm forward, right arm back
    px(2, 6, 2, 5);   // left arm forward
    px(12, 7, 2, 4);  // right arm back
  } else {
    // Right arm forward, left arm back
    px(2, 7, 2, 4);   // left arm back
    px(12, 6, 2, 5);  // right arm forward
  }

  // Legs — alternate based on frame
  if (frame === 0) {
    // Left leg forward, right leg back
    px(4, 13, 2, 7);   // left leg forward (extended)
    px(9, 14, 2, 5);   // right leg back (bent)
    // Feet
    cx.fillStyle = '#333';
    px(3, 19, 3, 2);   // left foot forward
    px(9, 18, 3, 2);   // right foot up
  } else {
    // Right leg forward, left leg back
    px(4, 14, 2, 5);   // left leg back (bent)
    px(10, 13, 2, 7);  // right leg forward (extended)
    // Feet
    cx.fillStyle = '#333';
    px(4, 18, 3, 2);   // left foot up
    px(10, 19, 3, 2);  // right foot forward
  }

  return c;
}

function drawPowerUpOnCanvas(ctx, x, y, type, size = 24) {
  const s = size / 16;

  switch (type) {
    case 'speed':
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(x + 6*s, y, 4*s, s);
      ctx.fillRect(x + 5*s, y + s, 4*s, s);
      ctx.fillRect(x + 4*s, y + 2*s, 5*s, s);
      ctx.fillRect(x + 6*s, y + 3*s, 4*s, s);
      ctx.fillRect(x + 7*s, y + 4*s, 3*s, s);
      ctx.fillRect(x + 8*s, y + 5*s, 2*s, s);
      ctx.fillRect(x + 6*s, y + 6*s, 3*s, s);
      ctx.fillRect(x + 4*s, y + 7*s, 4*s, s);
      ctx.fillRect(x + 3*s, y + 8*s, 4*s, s);
      break;

    case 'freeze':
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(x + 7*s, y, 2*s, s);
      ctx.fillRect(x + 7*s, y + s, 2*s, s);
      ctx.fillRect(x + 4*s, y + 2*s, 8*s, s);
      ctx.fillRect(x + 7*s, y + 3*s, 2*s, s);
      ctx.fillRect(x + 7*s, y + 4*s, 2*s, s);
      ctx.fillRect(x + 7*s, y + 5*s, 2*s, s);
      ctx.fillRect(x + 4*s, y + 6*s, 8*s, s);
      ctx.fillRect(x + 7*s, y + 7*s, 2*s, s);
      ctx.fillRect(x + 7*s, y + 8*s, 2*s, s);
      break;

    case 'slow':
      ctx.fillStyle = '#e17055';
      ctx.fillRect(x + 8*s, y + 2*s, 4*s, 4*s);
      ctx.fillRect(x + 6*s, y + 3*s, 2*s, 3*s);
      ctx.fillRect(x + 4*s, y + 6*s, 8*s, 2*s);
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(x + 2*s, y + s, 2*s, s);
      ctx.fillRect(x + s, y + 2*s, 2*s, s);
      break;

    case 'dash':
      ctx.fillStyle = '#00b894';
      ctx.fillRect(x + 10*s, y + 3*s, 4*s, 2*s);
      ctx.fillRect(x + 8*s, y + 2*s, 2*s, s);
      ctx.fillRect(x + 8*s, y + 5*s, 2*s, s);
      ctx.fillRect(x + 6*s, y + s, 2*s, s);
      ctx.fillRect(x + 6*s, y + 6*s, 2*s, s);
      ctx.fillRect(x + 2*s, y + 3*s, 6*s, 2*s);
      break;
  }
}

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight - 120;
}

function drawGame() {
  if (!ctx || !canvas.width) return;

  const W = canvas.width;
  const H = canvas.height;

  // Clear
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, W, H);

  const trackTop = 60;
  const trackHeight = H - trackTop - 20;
  const laneHeight = trackHeight / 4;

  // Grass
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(0, trackTop - 20, W, 20);

  // Dirt track
  ctx.fillStyle = '#d4a574';
  ctx.fillRect(0, trackTop, W, trackHeight);

  // Lane lines
  for (let i = 0; i <= 4; i++) {
    const y = trackTop + i * laneHeight;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Distance markers
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px "Press Start 2P"';
  for (let m = 0; m <= 100; m += 10) {
    const x = (m / 100) * (W - 100) + 50;
    ctx.fillText(`${m}m`, x - 10, trackTop + trackHeight + 15);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(x, trackTop);
    ctx.lineTo(x, trackTop + trackHeight);
    ctx.stroke();
  }

  // Finish line
  const finishX = W - 60;
  ctx.fillStyle = '#fff';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 3; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(finishX + col * 8, trackTop + row * (trackHeight / 8), 8, trackHeight / 8);
      }
    }
  }
  ctx.fillStyle = '#000';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 3; col++) {
      if ((row + col) % 2 !== 0) {
        ctx.fillRect(finishX + col * 8, trackTop + row * (trackHeight / 8), 8, trackHeight / 8);
      }
    }
  }

  // Draw power-ups
  for (const pu of powerUps) {
    if (pu.collected) continue;
    const puX = (pu.position / 100) * (finishX - 50) + 50;
    const puY = trackTop + laneHeight * 0.5;

    ctx.shadowColor = pu.type === 'speed' ? '#f1c40f' :
                      pu.type === 'freeze' ? '#74b9ff' :
                      pu.type === 'slow' ? '#e17055' : '#00b894';
    ctx.shadowBlur = 10;
    drawPowerUpOnCanvas(ctx, puX - 12, puY - 12, pu.type, 24);
    ctx.shadowBlur = 0;

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText(pu.emoji, puX - 6, puY + 20);
  }

  // Draw players
  const spriteCache = {};
  const animFrame = Math.floor(Date.now() / 150) % 2; // alternate every 150ms

  for (const pId of Object.keys(gameState)) {
    const p = players.find(pl => pl.id === pId);
    if (!p) continue;

    const state = gameState[pId];
    const lane = p.lane || 0;
    const laneY = trackTop + lane * laneHeight + laneHeight / 2;
    const x = (state.position / 100) * (finishX - 50) + 50;

    // Use animation frame if moving, frame 0 if standing still
    const frame = state.speed > 0.1 ? animFrame : 0;
    const cacheKey = `${p.color}_${frame}`;
    if (!spriteCache[cacheKey]) {
      spriteCache[cacheKey] = generateSprite(p.color, frame);
    }

    const sprite = spriteCache[cacheKey];
    const drawW = SPRITE_WIDTH * PIXEL_SCALE;
    const drawH = SPRITE_HEIGHT * PIXEL_SCALE;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, x - drawW / 2, laneY - drawH / 2, drawW, drawH);

    // Name tag
    const displayName = p.name + (pId === myId ? ' (kamu)' : '');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '8px "Press Start 2P"';
    const nameWidth = ctx.measureText(displayName).width;
    ctx.fillRect(x - nameWidth / 2 - 4, laneY - drawH / 2 - 14, nameWidth + 8, 12);
    ctx.fillStyle = pId === myId ? '#f1c40f' : p.color;
    ctx.fillText(displayName, x - nameWidth / 2, laneY - drawH / 2 - 4);

    // Effect indicators
    for (const effect of state.effects) {
      const emoji = effect.type === 'speed' ? '⚡' :
                    effect.type === 'frozen' ? '🧊' :
                    effect.type === 'slowed' ? '🐌' : '';
      if (emoji) {
        ctx.font = '14px sans-serif';
        ctx.fillText(emoji, x + drawW / 2 + 2, laneY - drawH / 4);
      }
    }

    if (state.finished) {
      ctx.font = '16px sans-serif';
      ctx.fillText('🏁', x + drawW / 2 + 4, laneY);
    }
  }

  // Sun
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(W - 80, 35, 20, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  drawCloud(ctx, 100, 25, 0.8);
  drawCloud(ctx, 350, 15, 0.6);
  drawCloud(ctx, 550, 30, 1);
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 5, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 40 * scale, y, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}
