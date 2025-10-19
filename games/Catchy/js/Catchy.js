import { audio } from './audio.js';
import { noodlemath } from './math.js';
import { perlin } from './perlin.js';

const RED = '#F35F61';
const ORANGE = '#f19741ff';
const YELLOW = '#F2E641';
const GREEN = '#41F28D';
const BLUE = '#00AAF3';
const BROWN = '#554242';
const BROWN_50 = '#816565';
const WHITE = '#FFFFFF';
const BLACK_R = '#160a0aff';
const BLACK_B = '#0c0a16ff';

const canvas = document.getElementById('gameCanvas');

const CATCHER_HEIGHT = 20;
const CATCHER_WIDTH = 100;
const CATCHER_Y = canvas.height - 140;
const KEYBOARD_SPEED = 450;
const STREAM_WIDTH = 300; // Max horizontal deviation of the spawner
const FALL_SPEED = 100; // units per second
const SPAWN_RATE = 0.5 * 1000; // Spawn a new object every 80 milliseconds
const GROUND_LEVEL = canvas.height - 10;


export class Game {
    constructor() {
        this.gameActive = true;
        this.score = 0;
        this.lives = 5;

        this.paddle = new PlayerPaddle(canvas.width / 2, canvas.height - 140, BLUE);
        this.spawner = new ObjectSpawner(this, canvas.width / 2, 20);
        this.fallingObjects = [];
        this.particleObjects = [];
        this.background = new Background();
        this.cameraShaker = new CameraShaker();

        this.currentTime = 0;

        this.scoreDisplay = document.getElementById('score-display');
        this.livesDisplay = document.getElementById('lives-display');

        this._updateScore();

        this.onGameOver = () => { };
    }

    _updateScore() {
        this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        this.livesDisplay.textContent = `LIVES: ${this.lives}`;
    }

    update(deltaTime) {
        audio.playedThisFrame = false;

        this.currentTime += deltaTime;

        this.cameraShaker.update(deltaTime);


        this.background.update(deltaTime);
        this.paddle.update(deltaTime);
        this.spawner.update(deltaTime);
        this.fallingObjects.forEach(o => o.update(deltaTime));
        this.particleObjects.forEach(o => o.update(deltaTime));

        this.checkCollisions();
    }

    draw(ctx) {
        this.cameraShaker.draw(ctx);


        this.background.draw(ctx);
        this.paddle.draw(ctx);
        this.spawner.draw(ctx);
        this.fallingObjects.forEach(o => o.draw(ctx));
        this.particleObjects.forEach(o => o.draw(ctx));
    }

    endGame() {
        this.onGameOver();
    }

    spawnParticle(x, y, color) {
        const newParticle = new ParticleObject(x, y, color, () => {
            this.particleObjects.splice(this.particleObjects.indexOf(newParticle), 1);
        });

        this.particleObjects.push(newParticle);
    }

    checkCollisions() {
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];

            const x_dist = Math.abs(obj.x - this.paddle.x);
            const y_dist = Math.abs(obj.y - this.paddle.y);

            const collision_threshold_x = (this.paddle.width / 2) + obj.radius;
            const collision_threshold_y = (this.paddle.height / 2) + obj.radius;
            if (x_dist < collision_threshold_x && y_dist < collision_threshold_y) {
                // CATCH!

                if (obj.color == RED) {
                    audio.playHurtSound(this.currentTime);
                    this.cameraShaker.begin(0.2);
                    this.paddle.flash(RED);

                    this.lives--;
                    this._updateScore();
                    if (this.lives <= 0) {
                        this.endGame();
                        break;
                    }
                }
                else if (obj.color == YELLOW) {
                    audio.playCoinSound(this.currentTime);
                    this.score++;

                    if (this.score % 10 == 0) {
                        this.lives++;
                    }
                    this._updateScore();

                    this.paddle.flash(YELLOW);
                }
                else {
                    audio.playCatchSound(this.currentTime);
                    this.lives++;
                    this._updateScore();

                    // Flash effect on catcher
                    this.paddle.flash(WHITE);
                }

                const removedObjects = this.fallingObjects.splice(i, 1);
                removedObjects.forEach(removed => {
                    this.spawnParticle(removed.x, removed.y, removed.color);
                });

            }
            else if (obj.y > GROUND_LEVEL) {
                // if (obj.color == RED) {
                //     //this.lives--;
                //     this._updateScore();
                //     this.cameraShaker.begin(0.2);
                // }

                const removedObjects = this.fallingObjects.splice(i, 1);
                removedObjects.forEach(removed => {
                    console.log(removed.color);

                    this.spawnParticle(removed.x, removed.y, removed.color);
                });

                audio.playMissSound(this.currentTime);

                if (this.lives <= 0) {
                    this.endGame();
                    break;
                }
            }
        }
    }
}

