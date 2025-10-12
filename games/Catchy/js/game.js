// game.js
import { perlin } from './perlin.js'; // IMPORTANT: Import the perlin object

// --- New Keyboard State and Configuration ---
const KEYBOARD_SPEED = 450; // Pixels per second for keyboard movement
let moveLeft = false;
let moveRight = false;
// -------------------------------------------

function initGame() {
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
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score-display');
    const livesDisplay = document.getElementById('lives-display');

    // --- Configuration ---
    const CATCHER_HEIGHT = 20;
    const CATCHER_WIDTH = 100;
    const CATCHER_Y = canvas.height - 40; // Fixed position near the bottom
    const FALL_SPEED = 200; // units per second
    const SPAWN_RATE = 0.08; // Spawn a new object every 80 milliseconds
    const GROUND_LEVEL = canvas.height - 10;
    const STREAM_WIDTH = 300; // Max horizontal deviation of the spawner
    const NOISE_FREQUENCY = 0.0005; // Controls how fast the Perlin noise changes over time

    let score = 0;
    let lives = 3;
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
        color: '#10b981', // Emerald-500

        // Renamed from update to updatePosition. Takes the desired new X coordinate.
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
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    };

    // --- Falling Object Class ---
    class FallingObject {
        constructor(x) {
            this.x = x;
            this.y = -20; // Start above the screen
            this.radius = 15;
            // Add slight randomness to speed
            this.speed = FALL_SPEED * (0.9 + Math.random() * 0.2);
            this.color = `hsl(${Math.random() * 360}, 70%, 50%)`; // Random color
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
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
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

    function spawnManager(currentTime) {

        // Use Perlin noise on Y-axis to determine if we should spawn this frame
        const shouldSpawn = Math.abs(perlin.get(0, currentTime / 1000 * 0.5)) > 0.1;

        if (!shouldSpawn) return;
        // Use sine wave to move the stream source's X position and add noise to that
        const streamXOffset = (Math.sin(currentTime / 10000) * STREAM_WIDTH) + perlin.get(Math.sin(currentTime / 1000 * 1.15), 0) * STREAM_WIDTH * 2;
        const spawnX = canvas.width / 2 + streamXOffset;

        if (currentTime - lastSpawnTime > SPAWN_RATE * 1000) {
            const newObject = new FallingObject(spawnX);
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
                score++;
                scoreDisplay.textContent = `SCORE: ${score}`;
                fallingObjects.splice(i, 1); // Remove object
                // Flash effect on catcher
                Catcher.color = '#fde047'; // Yellow flash
                setTimeout(() => Catcher.color = '#10b981', 50);

            }
            // --- Ground Miss Check ---
            else if (obj.y > GROUND_LEVEL) {
                // // MISS!
                // lives--;
                // // livesDisplay.textContent = `LIVES: ${lives}`;
                // fallingObjects.splice(i, 1); // Remove object

                // if (lives <= 0) {
                //     endGame();
                //     break;
                // }
            }
        }
    }

    function endGame() {
        gameActive = false;
        showMessage(`GAME OVER! Your final score: ${score}`, initializeGame);
    }

    function initializeGame() {
        score = 0;
        lives = 3;
        fallingObjects = [];
        scoreDisplay.textContent = `SCORE: ${score}`;
        // livesDisplay.textContent = `LIVES: ${lives}`;
        gameActive = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // --- Main Game Loop ---
    let lastTime;

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

        fallingObjects.forEach(obj => obj.update(deltaTime));
        checkCollisions();

        // 2. Drawing (Redraw everything)
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

        // Draw objects
        fallingObjects.forEach(obj => obj.draw());

        // Draw catcher last so it's on top
        Catcher.draw();

        // 3. Request next frame
        requestAnimationFrame(gameLoop);
    }

    // --- Start the Game ---
    showMessage("Use your **mouse/finger** OR the **Left/Right Arrow keys (or A/D)** to move the catcher. Catch objects, avoid misses!", initializeGame);
}

// Ensure the game initialization only runs after the document is ready
window.onload = initGame;