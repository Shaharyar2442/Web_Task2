const config = {
    gameDuration: 60,
    baseTargetSpeed: 3,
    arrowSpeed: 25,
    bowSpeed: 10
};

// Elements
const arrow = document.getElementById("arrow");
const target = document.getElementById("target");
const bow = document.getElementById("bow-container");
const obstaclesContainer = document.getElementById("obstacles-container");
const particlesContainer = document.getElementById("particles-container");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const levelDisplay = document.getElementById("level");
const gameArea = document.getElementById("gameArea");
const modal = document.getElementById("gameOverModal");
const finalScoreDisplay = document.getElementById("finalScore");
const finalLevelDisplay = document.getElementById("finalLevel");
const restartBtn = document.getElementById("restartBtn");

let gameState = {
    score: 0,
    timeLeft: config.gameDuration,
    isPlaying: false,
    arrowMoving: false,
    targetDirection: 1,
    targetSpeed: config.baseTargetSpeed,
    difficultyLevel: 1,
    bowY: 300,
    aimAngle: 0,
    arrowVelocity: { x: 0, y: 0 },
    hitObstacles: []
};

let gameTimerId, targetMoveId, arrowMoveId;

// --- INPUTS ---
document.addEventListener("mousemove", (e) => {
    if (!gameState.isPlaying) return;
    const bowRect = bow.getBoundingClientRect();
    const centerX = bowRect.left + bowRect.width / 2;
    const centerY = bowRect.top + bowRect.height / 2;
    gameState.aimAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    bow.style.transform = `rotate(${gameState.aimAngle * (180 / Math.PI)}deg)`;
});

document.addEventListener("keydown", (e) => {
    if (!gameState.isPlaying) return;
    if (["w", "W", "ArrowUp"].includes(e.key)) gameState.bowY = Math.max(50, gameState.bowY - config.bowSpeed);
    if (["s", "S", "ArrowDown"].includes(e.key)) gameState.bowY = Math.min(gameArea.clientHeight - 150, gameState.bowY + config.bowSpeed);
    bow.style.top = gameState.bowY + "px";
});

document.addEventListener("click", (e) => {
    if (e.target.id === 'restartBtn') return;
    if (gameState.isPlaying && !gameState.arrowMoving) shootArrow();
});

restartBtn.addEventListener("click", resetGame);
resetGame();

// --- LOGIC ---
function startTimer() {
    gameTimerId = setInterval(() => {
        gameState.timeLeft--;
        timeDisplay.textContent = gameState.timeLeft;
        if (gameState.timeLeft % 10 === 0 && gameState.timeLeft !== 60) gameState.targetSpeed += 0.5;
        if (gameState.timeLeft <= 0) endGame();
    }, 1000);
}

function moveTarget() {
    targetMoveId = setInterval(() => {
        let top = target.offsetTop;
        const maxTop = gameArea.clientHeight - target.clientHeight;
        if (top <= 50) gameState.targetDirection = 1; // Top margin
        else if (top >= maxTop - 50) gameState.targetDirection = -1; // Bottom margin
        target.style.top = (top + (gameState.targetSpeed * gameState.targetDirection)) + "px";
    }, 20);
}

function spawnObstacles(count) {
    obstaclesContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const obs = document.createElement('div');
        obs.classList.add('obstacle');
        const minX = 250, maxX = gameArea.clientWidth - 300;
        obs.style.left = (Math.random() * (maxX - minX) + minX) + "px";
        obs.style.top = (Math.random() * (gameArea.clientHeight - 150) + 50) + "px";
        obstaclesContainer.appendChild(obs);
    }
}

