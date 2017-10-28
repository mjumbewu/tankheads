function createGame(canvasId) {
  let game = new GameCanvas(canvasId);

  let head1 = new Head('head1a.png', 'head1b.png', 'basketball.png', {
    forwardKey: 'ArrowUp',
    backwardKey: 'ArrowDown',
    leftTurnKey: 'ArrowLeft',
    rightTurnKey: 'ArrowRight',
    launchKey: 'm',
    x: 750,
    y: 200,
    angle: Math.PI
  });
  let head2 = new Head('head2a.png', 'head2b.png', 'laptop.png', {
    forwardKey: 'w',
    backwardKey: 's',
    leftTurnKey: 'a',
    rightTurnKey: 'd',
    launchKey: 'q',
    x: 50,
    y: 200
  });

  game.addSprite(head1);
  game.addSprite(head2);
}

class GameCanvas {
  constructor(canvasId) {
    this.sprites = [];

    // Get the canvas element that everything will be drawn on.
    this.canvas = document.getElementById(canvasId);

    // Redraw the game every 50 miliseconds (20 times per second)
    this.drawinterval = setInterval(() => { this.draw(); }, 50);
  }

  draw() {
    let ctx = this.canvas.getContext('2d');
    ctx.resetTransform();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const sprite of this.sprites) {
      sprite.step();
      sprite.draw(ctx);
    }
  }

  addSprite(sprite, index=null) {
    if (index === null) {
      this.sprites.push(sprite);
    } else {
      this.sprites.splice(index, 0, sprite);
    }
    sprite.game = this;
  }

  removeSprite(sprite) {
    let index = this.sprites.indexOf(sprite);

    // If the sprite is in this game's collection of sprites (the index is not
    // -1), remove it from the collection with `splice`.
    if (index >= 0) { this.sprites.splice(index, 1); }
  }
}

class Sprite {
  constructor(imgsrc, options) {
    /* The options object may contain x, y, w, h */

    this.options = options;

    this.img = new Image();
    this.img.src = imgsrc;

    this.x = options.x || 0;    this.y = options.y || 0;
    this.w = options.w || null; this.h = options.h || null;

    this.angle = options.angle || 0;
    this.direction = this.calcDirFromAngle();

    this.moveSpeed = null;
    this.rotateSpeed = null;

    this.imgLoaded = false;
    this.img.onload = () => {
      this.imgLoaded = true;

      let imgw = this.img.width;
      let imgh = this.img.height;

      if (this.w === null && this.h === null) { this.w = imgw; this.h = imgh; }
      else if (this.w === null) { this.w = this.h / imgh * imgw; }
      else if (this.h === null) { this.h = this.w / imgw * imgh; }
    };
  }

  calcDirFromAngle(angle=null) {
    if (angle === null) { angle = this.angle; }
    return [Math.cos(angle), Math.sin(angle)]
  }

  startMoving(speed) {
    this.moveSpeed = speed;
   }

   startRotating(speed) {
     this.rotateSpeed = speed;
  }

  stopMoving() {
    this.moveSpeed = null;
  }

  stopRotating() {
    this.rotateSpeed = null;
  }

  isMoving() {
    return this.moveSpeed !== null;
  }

  isRotating() {
    return this.rotateSpeed !== null;
  }

  step() {
    if (this.isRotating()) {
      let dir;
      let angle = this.angle;

      // Add a degree (PI / 180 rad) to the angle
      angle += (Math.PI / 180.0) * this.rotateSpeed;

      // Ensure that we always have a rotation speed between 0 and 360
      while (angle < 0) { angle += 2 * Math.PI; }
      angle %= 2 * Math.PI;

      // Calculate a new normal vector based on the angle
      dir = this.calcDirFromAngle(angle);

      this.angle = angle
      this.direction = dir;
    }

    if (this.isMoving()) {
      let dir = this.direction;
      this.x += dir[0] * this.moveSpeed;
      this.y += dir[1] * this.moveSpeed;
    }
  }

  draw(ctx) {
    if (this.imgLoaded) {
      ctx.resetTransform();

      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (this.angle > Math.PI / 2 &&
          this.angle < 3 * Math.PI / 2) {
        ctx.scale(1, -1);
      }

      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
  }
};

class Head extends Sprite {
  constructor(srca, srcb, projectilesrc, options) {
    options = options || {};
    options.w = 60;
    options.h = 75;

    super(srca, options);

    this.normalImg = this.img;

    this.launchingImg = new Image();
    this.launchingImg.src = srcb;

    this.projectileImg = new Image();
    this.projectileImg.src = projectilesrc;

    this.canLaunch = true;

    this.bindKeys();
  }

  // Set up the keys that move the head forward/backward and rotate left/right.
  bindKeys() {
    document.addEventListener('keydown', (evt) => {
      if (evt.key == this.options.forwardKey) { this.startMoving(1); }
      else if (evt.key == this.options.backwardKey) { this.startMoving(-1); }
      else if (evt.key == this.options.rightTurnKey) { this.startRotating(1); }
      else if (evt.key == this.options.leftTurnKey) { this.startRotating(-1); }
      else if (evt.key == this.options.launchKey) { this.startLaunching(); }
    });

    document.addEventListener('keyup', (evt) => {
      if (evt.key == this.options.forwardKey) { this.stopMoving(); }
      else if (evt.key == this.options.backwardKey) { this.stopMoving(); }
      else if (evt.key == this.options.rightTurnKey) { this.stopRotating(); }
      else if (evt.key == this.options.leftTurnKey) { this.stopRotating(); }
      else if (evt.key == this.options.launchKey) { this.stopLaunching(); }
    });
  }

  startMoving(speed) {
    this.moveSpeed = speed;

    if (!this.movingTimer) {
      this.movingTimer = setInterval(() => {
       let dir = this.direction;
       this.x += dir[0] * this.moveSpeed;
       this.y += dir[1] * this.moveSpeed;
       }, 50);
     }
   }

  startLaunching() {
    this.img = this.launchingImg;

    if (this.canLaunch) {
      this.canLaunch = false;

      let p = new Projectile(this.projectileImg.src, {
        x: this.x + (this.w / 2 * this.direction[0]),
        y: this.y + (this.w / 2 * this.direction[1]),
        w: 20,
        h: 20,
        angle: this.angle
      });
      p.startMoving(3)

      // Disallow launching again for 1 sec (1000 miliseconds)
      setTimeout(() => { this.canLaunch = true; }, 1000);

      // Set the projectile to disappear after 7 sec (7000 miliseconds)
      setTimeout(() => { this.game.removeSprite(p); }, 7000);

      this.game.addSprite(p, 0);
    }
  }

  stopLaunching() {
    this.img = this.normalImg;
  }
};

class Projectile extends Sprite {

}
