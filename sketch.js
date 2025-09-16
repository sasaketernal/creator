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
  const modeBtn = document.getElementB
