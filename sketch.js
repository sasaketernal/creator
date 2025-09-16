// ====== STATE ======
let particles = [];
let cnv;

let mode = 'CHAOS';        // 'ZEN' | 'CHAOS'  (motion/behavior)
let theme = 'CHAOS';       // color palette name (independent from mode)
let audioReady = false;
let emojisEnabled = true;

// Visual params (mode-driven)
let BG_TRAIL = 40;
let TEXT_CHANCE = 0.012;
let SPAWN_MIN = 6, SPAWN_MAX = 18;
let SPEED_MIN = 1, SPEED_MAX = 6;

// Current palette applied from THEME_MAP
let PALETTE = [];

// ====== PALETTES ======
const THEME_MAP = {
  'ZEN':    [[180,220,255],[200,255,220],[255,230,200],[210,200,255]],
  'CHAOS':  [[255,70,90],[70,170,255],[255,230,80],[160,255,120],[230,90,255]],
  'NEON':   [[57,255,20],[0,255,255],[255,20,147],[255,255,0],[255,105,180]],
  'SUNSET': [[255,94,77],[255,149,5],[255,214,102],[205,97,85],[255,87,51]],
  'MONO':   [[230,230,230],[180,180,180],[140,140,140],[90,90,90],[255,255,255]],
  'PASTEL': [[255,179,186],[255,223,186],[255,255,186],[186,255,201],[186,225,255]],
};

// ====== EMOJIS ======
const EMOJI_SET = [
  '✨','🔥','💥','🎨','🧪','🌀','🌈','⭐','💫','🎵','🎶','🧩','🖌️','💎','🌟','⚡','🍀','🌸','🧠','🎉'
];
// peluang item emoji: 0..1 (semakin besar semakin sering)
let EMOJI_PROB = 0.35;

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

  osc.freq(baseFreq); osc.start(); env.play(osc);
  setTimeout(() => osc.stop(), (attack+decay+release)*1000 + 20);

  if (mode === 'CHAOS' && random() < 0.35) {
    const noise = new p5.Noise('white');
    const nEnv = new p5.Envelope(0.001, 0.15, 0.05, 0.08);
    noise.start(); nEnv.play(noise);
    setTimeout(() => noise.stop(), 120);
  }
}

// ====== p5 CORE ======
function setup() {
  pixelDensity(Math.min(2, window.devicePixelRatio || 1.5));
  cnv = createCanvas(windowWidth, windowHeight);
  noStroke();

  setMode('CHAOS');
  setTheme('CHAOS');

  // UI hooks
  document.getElementById('saveBtn').addEventListener('click', captureFrame);
  const modeBtn = document.getElementById('modeBtn');
  modeBtn.addEventListener('click', () => {
    setMode(mode === 'ZEN' ? 'CHAOS' : 'ZEN');
    modeBtn.textContent = mode === 'ZEN' ? '🧘 Zen Mode' : '⚡ Chaos Mode';
  });

  const themeSelect = document.getElementById('themeSelect');
  themeSelect.value = theme;
  themeSelect.addEventListener('change', (e) => setTheme(e.target.value));

  const emojiToggle = document.getElementById('emojiToggle');
  emojisEnabled = emojiToggle.checked;
  emojiToggle.addEventListener('change', (e) => {
    emojisEnabled = e.target.checked;
  });
}

function draw() {
  background(0, BG_TRAIL);
  for (let p of particles) { p.update(); p.display(); }
  particles = particles.filter(p => p.life > 0);
}

// Mouse + Touch
function mousePressed() {
  ensureAudio();
  spawnBurst(mouseX, mouseY);
  playClickSound();
}
function touchStarted() {
  ensureAudio();
  spawnBurst(touchX, touchY);
  playClickSound();
  return false;
}

// ====== PARTICLES ======
class Chaos {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(SPEED_MIN, SPEED_MAX));
    this.size = random(12, 44);
    const c = random(PALETTE);
    this.col = [c[0], c[1], c[2], 220];
    this.life = 255;

    // apakah partikel ini emoji?
    this.isEmoji = emojisEnabled && random() < EMOJI_PROB;
    if (this.isEmoji) {
      this.emoji = random(EMOJI_SET);
      this.rotation = random(TWO_PI);
      this.spin = random(-0.04, 0.04);
    }
  }
  update() {
    this.pos.add(this.vel);
    this.life -= mode === 'ZEN' ? 2.1 : 3.2;
    if (this.isEmoji) this.rotation += this.spin;
  }
  display() {
    if (this.isEmoji) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.rotation);
      textAlign(CENTER, CENTER);
      // ukuran emoji mengikuti size
      textSize(this.size * 1.2);
      // gunakan fill putih agar emoji tetap terang di berbagai platform
      fill(255, this.life);
      text(this.emoji, 0, 0);
      pop();
    } else {
      fill(this.col[0], this.col[1], this.col[2], this.life);
      ellipse(this.pos.x, this.pos.y, this.size);
    }

    // sesekali teks JUST CREATE
    if (random() < (mode === 'ZEN' ? TEXT_CHANCE * 0.5 : TEXT_CHANCE)) {
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

// ====== MODE & THEME ======
function setMode(next) {
  mode = next;
  if (mode === 'ZEN') {
    BG_TRAIL = 15;
    TEXT_CHANCE = 0.004;
    SPAWN_MIN = 3; SPAWN_MAX = 8;
    SPEED_MIN = 0.6; SPEED_MAX = 2.5;
    document.body.style.background = '#030b10';
    EMOJI_PROB = 0.25; // sedikit lebih tenang
  } else {
    BG_TRAIL = 40;
    TEXT_CHANCE = 0.012;
    SPAWN_MIN = 6; SPAWN_MAX = 18;
    SPEED_MIN = 1, SPEED_MAX = 6;
    document.body.style.background = '#000';
    EMOJI_PROB = 0.4; // lebih liar
  }
}

function setTheme(name) {
  theme = name in THEME_MAP ? name : 'CHAOS';
  PALETTE = THEME_MAP[theme];
}

// ====== SAVE / WATERMARK ======
function keyPressed() {
  if (key === 's' || key === 'S') captureFrame();
}

function captureFrame() {
  toggleUI(false);
  // Watermark only on export
  push();
  noStroke();
  fill(255, 190);
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  text(`#JustCreate • ${mode} • ${theme} • ${emojisEnabled ? 'EMOJI' : 'NO-EMOJI'} • @CreatorCoin`,
       width - 10, height - 10);
  pop();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  saveCanvas(cnv, `just-create-${mode.toLowerCase()}-${theme.toLowerCase()}-${emojisEnabled?'emoji':'plain'}-${ts}`, 'png');

  redraw();
  setTimeout(() => toggleUI(true), 50);
}

function toggleUI(show) {
  for (const id of ['info', 'saveBtn', 'modeBtn', 'controls']) {
    const el = document.getElementById(id);
    if (el) el.style.visibility = show ? 'visible' : 'hidden';
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