function shootArrow() {
    gameState.arrowMoving = true;
    gameState.hitObstacles = [];
    arrow.style.filter = "drop-shadow(0 4px 2px rgba(0,0,0,0.2))"; // Reset filter

    arrow.style.display = "block";
    arrow.style.left = (bow.offsetLeft + 30) + "px";
    arrow.style.top = (gameState.bowY + 70) + "px"; // 70 is rough center of bow height
    arrow.style.transform = `rotate(${gameState.aimAngle * (180 / Math.PI)}deg)`;

    gameState.arrowVelocity.x = Math.cos(gameState.aimAngle) * config.arrowSpeed;
    gameState.arrowVelocity.y = Math.sin(gameState.aimAngle) * config.arrowSpeed;

    arrowMoveId = setInterval(() => {
        let curLeft = parseFloat(arrow.style.left);
        let curTop = parseFloat(arrow.style.top);
        let newLeft = curLeft + gameState.arrowVelocity.x;
        let newTop = curTop + gameState.arrowVelocity.y;

        arrow.style.left = newLeft + "px";
        arrow.style.top = newTop + "px";

        // Obstacles
        document.querySelectorAll('.obstacle').forEach(obs => {
            if (!gameState.hitObstacles.includes(obs) && checkCollision(newLeft, newTop, obs)) {
                gameState.hitObstacles.push(obs);
                gameState.arrowVelocity.x *= 0.5;
                gameState.arrowVelocity.y *= 0.5;
                obs.style.transform = "scale(0.9)";
                setTimeout(() => obs.style.transform = "scale(1)", 100);
            }
        });

        // Target
        if (checkCollision(newLeft, newTop, target)) {
            handleHit(newLeft, newTop);
        }

        // Bounds
        if (newLeft > window.innerWidth || newLeft < 0 || newTop > window.innerHeight || newTop < 0) {
            resetArrow();
        }
    }, 20);
}

function checkCollision(x, y, el) {
    const rect = el.getBoundingClientRect();
    return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
}

// --- VISUAL EFFECTS ---
function createParticles(x, y) {
    const colors = ['#fdcb6e', '#d63031', '#0984e3', '#ffffff'];
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = x + 'px';
        p.style.top = y + 'px';

        // Random explode direction
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const velX = Math.cos(angle) * speed;
        const velY = Math.sin(angle) * speed;

        particlesContainer.appendChild(p);

        // Animate manually to avoid complex CSS keyframes for dynamic coords
        let pLife = 0;
        const pInt = setInterval(() => {
            pLife++;
            p.style.left = (parseFloat(p.style.left) + velX) + 'px';
            p.style.top = (parseFloat(p.style.top) + velY) + 'px';
            p.style.opacity = 1 - (pLife / 30);
            if (pLife > 30) {
                clearInterval(pInt);
                p.remove();
            }
        }, 20);
    }
}

function handleHit(hitX, hitY) {
    gameState.score += 10;
    updateScoreDisplay();
    createParticles(hitX, hitY); // ✨ Aesthetic Particles ✨

    // Bounce Target
    target.style.transform = "scale(1.2)";
    setTimeout(() => target.style.transform = "scale(1)", 100);

    // Increase Difficulty
    const newLevel = Math.floor(gameState.score / 50) + 1;
    if (newLevel > gameState.difficultyLevel) {
        gameState.difficultyLevel = newLevel;
        levelDisplay.textContent = newLevel;
        gameState.targetSpeed += 1.0;

        // Shrink target
        const size = Math.max(40, 100 - (gameState.difficultyLevel * 5));
        target.style.width = size + "px";
        target.style.height = size + "px";

        // Spawn Obstacles (Level 3+)
        if (gameState.difficultyLevel >= 3) {
            spawnObstacles(Math.min(6, gameState.difficultyLevel - 1));
        }
    }
    resetArrow();
}

function resetArrow() {
    clearInterval(arrowMoveId);
    gameState.arrowMoving = false;
    arrow.style.display = "none";
}

function updateScoreDisplay() { scoreDisplay.textContent = gameState.score; }

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameTimerId);
    clearInterval(targetMoveId);
    clearInterval(arrowMoveId);
    modal.classList.remove("hidden");
    finalScoreDisplay.textContent = gameState.score;
    finalLevelDisplay.textContent = gameState.difficultyLevel;
}

function resetGame() {
    clearInterval(gameTimerId);
    clearInterval(targetMoveId);
    clearInterval(arrowMoveId);

    gameState.score = 0;
    gameState.timeLeft = config.gameDuration;
    gameState.isPlaying = true;
    gameState.arrowMoving = false;
    gameState.targetSpeed = config.baseTargetSpeed;
    gameState.difficultyLevel = 1;
    gameState.bowY = 300;
    gameState.hitObstacles = [];

    updateScoreDisplay();
    timeDisplay.textContent = gameState.timeLeft;
    levelDisplay.textContent = 1;
    modal.classList.add("hidden");
    arrow.style.display = "none";
    obstaclesContainer.innerHTML = '';
    particlesContainer.innerHTML = '';

    target.style.top = "50%";
    target.style.width = "100px";
    target.style.height = "100px";

    bow.style.top = gameState.bowY + "px";
    bow.style.transform = "rotate(0deg)";

    startTimer();
    moveTarget();
}


