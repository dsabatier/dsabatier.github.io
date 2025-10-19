
import { audio } from './audio.js';
import { Game } from './Catchy.js';


let lastTime = 0;

function initGame() {
    audio.startAudioContext();

    const canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    let gameActive = true;

    const game = new Game();

    function beginGame() {
        requestAnimationFrame(gameLoop);
    }

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Delta time in seconds
        lastTime = currentTime;

        if (!gameActive) {
            return;
        }

        game.update(deltaTime);
        game.draw(ctx);

        requestAnimationFrame(gameLoop);
    }

    function showMessage(title, callback = null) {
        const messageBox = document.getElementById('message-box');
        const messageContent = document.getElementById('message-content');
        const messageButton = document.getElementById('message-button');

        messageContent.innerHTML = title;
        messageBox.classList.remove('hidden');
        messageButton.onclick = () => {
            messageBox.classList.add('hidden');
            if (callback) callback();
        };
    }

    showMessage("Move: <ul><li> mouse/swipe</li><li>a/d</li><li>arrow keys</li></ul>", beginGame);
}


window.onload = initGame;