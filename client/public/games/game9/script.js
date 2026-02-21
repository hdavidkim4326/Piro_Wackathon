let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 7;

let isGameRunning = false;
let timerId;

const RECIPES = [
    { name: "보라색 (Purple)", colors: ["red", "blue"], hex: "#b197fc" },
    { name: "주황색 (Orange)", colors: ["red", "yellow"], hex: "#ff922b" },
    { name: "초록색 (Green)", colors: ["blue", "yellow"], hex: "#51cf66" }
];

const COLOR_CODES = {
    "red": "#ff6b6b",
    "blue": "#339af0",
    "yellow": "#fcc419"
};

let currentTarget = null;
let selectedColors = []; 

let previousTargetName = "";
let consecutiveTargetCount = 0;

const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const targetBox = document.getElementById('target-box');
const targetName = document.getElementById('target-name');
const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const feedbackText = document.getElementById('feedback-text');
const colorBtns = document.querySelectorAll('.color-btn');
const resetBtn = document.getElementById('reset-tray-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    timeLeft = 10; 
    score = 0;
    previousTargetName = ""; 
    consecutiveTargetCount = 0;
    isGameRunning = true;

    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score;
    readyCover.style.display = 'none';

    setNextTarget();
    timerId = setInterval(countDown, 1000);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); 
    }
}

function setNextTarget() {
    clearTray();

    let randomIdx;
    let nextTarget;

    do {
        randomIdx = Math.floor(Math.random() * RECIPES.length);
        nextTarget = RECIPES[randomIdx];
    } while (nextTarget.name === previousTargetName && consecutiveTargetCount >= 2);

    if (nextTarget.name === previousTargetName) {
        consecutiveTargetCount++; 
    } else {
        previousTargetName = nextTarget.name;
        consecutiveTargetCount = 1; 
    }

    currentTarget = nextTarget;

    targetBox.style.backgroundColor = currentTarget.hex;
    targetName.textContent = currentTarget.name;
    feedbackText.textContent = "어떤 색을 섞어야 할까요?";
    feedbackText.style.color = "#8d6e63";
}

colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning || selectedColors.length >= 2) return;

        const pickedColor = btn.dataset.color;
        selectedColors.push(pickedColor);
        updateTrayUI();

        if (selectedColors.length === 2) {
            checkMix();
        }
    });
});

function updateTrayUI() {
    if (selectedColors[0]) {
        slot1.style.backgroundColor = COLOR_CODES[selectedColors[0]];
        slot1.style.border = "3px solid white";
    } else {
        slot1.style.backgroundColor = "#fff9f0";
        slot1.style.border = "3px dashed #eaddcf";
    }

    if (selectedColors[1]) {
        slot2.style.backgroundColor = COLOR_CODES[selectedColors[1]];
        slot2.style.border = "3px solid white";
    } else {
        slot2.style.backgroundColor = "#fff9f0";
        slot2.style.border = "3px dashed #eaddcf";
    }
}

resetBtn.addEventListener('click', clearTray);

function clearTray() {
    selectedColors = [];
    updateTrayUI();
}

function checkMix() {
    const userMix = [...selectedColors].sort().join(',');
    const correctMix = [...currentTarget.colors].sort().join(',');

    if (userMix === correctMix) {
        score++;
        scoreDisplay.textContent = score;
        feedbackText.textContent = "✨ 정답입니다!";
        feedbackText.style.color = "#20c997";

        if (score >= GOAL_SCORE) {
            setTimeout(() => endGame(true), 300); 
        } else {
            setTimeout(setNextTarget, 400); 
        }
    } else {
        feedbackText.textContent = "❌ 틀렸습니다! 다시 섞어보세요.";
        feedbackText.style.color = "#f03e3e";
        setTimeout(clearTray, 600); 
    }
}

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `천재적인 색채 감각!<br><b>${GOAL_SCORE}</b>문제를 모두 맞췄습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `시간 초과!<br>다시 도전해보세요. (달성: <b>${score}</b>/${GOAL_SCORE})`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
        const resultData = {
            type: 'GAME_RESULT',
            gameId: 9,
            success: isSuccess
        };

        // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);

        // 3. 부모 창으로 쪽지를 진짜 던집니다.
        window.parent.postMessage(resultData, '*');
    };
}