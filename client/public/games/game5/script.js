const TARGET_TIME = 10.00;
const BLIND_TIME = 4.00;
const ERROR_MARGIN = 0.20;
const TOTAL_CHANCES = 3;
const GOAL_SUCCESS = 1;

let chances = TOTAL_CHANCES;
let successCount = 0;
let startTime = 0;
let timerInterval;
let isRunning = false;

const chancesDisplay = document.getElementById('chances-left');
const successDisplay = document.getElementById('success-count');
const timerDisplay = document.getElementById('timer-display');
const resultMessage = document.getElementById('result-message');
const actionBtn = document.getElementById('action-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    chances = TOTAL_CHANCES;
    successCount = 0;
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    readyCover.style.display = 'none';
    prepareRound();
});

function prepareRound() {
    timerDisplay.textContent = "0.00";
    timerDisplay.classList.remove('blind');
    resultMessage.textContent = "준비가 되면 타이머를 시작하세요!";
    resultMessage.style.color = "#8d6e63";

    actionBtn.textContent = "??대㉧ ?쒖옉!";
    actionBtn.classList.remove('stop-mode');
    actionBtn.disabled = false;
    isRunning = false;
}

actionBtn.addEventListener('click', () => {
    if (!isRunning) startTimer();
    else stopTimer();
});

function startTimer() {
    isRunning = true;
    startTime = Date.now();

    actionBtn.textContent = "硫덉땄!!";
    actionBtn.classList.add('stop-mode');
    resultMessage.textContent = "10.00초에 맞게 멈추세요!";

    timerInterval = setInterval(() => {
        let elapsedTime = (Date.now() - startTime) / 1000;
        if (elapsedTime >= BLIND_TIME) {
            timerDisplay.textContent = "?.??";
            timerDisplay.classList.add('blind');
        } else {
            timerDisplay.textContent = elapsedTime.toFixed(2);
        }
        if (elapsedTime > 15.00) stopTimer(true);
    }, 10);
}

function stopTimer(isTimeout = false) {
    clearInterval(timerInterval);
    isRunning = false;
    actionBtn.disabled = true;

    let finalTime = (Date.now() - startTime) / 1000;
    if (isTimeout) finalTime = 15.00;

    timerDisplay.textContent = finalTime.toFixed(2);
    timerDisplay.classList.remove('blind');

    checkResult(finalTime);
}

function checkResult(finalTime) {
    chances--;
    chancesDisplay.textContent = chances;

    let diff = Math.abs(finalTime - TARGET_TIME);
    let isHit = diff <= ERROR_MARGIN;

    if (isHit) {
        successCount++;
        successDisplay.textContent = successCount;
        resultMessage.textContent = "🎉 완벽합니다!! 성공!";
        resultMessage.style.color = "#e67700";
        timerDisplay.style.color = "#e67700";
    } else {
        resultMessage.textContent = `💦 아쉽네요! 오차: ${diff.toFixed(2)}초`;
        resultMessage.style.color = "#f03e3e";
        timerDisplay.style.color = "#f03e3e";
    }

    setTimeout(() => {
        timerDisplay.style.color = "#5d4037";

        if (successCount >= GOAL_SUCCESS) endGame(true);
        else if (chances > 0) prepareRound();
        else endGame(false);
    }, 1500);
}

function endGame(isSuccess) {
    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `놀라운 절대 감각!<br><b>10.00초</b>를 맞췄습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `모든 기회를 소진했습니다.<br>다시 도전해보세요!`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        const resultData = { type: 'GAME_RESULT', gameId: 5, success: isSuccess };
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);
        window.parent.postMessage(resultData, '*');
    };
}
