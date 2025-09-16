// ====== STATE ======
let particles = [];
let cnv;
let mode = 'CHAOS';  // 'ZEN' | 'CHAOS'
let audioReady = false;

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

// ====== AUDIO (p5.sound) ======
function ensureAudio() {
  if (!audioReady) {
    userStartAudio(); // required by browsers on first gesture
    audioReady = true;
  }
}

function playClickSound() {
  // Random short bleep using an oscillator + envelope
  const types = ['sine', 'triangle', 'square', 'sawtooth'];
  const osc = new p5.Oscillator(random(types));
  const env = new p5.Envelope();

  // Random pitch & ADSR tailored to mode
  const baseFreq = mode === 'ZEN' ? random(220, 440) : random(300, 1200);
  const attack  = mode === 'ZEN' ? 0.01 : 0.002;
  const decay   = mode === 'ZEN' ? 0.2  : 0.08;
  const sustain = mode === 'ZEN' ? 0.0  : 0.0;
  const release = mode === 'ZEN' ? 0.25 : 0.12;

  env.setADSR(attack, decay, sustain, release);
  env.setRange(mode === 'ZEN' ? 0.15 : 0.3, 0);

  osc.freq(baseFreq);
  osc.start();
  env.play(osc);

  // Stop oscillator after release
  setTimeout(() => osc.stop(), (attack+decay+release) * 1000 + 20);

  // Optional subtle noise burst in CHAOS
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

  setMode('CHAOS');

  // UI hooks
  document.getElementById('saveBtn').addEventListener('click', captureFrame);
  const modeBtn = document.getElementById('modeBtn');
  modeBtn.addEventListener('click', () => {
    setMode(mode === 'ZEN' ? 'CHAOS' : 'ZEN');
    modeBtn.textContent = mode === 'ZEN' ? '🧘 Zen Mode' : '⚡ Chaos Mode';
  });
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
}
function touchStarted() {
  ensureAudio();
  spawnBurst(touchX, touchY);
  playClickSound();
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
  }
  update() {
    this.pos.add(this.vel);
    this.life -= mode === 'ZEN' ? 2.1 : 3.2;
  }
  display() {
    fill(this.col[0], this.col[1], this.col[2], this.life);
    ellipse(this.pos.x, this.pos.y, this.size);

    // occasional text burst
    if (random() < TEXT_CHANCE) {
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
  for (let i = 0; i < n; i++) particles.push(new Chaos(x, y));
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
  text(`#JustCreate • ${mode} • @CreatorCoin`, width - 10, height - 10);
  pop();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  saveCanvas(cnv, `just-create-${mode.toLowerCase()}-${ts}`, 'png');

  redraw();
  setTimeout(() => toggleUI(true), 50);
}

function toggleUI(show) {
  for (const id of ['info', 'saveBtn', 'modeBtn']) {
    const el = document.getElementById(id);
    if (el) el.style.visibility = show ? 'visible' : 'hidden';
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
