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
  const playerFrames = { down: [], up: [], left: [], right: [] };

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

  const player = {
    x: 768,
    y: 792,
    dir: 'up',
    moving: false,
    speed: 190,
    anim: 1,
    animClock: 0,
    frameDuration: 0.12
  };

  const imagePaths = new Set();
  Object.values(window.SCENES).forEach(scene => imagePaths.add(scene.image));
  ['down','up','left','right'].forEach(dir => {
    for (let i = 0; i < 3; i++) imagePaths.add(`assets/player/${dir}_${i}.png`);
  });

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { images.set(src, im); resolve(im); };
      im.onerror = () => reject(new Error(`Não foi possível carregar: ${src}`));
      im.src = src;
    });
  }

  async function preload() {
    await Promise.all([...imagePaths].map(loadImage));
    ['down','up','left','right'].forEach(dir => {
      for (let i = 0; i < 3; i++) playerFrames[dir][i] = images.get(`assets/player/${dir}_${i}.png`);
    });
    setScene(currentSceneId, window.SCENES[currentSceneId].spawn, false);
    loadingEl.classList.add('is-hidden');
    setTimeout(() => introHelp.classList.add('hide'), 6500);
    requestAnimationFrame(loop);
  }

  function setScene(id, spawn, fade = true) {
    currentSceneId = id;
    currentScene = window.SCENES[id];
    const p = spawn || currentScene.spawn;
    player.x = p.x;
    player.y = p.y;
    player.dir = p.dir || 'down';
    player.anim = 1;
    player.animClock = 0;
    if (!fade) transition.alpha = 0;
  }

  function bodyAt(x, y) {
    return { x: x - 14, y: y - 10, w: 28, h: 18 };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function rectFromArray(r) { return { x:r[0], y:r[1], w:r[2], h:r[3] }; }

  function bodyInsideWalkable(body) {
    const list = currentScene.walkable || [];
    if (!list.length) return true;
    // O ponto dos pés é o que precisa permanecer numa zona caminhável.
    const px = body.x + body.w / 2;
    const py = body.y + body.h / 2;
    return list.some(r => px >= r[0] && px <= r[0]+r[2] && py >= r[1] && py <= r[1]+r[3]);
  }

  function validPosition(x, y) {
    const body = bodyAt(x, y);
    if (x < 8 || x > W - 8 || y < 8 || y > H - 8) return false;
    if (!bodyInsideWalkable(body)) return false;
    return !(currentScene.blocked || []).some(r => rectsOverlap(body, rectFromArray(r)));
  }

  function movePlayer(dx, dy, dt) {
    if (!dx && !dy) { player.moving = false; return; }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const speed = player.speed * dt;

    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
    else player.dir = dy < 0 ? 'up' : 'down';

    // Eixos separados deixam o personagem deslizar ao longo dos objetos sem atravessá-los.
    const nx = player.x + dx * speed;
    if (validPosition(nx, player.y)) player.x = nx;
    const ny = player.y + dy * speed;
    if (validPosition(player.x, ny)) player.y = ny;

    player.moving = true;
  }

  function getInputVector() {
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    return { x, y };
  }

  function getNearbyDoor() {
    const body = bodyAt(player.x, player.y);
    const expanded = { x: body.x - 28, y: body.y - 28, w: body.w + 56, h: body.h + 56 };
    return (currentScene.doors || []).find(d => rectsOverlap(expanded, d)) || null;
  }

  function interact() {
    if (transition.active) return;
    const door = getNearbyDoor();
    if (!door) return;

    if (door.action === 'openGate') {
      startTransition(() => setScene('exterior_aberto', { x: player.x, y: player.y, dir: 'up' }, false));
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
    transition.active = true;
    transition.phase = 'out';
    transition.alpha = 0;
    transition.target = swapFn;
  }

  function updateTransition(dt) {
    if (!transition.active) return;
    const rate = 4.8;
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
    if (!transition.active || transition.phase === 'in') {
      const v = getInputVector();
      movePlayer(v.x, v.y, dt);
    } else {
      player.moving = false;
    }

    if (player.moving) {
      player.animClock += dt;
      if (player.animClock >= player.frameDuration) {
        player.animClock %= player.frameDuration;
        player.anim = player.anim === 0 ? 2 : 0;
      }
    } else {
      player.anim = 1;
      player.animClock = 0;
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

  function drawPlayer() {
    const im = playerFrames[player.dir][player.anim];
    if (!im) return;
    const scale = currentScene.playerScale || 0.145;
    const h = im.height * scale;
    const w = im.width * scale;
    // x/y representam a posição dos pés.
    ctx.drawImage(im, player.x - w/2, player.y - h, w, h);
  }

  function drawDebug() {
    if (!debug) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.font = '16px ui-monospace, monospace';

    ctx.fillStyle = 'rgba(37, 223, 136, .10)';
    ctx.strokeStyle = 'rgba(37, 223, 136, .9)';
    (currentScene.walkable || []).forEach((r, i) => {
      ctx.fillRect(...r); ctx.strokeRect(...r);
      ctx.fillStyle = '#55ffaf'; ctx.fillText(`W${i}`, r[0]+5, r[1]+20); ctx.fillStyle = 'rgba(37, 223, 136, .10)';
    });

    ctx.fillStyle = 'rgba(255, 68, 68, .18)';
    ctx.strokeStyle = 'rgba(255, 90, 90, .95)';
    (currentScene.blocked || []).forEach((r, i) => {
      ctx.fillRect(...r); ctx.strokeRect(...r);
      ctx.fillStyle = '#ff9b9b'; ctx.fillText(`B${i}`, r[0]+5, r[1]+20); ctx.fillStyle = 'rgba(255,68,68,.18)';
    });

    ctx.fillStyle = 'rgba(80, 150, 255, .22)';
    ctx.strokeStyle = 'rgba(110, 180, 255, 1)';
    (currentScene.doors || []).forEach((d, i) => {
      ctx.fillRect(d.x,d.y,d.w,d.h); ctx.strokeRect(d.x,d.y,d.w,d.h);
      ctx.fillStyle = '#cde3ff'; ctx.fillText(`D${i}`, d.x+5, d.y+20); ctx.fillStyle = 'rgba(80,150,255,.22)';
    });

    const body = bodyAt(player.x, player.y);
    ctx.strokeStyle = '#ffff55';
    ctx.strokeRect(body.x, body.y, body.w, body.h);
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
      ctx.fillRect(0,0,W,H);
    }
  }

  function render() {
    drawScene();
    drawPlayer();
    drawDebug();
    drawOverlay();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.035);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    const movement = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];
    if (movement.includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) interactQueued = true;
    if (e.code === 'F2' && !e.repeat) { e.preventDefault(); debug = !debug; }
    if (e.code === 'F3' && !e.repeat) { e.preventDefault(); coordDebug = !coordDebug; debugCoords.hidden = !coordDebug; }
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    hoveredWorld.x = Math.round((e.clientX - r.left) / r.width * W);
    hoveredWorld.y = Math.round((e.clientY - r.top) / r.height * H);
    if (coordDebug) debugCoords.textContent = `${currentSceneId}  x:${hoveredWorld.x} y:${hoveredWorld.y}`;
  });

  document.querySelectorAll('.touch-btn').forEach(btn => {
    const code = btn.dataset.key;
    const down = (e) => { e.preventDefault(); keys.add(code); btn.classList.add('is-held'); btn.setPointerCapture?.(e.pointerId); };
    const up = (e) => { e.preventDefault(); keys.delete(code); btn.classList.remove('is-held'); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });

  interactBtn?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    interactQueued = true;
  });

  preload().catch(err => {
    console.error(err);
    loadingEl.querySelector('p').textContent = 'Erro ao carregar os arquivos do jogo.';
  });
})();
