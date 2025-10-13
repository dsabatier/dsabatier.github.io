import { perlin } from './perlin.js'; // IMPORTANT: Import the perlin object
import { audio } from './audio.js';
import { noodlemath } from './math.js';

const KEYBOARD_SPEED = 450; // Pixels per second
let moveLeft = false;
let moveRight = false;

let lastTime = 0;
let originTime = 0;

function initGame() {
    audio.startAudioContext();
    originTime = performance.now();
    // --- Custom Alert/Message Box Function (Replaces alert()) ---
    const messageBox = document.getElementById('message-box');
    const messageContent = document.getElementById('message-content');
    const messageButton = document.getElementById('message-button');

    function showMessage(title, callback = null) {
        messageContent.innerHTML = title;
        messageBox.classList.remove('hidden');
        messageButton.onclick = () => {
            messageBox.classList.add('hidden');
            if (callback) callback();
        };
    }

    // --- Game Setup ---
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');

    // --- Configuration ---
    const CATCHER_HEIGHT = 20;
    const CATCHER_WIDTH = 100;
    const CATCHER_Y = canvas.height - 140; // Fixed position near the bottom
    const FALL_SPEED = 100; // units per second
    const SPAWN_RATE = 0.35; // Spawn a new object every 80 milliseconds
    const GROUND_LEVEL = canvas.height - 10;
    const STREAM_WIDTH = 300; // Max horizontal deviation of the spawner

    const RED = '#F35F61';
    const ORANGE = '#F19741';
    const YELLOW = '#F2E641';
    const GREEN = '#41F28D';
    const BLUE = '#00AAF3';
    const BROWN = '#554242';
    const BROWN_50 = '#816565';
    const WHITE = '#FFFFFF';
    const BLACK_R = '#160a0aff';
    const BLACK_B = '#0c0a16ff';

    let score = 0;
    let lives = 100;
    let lastSpawnTime = performance.now();
    let gameActive = true;
    let fallingObjects = [];
    let mouseControlActive = false;

    // --- Player (Catcher) Object ---
    const Catcher = {
        x: canvas.width / 2, // Center of the catcher
        y: CATCHER_Y,
        width: CATCHER_WIDTH,
        height: CATCHER_HEIGHT,
        color: BLUE,
        strokeStyle: WHITE,
        currentWidth: CATCHER_WIDTH,
        currentHeight: CATCHER_HEIGHT,
        tween: { isTweening: false, t: 0, start: 0, end: 1, speed: 1 },
        updatePosition: function (newX) {
            // Ensure the catcher center is within bounds
            this.x = Math.max(
                this.width / 2,
                Math.min(newX, canvas.width - this.width / 2)
            );
        },

        // Draw the catcher
        draw: function () {
            ctx.fillStyle = this.color;
            // Draw centered on this.x
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

        },
        flash: function () {
            this.color = WHITE; // Yellow flash
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
    };

    const Background = {
        starCount: 20,
        stars: [],
        color: BLUE + '11',
        init: function () {
            for (let i = 0; i < this.starCount; i++) {
                this.stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: 10 + Math.random() * 150,
                    speed: 20 + Math.random() * 40
                });
            }
        },
        update: function (deltaTime) {
            this.stars.forEach(star => {
                star.y += star.speed * deltaTime;
                if (star.y > canvas.height) {
                    star.y = 0 - star.radius * 2;
                    star.x = Math.random() * canvas.width;
                }
            });
        },
        draw: function () {
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

    // --- Falling Object Class ---
    class FallingObject {
        constructor(x) {
            this.x = x;
            this.y = -20; // Start above the screen
            this.radius = 15;
            // Add slight randomness to speed
            this.speed = FALL_SPEED * (0.9 + Math.random() * 0.08) + (performance.now() - originTime) / 200;
            this.color = ORANGE;

            console.log((performance.now(-originTime) / 200));
        }

        // Simple Arcade Physics: Move straight down
        update(deltaTime) {
            this.y += this.speed * deltaTime;
        }

        // Draw the object (a circle)
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }

    // --- Input Handling ---
    let mouseX = canvas.width / 2;

    // Update mouseX on mouse movement
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.offsetX;
        mouseControlActive = true;
    });

    // Update mouseX on touch movement (for mobile responsiveness)
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            e.preventDefault(); // Prevent scrolling
            mouseControlActive = true;
        }
    });

    // --- New Keyboard Input Handlers ---
    document.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            moveLeft = true;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            moveRight = true;
        }

        mouseControlActive = false;
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            moveLeft = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            moveRight = false;
        }
    });
    // -------------------------------------

    // --- Game Logic Functions ---
    let spawnPoint = 0;
    function spawnManager(currentTime) {
        const levelIntensity = 1 - (Math.sin(currentTime / 10000 * 0.5) + 1) / 2; // 0 to 1 over time
        spawnPoint = (canvas.width * 0.5) + (perlin.get(currentTime / 1000, currentTime / 1000) * STREAM_WIDTH) + (Math.sin(currentTime / 5000) * (STREAM_WIDTH * 0.5) * (1 + levelIntensity));

        // Use Perlin noise on Y-axis to determine if we should spawn this frame
        const shouldSpawn = Math.abs(perlin.get(0, currentTime / 1000 * 0.5)) > 0.1;

        if (!shouldSpawn) return;
        // Use sine wave to move the stream source's X position and add noise to that
        const streamXOffset = ((canvas.width * 0.5) + Math.sin(currentTime / 10000) * STREAM_WIDTH) + perlin.get(Math.sin(currentTime / 1000 * 1.15), 0) * STREAM_WIDTH * 2;


        // Adjust spawn rate based on level intensity (more intensity = more frequent spawns)
        const adjustedSpawnRate = SPAWN_RATE * (1 - levelIntensity * 0.7); // Up to 70% faster spawn


        if (currentTime - lastSpawnTime > adjustedSpawnRate * 1000) {
            const newObject = new FallingObject(spawnPoint);
            fallingObjects.push(newObject);
            lastSpawnTime = currentTime;
        }
    }

    function checkCollisions() {
        // Loop backward to safely remove/modify items during iteration
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];

            // --- Custom Arcade Collision Check (Distance) ---

            // Simplified Collision: Check if object is vertically aligned with the catcher AND close enough
            const x_dist = Math.abs(obj.x - Catcher.x);
            const y_dist = Math.abs(obj.y - Catcher.y);

            const collision_threshold_x = (Catcher.width / 2) + obj.radius;
            const collision_threshold_y = (Catcher.height / 2) + obj.radius;
            if (x_dist < collision_threshold_x && y_dist < collision_threshold_y) {

                // CATCH!
                audio.playCatchSound(lastTime);
                score++;
                scoreDisplay.textContent = `SCORE: ${score}`;
                fallingObjects.splice(i, 1); // Remove object
                // Flash effect on catcher
                Catcher.flash();

            }
            // --- Ground Miss Check ---
            else if (obj.y > GROUND_LEVEL) {
                // MISS!
                lives--;
                livesDisplay.textContent = `LIVES: ${lives}`;
                fallingObjects.splice(i, 1); // Remove object
                audio.playMissSound(lastTime);

                if (lives <= 0) {
                    endGame();
                    break;
                }
            }
        }
    }

    function endGame() {
        gameActive = false;
        showMessage(`GAME OVER! Your final score: ${score}`, initializeGame);

    }

    function initializeGame() {
        score = 0;
        lives = 5;
        fallingObjects = [];
        scoreDisplay.textContent = `SCORE: ${score}`;
        livesDisplay.textContent = `LIVES: ${lives}`;
        gameActive = true;
        lastTime = performance.now();
        Background.init();
        originTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // --- Main Game Loop ---


    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Delta time in seconds
        lastTime = currentTime;

        if (!gameActive) {
            return;
        }

        // 1. Update Logic

        // Catcher Movement Logic: Keyboard takes priority over mouse/touch
        let targetX;

        if (mouseControlActive) {
            targetX = mouseX;
        } else if (moveLeft || moveRight) {
            // If any key is pressed, calculate new position based on speed and time
            let deltaX = 0;
            if (moveLeft) {
                deltaX -= KEYBOARD_SPEED * deltaTime;
            }
            if (moveRight) {
                deltaX += KEYBOARD_SPEED * deltaTime;
            }
            targetX = Catcher.x + deltaX;
        } else {
            targetX = Catcher.x; // No movement
        }

        Catcher.updatePosition(targetX); // Update the catcher's final position

        spawnManager(currentTime);

        Background.update(deltaTime);
        fallingObjects.forEach(obj => obj.update(deltaTime));
        checkCollisions();

        // 2. Drawing (Redraw everything)
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

        Background.draw();
        // Draw objects
        fallingObjects.forEach(obj => obj.draw());

        // Draw catcher last so it's on top
        Catcher.draw();

        // draw spawn point for debugging
        ctx.fillStyle = GREEN;
        ctx.beginPath();
        ctx.arc(spawnPoint, 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Reset per-frame flags
        audio.playedThisFrame = false;

        // 3. Request next frame
        requestAnimationFrame(gameLoop);
    }

    // --- Start the Game ---
    showMessage("Move: <ul><li> mouse/swipe</li><li>a/d</li><li>arrow keys</li></ul>", initializeGame);
}

// Ensure the game initialization only runs after the document is ready
window.onload = initGame;