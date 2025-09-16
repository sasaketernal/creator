let particles = [];
let cnv;

function setup() {
  // crisper exports on HDPI screens
  pixelDensity(Math.min(2, window.devicePixelRatio || 1.5));
  cnv = createCanvas(windowWidth, windowHeight);
  noStroke();

  // Button hook
  const btn = document.getElementById('saveBtn');
  btn.addEventListener('click', captureFrame);
}

function draw() {
  background(0, 40); // translucent background for trails
  for (let p of particles) { p.update(); p.display(); }
  particles = particles.filter(p => p.life > 0);
}

function mousePressed() {
  for (let i = 0; i < random(5, 15); i++) particles.push(new Chaos(mouseX, mouseY));
}

class Chaos {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 6));
    this.size = random(8, 40);
    this.col = [random(255), random(255), random(255), 220];
    this.life = 255;
  }
  update() {
    this.pos.add(this.vel);
    this.life -= 3;
  }
  display() {
    fill(this.col[0], this.col[1], this.col[2], this.life);
    ellipse(this.pos.x, this.pos.y, this.size);

    // occasional text burst
    if (random() < 0.012) {
      push();
      fill(255, this.life);
      textAlign(CENTER, CENTER);
      textSize(random(16, 48));
      text("JUST CREATE", this.pos.x, this.pos.y);
      pop();
    }
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') captureFrame();
}

function captureFrame() {
  // Hide UI so it’s not in the export
  toggleUI(false);
  // draw a subtle watermark in the corner just for the saved image
  push();
  noStroke();
  fill(255, 180);
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  text("#JustCreate • @CreatorCoin", width - 10, height - 10);
  pop();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  saveCanvas(cnv, `just-create-chaos-${ts}`, 'png');

  // Redraw without watermark for live view & restore UI
  redraw();
  setTimeout(() => toggleUI(true), 50);
}

function toggleUI(show) {
  const info = document.getElementById('info');
  const btn = document.getElementById('saveBtn');
  info.style.visibility = show ? 'visible' : 'hidden';
  btn.style.visibility  = show ? 'visible' : 'hidden';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
