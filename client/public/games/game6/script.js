let timeLeft = 10; 
let successCount = 0;
const GOAL_SUCCESS = 15; 

let isGameRunning = false;
let timerId;

const DIRECTIONS = [
    { dir: 'UP', icon: '⬆️' },
    { dir: 'DOWN', icon: '⬇️' },
    { dir: 'LEFT', icon: '⬅️' },
    { dir: 'RIGHT', icon: '➡️' }
];
let currentTargetDir = ''; 

const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('success-count');
const swipeArea = document.getElementById('swipe-area');
const arrowDisplay = document.getElementById('arrow-display');
const feedbackText = document.getElementById('feedback-text');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    timeLeft = 10;
    successCount = 0;
    isGameRunning = true;
    
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = successCount;
    readyCover.style.display = 'none';
    swipeArea.style.backgroundColor = '#fffdf8'; // 테마 컬러
    
    setNextArrow(); 
    timerId = setInterval(countDown, 1000);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) endGame();
}

function setNextArrow() {
    const randomIdx = Math.floor(Math.random() * DIRECTIONS.length);
    currentTargetDir = DIRECTIONS[randomIdx].dir;
    arrowDisplay.textContent = DIRECTIONS[randomIdx].icon;
    feedbackText.textContent = "방향에 맞게 드래그!";
    feedbackText.style.color = "#8d6e63";
}

let startX = 0;
let startY = 0;
const SWIPE_THRESHOLD = 30; 

function handleSwipeStart(e) {
    if (!isGameRunning) return;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
}

function handleSwipeEnd(e) {
    if (!isGameRunning) return;
    let endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    let endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    let diffX = endX - startX;
    let diffY = endY - startY;

    if (Math.abs(diffX) < SWIPE_THRESHOLD && Math.abs(diffY) < SWIPE_THRESHOLD) return;

    let userSwipeDir = '';
    if (Math.abs(diffX) > Math.abs(diffY)) userSwipeDir = diffX > 0 ? 'RIGHT' : 'LEFT';
    else userSwipeDir = diffY > 0 ? 'DOWN' : 'UP';

    checkSwipe(userSwipeDir);
}

swipeArea.addEventListener('touchstart', handleSwipeStart);
swipeArea.addEventListener('touchend', handleSwipeEnd);
swipeArea.addEventListener('mousedown', handleSwipeStart);
swipeArea.addEventListener('mouseup', handleSwipeEnd);

function checkSwipe(userSwipeDir) {
    arrowDisplay.style.transform = 'scale(0.8)';
    setTimeout(() => arrowDisplay.style.transform = 'scale(1)', 100);

    if (userSwipeDir === currentTargetDir) {
        successCount++;
        scoreDisplay.textContent = successCount;
        
        swipeArea.style.backgroundColor = '#d3f9d8'; 
        setTimeout(() => swipeArea.style.backgroundColor = '#fffdf8', 150);
        
        if (successCount >= GOAL_SUCCESS) endGame();
        else setNextArrow(); 
    } else {
        feedbackText.textContent = "틀렸습니다! 다시!";
        feedbackText.style.color = "#f03e3e";
        
        swipeArea.style.backgroundColor = '#ffe3e3';
        setTimeout(() => swipeArea.style.backgroundColor = '#fffdf8', 150);
    }
}

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);

    const isSuccess = successCount >= GOAL_SUCCESS;

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `엄청난 순발력!<br><b>${successCount}</b>번 방향을 맞췄습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `시간이 부족합니다.<br>(성공: <b>${successCount}</b>/${GOAL_SUCCESS})`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        const resultData = { type: 'GAME_RESULT', gameId: 6, success: isSuccess };
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);
        window.parent.postMessage(resultData, '*');
    };
}