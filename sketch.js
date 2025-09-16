// ====== STATE ======
let particles = [];
let cnv;
let mode = 'CHAOS';  // 'ZEN' | 'CHAOS'
let audioReady = false;

let clickCount = 0;
let ATTRACTOR_ACTIVE = false;
let targets = [];            // array of {x, y}
let targetGraphic;           // offscreen buffer used to sample text
const AUTO_ACTIVATE_AFTER = 20;  // clicks/taps before auto-attractor

// Font
let bebasFont; // loaded in preload()

// Visual params (auto-updated by setMode)
let BG_TRAIL = 40;
let TEXT_CHANCE = 0.012;
let SPAWN_MIN = 5, SPAWN_MAX = 15;
let SPEED_MIN = 1, SPEED_MAX = 6;
let PALETTE = [];

// Palettes
const ZEN_PALETTE = [
  [180, 220, 255], [200, 255, 220], [255, 230, 200], [210, 200, 255]
];
const CHAOS_PALETTE = [
  [255, 70, 90], [70, 170, 255], [255, 230, 80], [160, 255, 120], [230, 90, 255]
];

// ====== PRELOAD (load Bebas Neue for attractor text) ======
function preload() {
  // Direct woff2 (Google Fonts CDN). p5 will fetch this cross-origin just fine.
  bebasFont = loadFont('https://fonts.gstatic.com/s/bebasneue/v20/JTUSjIg1_i6t8kCHKm45_QpRyS7h.woff2');
}

// ====== AUDIO (p5.sound) ======
function ensureAudio() {
  if (!audioReady) {
    userStartAudio(); // required by browsers on first gesture
    audioReady = true;
  }
}
function playClickSound() {
  const types = ['sine', 'triangle', 'square', 'sawtooth'];
  const osc = new p5.Oscillator(random(types));
  const env = new p5.Envelope();

  const baseFreq = mode === 'ZEN' ? random(220, 440) : random(300, 1200);
  const attack  = mode === 'ZEN' ? 0.01 : 0.002;
  const decay   = mode === 'ZEN' ? 0.2  : 0.08;
  const release = mode === 'ZEN' ? 0.25 : 0.12;

  env.setADSR(attack, decay, 0.0, release);
  env.setRange(mode === 'ZEN' ? 0.15 : 0.3, 0);

  osc.freq(baseFreq);
  osc.start();
  env.play(osc);
  setTimeout(() => osc.stop(), (attack+decay+release) * 1000 + 20);

  if (mode === 'CHAOS' && random() < 0.35) {
    const noise = new p5.Noise('white');
    const nEnv = new p5.Envelope(0.001, 0.15, 0.05, 0.08);
    noise.start();
    nEnv.play(noise);
    setTimeout(() => noise.stop(), 120);
  }
}

// ====== p5 CORE ======
function setup() {
  pixelDensity(Math.min(2, window.devicePixelRatio || 1.5));
  cnv = createCanvas(windowWidth, windowHeight);
  noStroke();

  // offscreen buffer for target text
  targetGraphic = createGraphics(windowWidth, windowHeight);

  setMode('CHAOS');
  buildTargets(); // precompute target points

  // UI hooks
  document.getElementById('saveBtn').addEventListener('click', captureFrame);
  const modeBtn = document.getElementById('modeBtn');
  modeBtn.addEventListener('click', () => {
    setMode(mode === 'ZEN' ? 'CHAOS' : 'ZEN');
    modeBtn.textContent = mode === 'ZEN' ? '🧘 Zen Mode' : '⚡ Chaos Mode';
  });

  document.getElementById('attractBtn').addEventListener('click', activateAttractor);
}

function draw() {
  background(0, BG_TRAIL);
  for (let p of particles) { p.update(); p.display(); }
  particles = particles.filter(p => p.life > 0);
}

// Mouse + Touch support
function mousePressed() {
  ensureAudio();
  spawnBurst(mouseX, mouseY);
  playClickSound();

  clickCount++;
  if (!ATTRACTOR_ACTIVE && clickCount >= AUTO_ACTIVATE_AFTER) activateAttractor();
}
function touchStarted() {
  ensureAudio();
  spawnBurst(touchX, touchY);
  playClickSound();

  clickCount++;
  if (!ATTRACTOR_ACTIVE && clickCount >= AUTO_ACTIVATE_AFTER) activateAttractor();
  return false; // prevent scroll on mobile
}

// ====== PARTICLES ======
class Chaos {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(SPEED_MIN, SPEED_MAX));
    this.size = random(8, 40);
    const c = random(PALETTE);
    this.col = [c[0], c[1], c[2], 220];
    this.life = 255;

    // target info for attractor
    this.target = null;
  }

  assignTarget(t) {
    if (t) this.target = createVector(t.x, t.y);
  }

  steerToTarget() {
    if (!this.target) return;
    const desired = p5.Vector.sub(this.target, this.pos);
    const dist = desired.mag();
    if (dist < 2) {
      this.vel.mult(0.85); // settle gently
      return;
    }
    desired.normalize();
    desired.mult(mode === 'ZEN' ? 1.2 : 2.2);
    this.vel = p5.Vector.lerp(this.vel, desired, mode === 'ZEN' ? 0.06 : 0.12);
    this.vel.limit(mode === 'ZEN' ? 2.2 : 3.2);
  }

  update() {
    if (ATTRACTOR_ACTIVE) this.steerToTarget();
    this.pos.add(this.vel);
    const decay = ATTRACTOR_ACTIVE ? (mode === 'ZEN' ? 1.4 : 1.8) : (mode === 'ZEN' ? 2.1 : 3.2);
    this.life -= decay;
  }

  display() {
    fill(this.col[0], this.col[1], this.col[2], this.life);
    ellipse(this.pos.x, this.pos.y, this.size);

    if (!ATTRACTOR_ACTIVE && random() < TEXT_CHANCE) {
      push();
      fill(255, this.life);
      textAlign(CENTER, CENTER);
      textSize(random(16, 48));
      text("JUST CREATE", this.pos.x, this.pos.y);
      pop();
    }
  }
}

