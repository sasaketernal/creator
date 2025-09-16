let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}

function draw() {
  background(0, 40); // translucent to leave trails

  // update & draw particles
  for (let p of particles) {
    p.update();
    p.display();
  }

  // clean up offscreen
  particles = particles.filter(p => p.life > 0);
}

function mousePressed() {
  for (let i = 0; i < random(5, 15); i++) {
    particles.push(new Chaos(mouseX, mouseY));
  }
}

class Chaos {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 6));
    this.size = random(8, 40);
    this.col = [random(255), random(255), random(255), 200];
    this.life = 255;
  }
  update() {
    this.pos.add(this.vel);
    this.life -= 3;
  }
  display() {
    fill(this.col[0], this.col[1], this.col[2], this.life);
    ellipse(this.pos.x, this.pos.y, this.size);
    if (random() < 0.01) {
      fill(255, this.life);
      textSize(random(16, 48));
      text("JUST CREATE", this.pos.x, this.pos.y);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
