(() => {
  'use strict';

  const W = 1536;
  const H = 864;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loadingEl = document.getElementById('loading');
  const hintEl = document.getElementById('hint');
  const introHelp = document.getElementById('intro-help');
  const debugCoords = document.getElementById('debug-coords');
  const interactBtn = document.getElementById('interact-btn');

  const keys = new Set();
  const images = new Map();
  const playerSheets = { down: null, up: null, left: null, right: null };
  const PLAYER_FRAME_COLS = 4;
  const PLAYER_FRAME_ROWS = 2;
  const PLAYER_FRAME_COUNT = 8;
  const PLAYER_DRAW_HEIGHT = 160;
  const IDLE_FRAME = 0;
  const WALK_SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7];

  let currentSceneId = 'exterior_fechado';
  let currentScene = null;
  let lastTime = performance.now();
  let interactQueued = false;
  let transition = { active: false, alpha: 0, phase: 'idle', target: null };
  let message = '';
  let messageUntil = 0;
  let debug = false;
  let coordDebug = false;
  let hoveredWorld = { x: 0, y: 0 };
  let doorLockUntil = 0;

  const player = {
    x: 768,
    y: 792,
    vx: 0,
    vy: 0,
    dir: 'up',
    lastAxis: 'y',
    moving: false,
    maxSpeed: 168,
    acceleration: 1450,
    braking: 2200,
    anim: IDLE_FRAME,
    walkDistance: 0,
    frameDistance: 18
  };

  const imagePaths = new Set();
  Object.values(window.SCENES).forEach(scene => imagePaths.add(scene.image));
  ['down', 'up', 'left', 'right'].forEach(dir => {
    imagePaths.add(`assets/player/walk_${dir}.webp`);
  });

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        images.set(src, im);
        resolve(im);
      };
      im.onerror = () => reject(new Error(`Não foi possível carregar: ${src}`));
      im.src = src;
    });
  }

  async function preload() {
    await Promise.all([...imagePaths].map(loadImage));

    ['down', 'up', 'left', 'right'].forEach(dir => {
      playerSheets[dir] = images.get(`assets/player/walk_${dir}.webp`);
    });

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    setScene(currentSceneId, window.SCENES[currentSceneId].spawn, false);
    loadingEl.classList.add('is-hidden');
    setTimeout(() => introHelp.classList.add('hide'), 6500);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function setScene(id, spawn, fade = true) {
    currentSceneId = id;
    currentScene = window.SCENES[id];
    const p = spawn || currentScene.spawn;

    player.x = p.x;
    player.y = p.y;
    player.vx = 0;
    player.vy = 0;
    player.dir = p.dir || 'down';
    player.lastAxis = player.dir === 'left' || player.dir === 'right' ? 'x' : 'y';
    player.anim = IDLE_FRAME;
    player.walkDistance = 0;
    player.moving = false;

    doorLockUntil = performance.now() + 420;
    if (!fade) transition.alpha = 0;
  }

  function bodyAt(x, y) {
    // A colisão representa somente os pés. O tronco pode passar visualmente
    // diante de móveis sem o personagem "engasgar" neles.
    const w = currentScene?.playerCollider?.w || 24;
    const h = currentScene?.playerCollider?.h || 12;
    return { x: x - w / 2, y: y - h / 2, w, h };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;
  }

  function rectFromArray(r) {
    return { x: r[0], y: r[1], w: r[2], h: r[3] };
  }

  function feetInsideWalkable(x, y) {
    const list = currentScene.walkable || [];
    if (!list.length) return true;
    return list.some(r =>
      x >= r[0] &&
      x <= r[0] + r[2] &&
      y >= r[1] &&
      y <= r[1] + r[3]
    );
  }

  function validPosition(x, y) {
    const body = bodyAt(x, y);

    if (x < 8 || x > W - 8 || y < 8 || y > H - 8) return false;
    if (!feetInsideWalkable(x, y)) return false;

    return !(currentScene.blocked || []).some(r =>
      rectsOverlap(body, rectFromArray(r))
    );
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(value + amount, target);
    if (value > target) return Math.max(value - amount, target);
    return target;
  }

  function getInputVector() {
    let x = 0;
    let y = 0;

    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;

    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  function updateFacing(input) {
    const ax = Math.abs(input.x);
    const ay = Math.abs(input.y);
    if (ax < 0.01 && ay < 0.01) return;

    // Pequena histerese evita que o sprite fique alternando direção
    // rapidamente quando o jogador anda na diagonal.
    if (ax > ay + 0.12) {
      player.lastAxis = 'x';
    } else if (ay > ax + 0.12) {
      player.lastAxis = 'y';
    }

    if (player.lastAxis === 'x' && ax > 0.01) {
      player.dir = input.x < 0 ? 'left' : 'right';
    } else if (ay > 0.01) {
      player.dir = input.y < 0 ? 'up' : 'down';
    }
  }

  function moveWithCollisions(dx, dy) {
    // Passos pequenos impedem atravessar móveis quando o FPS cai.
    const maxStep = 4;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
    const sx = dx / steps;
    const sy = dy / steps;
    let movedX = 0;
    let movedY = 0;

    for (let i = 0; i < steps; i++) {
      if (Math.abs(sx) > 0.0001) {
        const nx = player.x + sx;
        if (validPosition(nx, player.y)) {
          player.x = nx;
          movedX += sx;
        } else {
          player.vx = 0;
        }
      }

      if (Math.abs(sy) > 0.0001) {
        const ny = player.y + sy;
        if (validPosition(player.x, ny)) {
          player.y = ny;
          movedY += sy;
        } else {
          player.vy = 0;
        }
      }
    }

    return Math.hypot(movedX, movedY);
  }

  function updateMovement(dt) {
    const input = getInputVector();
    updateFacing(input);

    const hasInput = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01;
    const targetVX = input.x * player.maxSpeed;
    const targetVY = input.y * player.maxSpeed;

    const xRate = Math.abs(input.x) > 0.01 ? player.acceleration : player.braking;
    const yRate = Math.abs(input.y) > 0.01 ? player.acceleration : player.braking;

    player.vx = approach(player.vx, targetVX, xRate * dt);
    player.vy = approach(player.vy, targetVY, yRate * dt);

    if (!hasInput && Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) {
      player.vx = 0;
      player.vy = 0;
    }

    const moved = moveWithCollisions(player.vx * dt, player.vy * dt);
    player.moving = moved > 0.08;

    if (player.moving) {
      player.walkDistance += moved;
      const phase = Math.floor(player.walkDistance / player.frameDistance) % WALK_SEQUENCE.length;
      player.anim = WALK_SEQUENCE[phase];
    } else {
      player.anim = IDLE_FRAME;
      if (!hasInput) player.walkDistance = 0;
    }
  }

  function pointRectDistance(px, py, r) {
    const nearestX = Math.max(r.x, Math.min(px, r.x + r.w));
    const nearestY = Math.max(r.y, Math.min(py, r.y + r.h));
    return Math.hypot(px - nearestX, py - nearestY);
  }

  function getNearbyDoor() {
    if (!currentScene || performance.now() < doorLockUntil) return null;

    let best = null;
    let bestDistance = Infinity;

    for (const door of currentScene.doors || []) {
      const distance = pointRectDistance(player.x, player.y, door);
      const radius = door.radius ?? currentScene.interactionRadius ?? 82;

      if (distance <= radius && distance < bestDistance) {
        best = door;
        bestDistance = distance;
      }
    }

    return best;
  }

  function interact() {
    if (transition.active || performance.now() < doorLockUntil) return;

    const door = getNearbyDoor();
    if (!door) return;

    if (door.action === 'openGate') {
      startTransition(() => {
        setScene('exterior_aberto', { x: player.x, y: player.y, dir: 'up' }, false);
      });
      return;
    }

    if (door.action === 'unavailable') {
      showMessage('Este cômodo ainda não foi adicionado ao protótipo.', 1900);
      return;
    }

    if (door.target) {
      startTransition(() => setScene(door.target, door.spawn, false));
    }
  }

  function startTransition(swapFn) {
    player.vx = 0;
    player.vy = 0;
    player.moving = false;
    transition.active = true;
    transition.phase = 'out';
    transition.alpha = 0;
    transition.target = swapFn;
  }

  function updateTransition(dt) {
    if (!transition.active) return;

    const rate = 5.6;

    if (transition.phase === 'out') {
      transition.alpha = Math.min(1, transition.alpha + dt * rate);

      if (transition.alpha >= 1) {
        if (transition.target) transition.target();
        transition.target = null;
        transition.phase = 'in';
      }
    } else {
      transition.alpha = Math.max(0, transition.alpha - dt * rate);

      if (transition.alpha <= 0) {
        transition.active = false;
        transition.phase = 'idle';
      }
    }
  }

  function showMessage(text, ms = 1400) {
    message = text;
    messageUntil = performance.now() + ms;
  }

  function update(dt) {
    updateTransition(dt);

    // Não movimenta o personagem durante o fade. Isso evita teleporte,
    // interação dupla e passos "fantasmas" ao trocar de ambiente.
    if (!transition.active) {
      updateMovement(dt);
    } else {
      player.vx = 0;
      player.vy = 0;
      player.moving = false;
      player.anim = IDLE_FRAME;
    }

    if (interactQueued) {
      interactQueued = false;
      interact();
    }
  }

  function drawScene() {
    const bg = images.get(currentScene.image);
    ctx.drawImage(bg, 0, 0, W, H);
  }

  function getPlayerMetrics() {
    const sheet = playerSheets[player.dir];
    if (!sheet) return null;

    const frameW = sheet.width / PLAYER_FRAME_COLS;
    const frameH = sheet.height / PLAYER_FRAME_ROWS;
    const h = currentScene.playerHeight || PLAYER_DRAW_HEIGHT;
    const w = h * (frameW / frameH);

    return { sheet, frameW, frameH, w, h };
  }

  function drawPlayerShadow() {
    const metrics = getPlayerMetrics();
    if (!metrics) return;

    const shadowW = Math.max(24, metrics.w * 0.34);
    const shadowH = Math.max(8, metrics.h * 0.055);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.20)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 1, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const metrics = getPlayerMetrics();
    if (!metrics) return;

    const frame = Math.max(0, Math.min(PLAYER_FRAME_COUNT - 1, player.anim));
    const sx = (frame % PLAYER_FRAME_COLS) * metrics.frameW;
    const sy = Math.floor(frame / PLAYER_FRAME_COLS) * metrics.frameH;

    drawPlayerShadow();
    ctx.drawImage(
      metrics.sheet,
      sx, sy, metrics.frameW, metrics.frameH,
      player.x - metrics.w / 2, player.y - metrics.h,
      metrics.w, metrics.h
    );
  }

  function drawDebug() {
    if (!debug) return;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.font = '16px ui-monospace, monospace';

    ctx.fillStyle = 'rgba(37, 223, 136, .10)';
    ctx.strokeStyle = 'rgba(37, 223, 136, .9)';
    (currentScene.walkable || []).forEach((r, i) => {
      ctx.fillRect(...r);
      ctx.strokeRect(...r);
      ctx.fillStyle = '#55ffaf';
      ctx.fillText(`W${i}`, r[0] + 5, r[1] + 20);
      ctx.fillStyle = 'rgba(37, 223, 136, .10)';
    });

    ctx.fillStyle = 'rgba(255, 68, 68, .18)';
    ctx.strokeStyle = 'rgba(255, 90, 90, .95)';
    (currentScene.blocked || []).forEach((r, i) => {
      ctx.fillRect(...r);
      ctx.strokeRect(...r);
      ctx.fillStyle = '#ff9b9b';
      ctx.fillText(`B${i}`, r[0] + 5, r[1] + 20);
      ctx.fillStyle = 'rgba(255,68,68,.18)';
    });

    ctx.fillStyle = 'rgba(80, 150, 255, .22)';
    ctx.strokeStyle = 'rgba(110, 180, 255, 1)';
    (currentScene.doors || []).forEach((d, i) => {
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#cde3ff';
      ctx.fillText(`D${i}`, d.x + 5, d.y + 20);
      ctx.fillStyle = 'rgba(80,150,255,.22)';
    });

    const body = bodyAt(player.x, player.y);
    ctx.strokeStyle = '#ffff55';
    ctx.strokeRect(body.x, body.y, body.w, body.h);

    ctx.fillStyle = '#fff';
    ctx.fillText(`x:${Math.round(player.x)} y:${Math.round(player.y)}`, player.x + 16, player.y - 16);
    ctx.restore();
  }

  function drawOverlay() {
    const now = performance.now();
    const door = getNearbyDoor();

    if (message && now < messageUntil) {
      hintEl.innerHTML = message;
      hintEl.classList.add('is-visible');
    } else if (door && !transition.active) {
      hintEl.innerHTML = `<kbd>E</kbd>${door.label || 'Interagir'}`;
      hintEl.classList.add('is-visible');
    } else {
      hintEl.classList.remove('is-visible');
    }

    if (transition.alpha > 0) {
      ctx.fillStyle = `rgba(8,7,6,${transition.alpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function render() {
    drawScene();
    drawPlayer();
    drawDebug();
    drawOverlay();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.025);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', e => {
    const prevent = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'
    ];

    if (prevent.includes(e.code)) e.preventDefault();

    keys.add(e.code);

    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      interactQueued = true;
    }

    if (e.code === 'F2' && !e.repeat) {
      e.preventDefault();
      debug = !debug;
    }

    if (e.code === 'F3' && !e.repeat) {
      e.preventDefault();
      coordDebug = !coordDebug;
      debugCoords.hidden = !coordDebug;
    }
  });

  window.addEventListener('keyup', e => keys.delete(e.code));

  window.addEventListener('blur', () => {
    keys.clear();
    player.vx = 0;
    player.vy = 0;
  });

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    hoveredWorld.x = Math.round((e.clientX - r.left) / r.width * W);
    hoveredWorld.y = Math.round((e.clientY - r.top) / r.height * H);

    if (coordDebug) {
      debugCoords.textContent = `${currentSceneId}  x:${hoveredWorld.x} y:${hoveredWorld.y}`;
    }
  });

  document.querySelectorAll('.touch-btn').forEach(btn => {
    const code = btn.dataset.key;

    const down = e => {
      e.preventDefault();
      keys.add(code);
      btn.classList.add('is-held');
      btn.setPointerCapture?.(e.pointerId);
    };

    const up = e => {
      e.preventDefault();
      keys.delete(code);
      btn.classList.remove('is-held');
    };

    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  });

  interactBtn?.addEventListener('pointerdown', e => {
    e.preventDefault();
    interactQueued = true;
  });

  preload().catch(err => {
    console.error(err);
    loadingEl.querySelector('p').textContent = 'Erro ao carregar os arquivos do jogo.';
  });
})();