export class FallingObject {
    constructor(x, y, radius, speed, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.speed = speed;
        this.color = color;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }

    draw(ctx) {

        if (this.color == RED) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.radius, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            if (this.radius < 10) {
                ctx.lineWidth = 2;
            }
            else {

                ctx.lineWidth = 4;
            }
            ctx.stroke();
            ctx.closePath();
            return;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        if (this.radius < 10) {
            ctx.lineWidth = 2;
        }
        else {

            ctx.lineWidth = 4;
        }
        ctx.stroke();
        ctx.closePath();
    }
}

export class ParticleObject {
    constructor(x, y, color, onComplete) {
        this.x = x;
        this.y = y;

        this.color = color;
        this.radius = 15;

        this.progress = 0;
        this.lifetime = 0.1 + (Math.random() * 0.2);

        this.onComplete = onComplete;
    }

    update(deltaTime) {
        this.progress += deltaTime;

        if (this.progress >= this.lifetime) {
            this.onComplete();
        }
    }

    draw(ctx) {
        ctx.beginPath();

        let scale = this.progress / this.lifetime;
        if (scale >= 1) {
            scale = 1;
        }
        ctx.globalAlpha = 1 - scale;
        ctx.fillStyle = this.color;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * scale;
        ctx.arc(this.x, this.y, this.radius + (this.radius * scale), 0, Math.PI * 2);

        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = 1;
    }
}

export class ObjectSpawner {
    constructor(game, x, y) {
        this.game = game;
        this.color = GREEN;

        this.currentTime = 0;
        this.lastSpawnTime = 0;
        this.x = x;
        this.y = 10;
    }

    update(deltaTime) {
        this.currentTime += deltaTime;
        const noise = Math.abs(perlin.get(this.currentTime * this.currentTime, this.currentTime)) * 0.5;
        const levelIntensity = noise + (this.currentTime / 360);

        this.x = canvas.width * 0.5 + Math.sin(this.currentTime) * (canvas.width * 0.4) + (perlin.get(this.currentTime, this.currentTime) * canvas.width * 0.5);

        // this.x = (canvas.width * 0.5) + (perlin.get(this.currentTime / 1000, this.currentTime / 1000) * STREAM_WIDTH) + (Math.sin(this.currentTime / 5000) * (STREAM_WIDTH * 0.5) * (1 + levelIntensity));
        this.x = Math.max(0, Math.min(this.x, canvas.width));

        const adjustedSpawnRate = (1 - levelIntensity);
        if (this.currentTime - this.lastSpawnTime > adjustedSpawnRate) {
            // Use Perlin noise on Y-axis to determine if we should spawn this frame
            const shouldSpawn = Math.abs(perlin.get(0, this.currentTime)) > 0.14;
            if (shouldSpawn) {

                const newObject = new FallingObject(
                    this.x,
                    10,
                    15,
                    FALL_SPEED * (0.35 + Math.random() * 0.8 + levelIntensity) + this.currentTime / 200,
                    YELLOW);

                this.game.fallingObjects.push(newObject);
                this.lastSpawnTime = this.currentTime;
            } else if (Math.abs(perlin.get(this.currentTime * this.currentTime, this.currentTime)) > 0.1) {
                const newObject = new FallingObject(
                    this.x,
                    10,
                    16,
                    FALL_SPEED * (0.55 + Math.random() * 0.5) + this.currentTime / 200,
                    RED);

                this.game.fallingObjects.push(newObject);
                this.lastSpawnTime = this.currentTime;

            }
            else if (Math.abs(perlin.get(this.currentTime * 2, this.currentTime * this.currentTime)) > 0.1) {
                const newObject = new FallingObject(
                    this.x,
                    10,
                    10,
                    FALL_SPEED * (0.35 + Math.random() * 0.5) + this.currentTime / 100,
                    BLUE);

                this.game.fallingObjects.push(newObject);
                this.lastSpawnTime = this.currentTime;

            }
        }

    }

