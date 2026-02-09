
// DOM Elements
const gameContainer = document.querySelector('#game-container');
const target = document.querySelector('#target');
const arrow = document.querySelector('#arrow');
const bow = document.querySelector('#bow');
const scoreDisplay = document.querySelector('#score');
const timeDisplay = document.querySelector('#time');
const startBtn = document.querySelector('#start-btn');
const resetBtn = document.querySelector('#reset-btn');
const gameOverMsg = document.querySelector('#game-over-msg');
const finalScoreDisplay = document.querySelector('#final-score');
const restartBtn = document.querySelector('#restart-btn');
const leftBtn = document.querySelector('#left-btn');
const rightBtn = document.querySelector('#right-btn');

// These are the game State Variables
let score = 0;
let timeLeft = 60;
let isGameActive = false;
let isArrowFlying = false;
let bowPosition = 50;

// Intervals
let gameTimerId = null;
let targetMoveId = null;
let arrowFrameId = null;

// Consts
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const TARGET_SIZE = 50;
let moveSpeed = 1000;

// Functionality of he game

//  Game Flow Functions
function startGame() {
    if (isGameActive) return;

    // Reset State
    score = 0;
    timeLeft = 60;
    isGameActive = true;
    isArrowFlying = false;
    moveSpeed = 1000;

    // Resetting the  UI
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    gameOverMsg.classList.add('hidden');
    startBtn.disabled = true;
    resetBtn.disabled = false;

    // Reset Arrow Position
    resetArrow();

    // Reset Bow Position
    bowPosition = 50;
    updateBowPosition();

    // Start Timers
    startTimer();
    startTargetMovement();
}

function resetGame() { //Function to reset the game
    // Stop everything
    clearInterval(gameTimerId);
    clearInterval(targetMoveId);
    cancelAnimationFrame(arrowFrameId);

    // Reset State
    isGameActive = false;
    isArrowFlying = false;
    timeLeft = 60;
    score = 0;
    moveSpeed = 1000;
    bowPosition = 50;

    // Reset UI
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    gameOverMsg.classList.add('hidden');
    startBtn.disabled = false;
    resetBtn.disabled = true;

    // Reset Positions
    resetArrow();
    updateBowPosition();
    target.style.top = '50px';
    target.style.left = '50%';
}

function endGame() { //Function to end the game
    isGameActive = false;
    clearInterval(gameTimerId);
    clearInterval(targetMoveId);
    cancelAnimationFrame(arrowFrameId);

    finalScoreDisplay.textContent = score;
    gameOverMsg.classList.remove('hidden');
    startBtn.disabled = false;
}

// Logic Functions
function startTimer() { //Function to start the timer
    gameTimerId = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function startTargetMovement() { //Function to start the target movement
    moveTarget();

    // Clear existing interval if any to apply new speed
    if (targetMoveId) clearInterval(targetMoveId);

    targetMoveId = setInterval(moveTarget, moveSpeed);
}

function moveTarget() {
    if (!isGameActive) return;

    // I calc random postions within container
    // Container width 600, target width approx 60 (50 + borders)
    // We want to keep it inside
    const maxX = GAME_WIDTH - 60;
    const maxY = GAME_HEIGHT / 2; // Keep target in upper half

    const randomX = Math.floor(Math.random() * maxX); // random x position
    const randomY = Math.floor(Math.random() * maxY); // random y position

    target.style.left = `${randomX}px`;
    target.style.top = `${randomY}px`;
}

function shootArrow() { //Function to shoot the arrow
    if (!isGameActive || isArrowFlying) return;

    isArrowFlying = true;
    arrow.style.display = 'block';

    // Vertical position of arrow from bottom
    let arrowBottom = 30;

    // Animation loop for arrow
    function animateArrow() {
        if (!isGameActive) return;

        arrowBottom += 10; // Speed of arrow
        arrow.style.bottom = `${arrowBottom}px`;

        // Collision Check
        if (checkCollision(arrow, target)) {
            handleHit();
            return; // Stop animation
        }

        // Miss Check (went off screen)
        if (arrowBottom > GAME_HEIGHT) {
            resetArrow();
        } else {
            arrowFrameId = requestAnimationFrame(animateArrow);
        }
    }

    arrowFrameId = requestAnimationFrame(animateArrow);
}

function resetArrow() {
    isArrowFlying = false;
    cancelAnimationFrame(arrowFrameId);
    arrow.style.display = 'none';
    arrow.style.bottom = '30px';
}

function checkCollision(arrowEl, targetEl) { //Function to check collision
    const arrowRect = arrowEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    return !( //Checking if the arrow is not colliding with the target
        arrowRect.top > targetRect.bottom ||
        arrowRect.bottom < targetRect.top ||
        arrowRect.right < targetRect.left ||
        arrowRect.left > targetRect.right
    );
}

function handleHit() {
    // Update Score
    updateScore();

    // Reset Arrow
    resetArrow();


    // Increase Difficulty
    increaseDifficulty();
}

function updateScore() {
    score += 10;
    scoreDisplay.textContent = score;
}

function moveBow(direction) { //Function to move the bow horizontally
    if (!isGameActive) return;

    const step = 5; // 5% movement per click
    if (direction === 'left') {
        bowPosition = Math.max(5, bowPosition - step);
    } else {
        bowPosition = Math.min(95, bowPosition + step);
    }
    updateBowPosition();
}

function updateBowPosition() { //Function to update the bow position
    bow.style.left = `${bowPosition}%`;
    // If arrow isn't flying, it should move with bow
    if (!isArrowFlying) {
        arrow.style.left = `${bowPosition}%`;
    }
}

function increaseDifficulty() {
    // Every 20 points, speed up target
    if (score % 20 === 0 && score > 0 && moveSpeed > 200) {
        moveSpeed -= 100; // Decreasing interval significantly to make it harder
        target.style.transform = 'scale(0.9)';  // Shrinking the target
        startTargetMovement(); // Reset interval with new speed
    }
}

//  Event Listeners
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', startGame);

// Bow Movement Buttons
leftBtn.addEventListener('click', () => moveBow('left'));
rightBtn.addEventListener('click', () => moveBow('right'));

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (!isGameActive && e.code !== 'Space') return;

    if (e.code === 'Space') {
        shootArrow();
    } else if (e.code === 'ArrowLeft') {
        moveBow('left');
    } else if (e.code === 'ArrowRight') {
        moveBow('right');
    }
});

// Shoot on Click in game container
gameContainer.addEventListener('click', (e) => {
    // Prevent shooting if clicking buttons inside the container (if any)
    if (e.target.tagName === 'BUTTON') return;
    shootArrow();
});

// Initial Setup
resetGame();


