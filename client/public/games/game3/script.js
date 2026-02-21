let score = 0;
let timeLeft = 30;
const GOAL_SCORE = 150; 

let gameTimerId; 
let spawnTimerId;   
let gameLoopId;     
let isGameRunning = false;

let itemSpeed = 3;
const SPAWN_RATE = 400; 

const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const gameArea = document.getElementById('game-area');
const catcher = document.getElementById('catcher');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

let activeItems = []; 

startBtn.addEventListener('click', startGame);

function startGame() {
    score = 0;
    timeLeft = 30;
    itemSpeed = 3; 
    activeItems = [];
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    isGameRunning = true;

    const existingItems = document.querySelectorAll('.item');
    existingItems.forEach(item => item.remove());

    readyCover.style.display = 'none';
    catcher.style.left = '50%';

    gameTimerId = setInterval(countDown, 1000);
    spawnTimerId = setInterval(spawnItem, SPAWN_RATE);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function countDown() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    itemSpeed += 0.2;

    if (timeLeft <= 0) {
        endGame();
    }
}

function moveCatcher(e) {
    if (!isGameRunning) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const gameAreaRect = gameArea.getBoundingClientRect();
    let relativeX = clientX - gameAreaRect.left;

    if (relativeX < 0) relativeX = 0;
    if (relativeX > gameAreaRect.width) relativeX = gameAreaRect.width;
    catcher.style.left = `${relativeX}px`;
}

gameArea.addEventListener('mousemove', moveCatcher);
gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    moveCatcher(e);
}, { passive: false });

function spawnItem() {
    if (!isGameRunning) return;

    const item = document.createElement('div');
    item.classList.add('item');

    const isGood = Math.random() > 0.35;

    // 🔥 땅콩(좋은거)과 돌멩이(나쁜거)로 변경!
    if (isGood) {
        item.textContent = '🥜';
        item.classList.add('good');
        item.dataset.points = 10;
    } else {
        item.textContent = '🪨';
        item.classList.add('bad');
        item.dataset.points = -20;
    }

    const randomX = Math.floor(Math.random() * (gameArea.offsetWidth - 30));
    item.style.left = `${randomX}px`;
    item.style.top = '-30px';

    gameArea.appendChild(item);
    activeItems.push(item);
}

function gameLoop() {
    if (!isGameRunning) return;

    const catcherRect = catcher.getBoundingClientRect();

    activeItems.forEach((item, index) => {
        let currentTop = parseFloat(item.style.top || -30);
        item.style.top = `${currentTop + itemSpeed}px`;

        const itemRect = item.getBoundingClientRect();

        if (
            itemRect.bottom >= catcherRect.top &&
            itemRect.top <= catcherRect.bottom &&
            itemRect.right >= catcherRect.left &&
            itemRect.left <= catcherRect.right
        ) {
            score += parseInt(item.dataset.points);
            scoreDisplay.textContent = score;
            item.remove();
            activeItems.splice(index, 1);
        } else if (currentTop > gameArea.offsetHeight) {
            item.remove();
            activeItems.splice(index, 1);
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameTimerId);
    clearInterval(spawnTimerId);
    cancelAnimationFrame(gameLoopId);

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `대단해요!<br>총 <b>${score}</b>점을 모았습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `아쉽네요! <b>${score}</b>점에 그쳤습니다.<br>(목표: ${GOAL_SCORE}점)`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        const resultData = {
            type: 'GAME_RESULT',
            gameId: 3, // 3번 게임!
            success: isSuccess
        };
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);
        window.parent.postMessage(resultData, '*');
    };
}