    draw(ctx) {
        // draw spawn point for debugging
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}

export class PlayerPaddle {
    constructor(x, y, color) {
        this.x = x;
        this.y = CATCHER_Y;
        this.width = CATCHER_WIDTH;
        this.height = CATCHER_HEIGHT;
        this.color = BLUE;
        this.mouseControlActive = false;
        this.mouseX = canvas.width / 2;

        this.tween = { isTweening: false, t: 0, start: 0, end: 1, speed: 1 };

        canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.offsetX;
            this.mouseControlActive = true;
        });

        // Update mouseX on touch movement (for mobile responsiveness)
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                this.mouseX = e.touches[0].clientX - rect.left;
                e.preventDefault(); // Prevent scrolling
                this.mouseControlActive = true;
            }
        });

        // --- New Keyboard Input Handlers ---
        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.moveLeft = true;
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.moveRight = true;
            }

            this.mouseControlActive = false;
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.moveLeft = false;
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.moveRight = false;
            }
        });
    }

    update(deltaTime) {
        let targetX;

        if (this.mouseControlActive) {
            targetX = this.mouseX;
        } else if (this.moveLeft || this.moveRight) {

            let deltaX = 0;
            if (this.moveLeft) {
                deltaX -= KEYBOARD_SPEED * deltaTime;
            }
            if (this.moveRight) {
                deltaX += KEYBOARD_SPEED * deltaTime;
            }
            targetX = this.x + deltaX;
        } else {
            targetX = this.x;
        }

        this.x = targetX;
    }

    draw(ctx) {
        console.log(`${this.x}, ${this.y}`)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.strokeStyle = this.strokeStyle
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        if (this.tween.isTweening) {
            this.tween.t += 0.1 * this.tween.speed;

            if (this.tween.t >= 1) {
                this.tween.speed = 1;
                this.tween.t = 1;
                this.isTweening = false;
                this.tween.end = CATCHER_WIDTH;
            }

            this.width = noodlemath.lerp(this.tween.start, this.tween.end, this.tween.t);
        }
        else {
            this.width = CATCHER_WIDTH;
        }

    }

    flash(color) {
        this.color = color;
        this.strokeStyle = WHITE;
        setTimeout(() => {
            this.color = BLUE, 50
            this.strokeStyle = WHITE;
        }, 100);

        this.tween.start = CATCHER_WIDTH;
        this.tween.end = CATCHER_WIDTH * 1.25;
        this.tween.speed = 3;
        this.tween.t = 0;
        this.tween.isTweening = true;
    }
}

export class Background {
    constructor() {
        this.starCount = 20;
        this.stars = [];
        this.color = BLUE + '11';

        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 10 + Math.random() * 150,
                speed: 20 + Math.random() * 40
            });
        }
    }

    update(deltaTime) {
        this.stars.forEach(star => {
            star.y += star.speed * deltaTime;
            if (star.y > canvas.height) {
                star.y = 0 - star.radius * 2;
                star.x = Math.random() * canvas.width;
            }
        });
    }

    draw(ctx) {
        ctx.fillStyle = BLACK_B;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.color;
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

export class CameraShaker {
    constructor() {
        this.currentTime = 0;
        this.startTime = 0;
        this.duration = 0;

    }

    begin(duration) {
        this.startTime = this.currentTime;
        this.duration = duration;
    }

    update(deltaTime) {
        this.currentTime += deltaTime;
    }

    draw(ctx) {

        const progress = (this.currentTime - this.startTime) / this.duration;
        const intensity = Math.sin(this.currentTime * 50) * 15 * progress;

        if (progress < 1) {
            // Calculate random offsets based on current intensity
            const offsetX = Math.abs(perlin.get(this.currentTime, 0)) * intensity;
            const offsetY = Math.abs(perlin.get(0, this.currentTime)) * intensity;

            ctx.save(); // Save the current canvas state
            ctx.translate(offsetX, offsetY); // Apply the shake offset
        }
        else {
            ctx.restore();
        }
    }
}