function spawnBurst(x, y) {
  const n = floor(random(SPAWN_MIN, SPAWN_MAX));
  for (let i = 0; i < n; i++) {
    const p = new Chaos(x, y);
    if (ATTRACTOR_ACTIVE) p.assignTarget(nextTarget());
    particles.push(p);
  }
}

// ====== MODE CONTROL ======
function setMode(next) {
  mode = next;
  if (mode === 'ZEN') {
    BG_TRAIL = 15;          // stronger persistence = smoother trails
    TEXT_CHANCE = 0.004;    // fewer text bursts
    SPAWN_MIN = 3; SPAWN_MAX = 8;
    SPEED_MIN = 0.6; SPEED_MAX = 2.5;
    PALETTE = ZEN_PALETTE;
    document.body.style.background = '#030b10';
  } else {
    BG_TRAIL = 40;          // faster fade = punchier motion
    TEXT_CHANCE = 0.012;    // frequent text bursts
    SPAWN_MIN = 6; SPAWN_MAX = 18;
    SPEED_MIN = 1; SPEED_MAX = 6;
    PALETTE = CHAOS_PALETTE;
    document.body.style.background = '#000';
  }
}

// ====== ATTRACTOR (build points from "JUST CREATE") ======
function buildTargets() {
  targets = [];
  targetGraphic.clear();
  targetGraphic.pixelDensity(1); // predictable sampling

  // scale text relative to viewport
  const big = min(width, height);
  const titleSize = big * 0.22;     // first line "JUST"
  const subtitleSize = big * 0.22;  // second line "CREATE"
  const gap = big * 0.05;

  targetGraphic.push();
  targetGraphic.background(0, 0); // fully transparent
  targetGraphic.fill(255);
  targetGraphic.noStroke();
  targetGraphic.textAlign(CENTER, CENTER);

  // === Use Bebas Neue for the attractor text ===
  targetGraphic.textFont(bebasFont);

  targetGraphic.textSize(titleSize);
  targetGraphic.text('JUST', width / 2, height / 2 - subtitleSize / 2 - gap / 2);

  targetGraphic.textSize(subtitleSize);
  targetGraphic.text('CREATE', width / 2, height / 2 + titleSize / 2 + gap / 2);
  targetGraphic.pop();

  targetGraphic.loadPixels();

  // Sample pixels to get points on the letters
  const step = floor(constrain(big * 0.01, 5, 12)); // sampling step based on size
  for (let y = 0; y < targetGraphic.height; y += step) {
    for (let x = 0; x < targetGraphic.width; x += step) {
      const idx = 4 * (y * targetGraphic.width + x);
      const alpha = targetGraphic.pixels[idx + 3];
      if (alpha > 128) { // on the letters
        targets.push({ x, y });
      }
    }
  }

  shuffleArray(targets);
}

function activateAttractor() {
  if (ATTRACTOR_ACTIVE) return;
  ATTRACTOR_ACTIVE = true;

  if (targets.length === 0) buildTargets();

  for (let i = 0; i < particles.length; i++) {
    particles[i].assignTarget(nextTarget());
  }

  // Small congratulatory bleep
  ensureAudio();
  const osc = new p5.Oscillator('triangle');
  const env = new p5.Envelope(0.01, 0.25, 0.1, 0.4);
  osc.freq(520);
  osc.start();
  env.play(osc);
  setTimeout(() => osc.stop(), 600);
}

let targetIndex = 0;
function nextTarget() {
  if (targets.length === 0) return null;
  const t = targets[targetIndex % targets.length];
  targetIndex++;
  return t;
}

// ====== SAVE / WATERMARK ======
function keyPressed() {
  if (key === 's' || key === 'S') captureFrame();
}
function captureFrame() {
  toggleUI(false);
  // Watermark only on exported image
  push();
  noStroke();
  fill(255, 180);
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  const tag = ATTRACTOR_ACTIVE ? 'FORMED' : mode;
  text(`#JustCreate • ${tag} • @CreatorCoin`, width - 10, height - 10);
  pop();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  saveCanvas(cnv, `just-create-${tag.toLowerCase()}-${ts}`, 'png');

  redraw();
  setTimeout(() => toggleUI(true), 50);
}

function toggleUI(show) {
  for (const id of ['info', 'saveBtn', 'modeBtn', 'attractBtn']) {
    const el = document.getElementById(id);
    if (el) el.style.visibility = show ? 'visible' : 'hidden';
  }
}

// ====== UTIL ======
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildTargets(); // rebuilt with Bebas Neue at new size
  targetIndex = 0;
  if (ATTRACTOR_ACTIVE) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].assignTarget(nextTarget());
    }
  }
}

// Fisher–Yates shuffle
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
