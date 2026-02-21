// 게임 설정
const TARGET_TIME = 5.00;
const BLIND_TIME = 2.00; // 2초부터 숫자가 가려짐
const ERROR_MARGIN = 0.20; // 오차 허용 범위 (4.80 ~ 5.20초)
const TOTAL_CHANCES = 3;
const GOAL_SUCCESS = 1; // 3번 중 1번만 성공해도 점령!

let chances = TOTAL_CHANCES;
let successCount = 0;

let startTime = 0;
let timerInterval;
let isRunning = false;

// 화면 요소
const chancesDisplay = document.getElementById('chances-left');
const successDisplay = document.getElementById('success-count');
const timerDisplay = document.getElementById('timer-display');
const resultMessage = document.getElementById('result-message');
const actionBtn = document.getElementById('action-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 초기화 및 게임 시작
// =========================================

startBtn.addEventListener('click', () => {
    chances = TOTAL_CHANCES;
    successCount = 0;
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    readyCover.style.display = 'none';
    prepareRound();
});

// 한 라운드(시도) 준비 상태
function prepareRound() {
    timerDisplay.textContent = "0.00";
    timerDisplay.classList.remove('blind');
    resultMessage.textContent = "준비가 되면 타이머를 시작하세요!";
    resultMessage.style.color = "#868e96";

    actionBtn.textContent = "타이머 시작!";
    actionBtn.classList.remove('stop-mode');
    actionBtn.disabled = false;
    isRunning = false;
}

// =========================================
// 2. 타이머 동작 (시작 & 멈춤)
// =========================================

actionBtn.addEventListener('click', () => {
    if (!isRunning) {
        // 타이머 시작!
        startTimer();
    } else {
        // 타이머 멈춤!
        stopTimer();
    }
});

function startTimer() {
    isRunning = true;
    startTime = Date.now(); // 정확한 시작 시간 기록

    actionBtn.textContent = "멈춤!!";
    actionBtn.classList.add('stop-mode');
    resultMessage.textContent = "5.00초에 맞게 멈추세요!";

    // 화면 업데이트 루프
    timerInterval = setInterval(() => {
        let elapsedTime = (Date.now() - startTime) / 1000;

        // 2초가 넘어가면 블라인드 처리 (?.??)
        if (elapsedTime >= BLIND_TIME) {
            timerDisplay.textContent = "?.??";
            timerDisplay.classList.add('blind');
        } else {
            // 2초 전까지는 실시간 숫자 보여줌
            timerDisplay.textContent = elapsedTime.toFixed(2);
        }

        // 혹시 유저가 안 누르고 잠수 타면 10초에서 강제 종료 (안전장치)
        if (elapsedTime > 10.00) {
            stopTimer(true);
        }
    }, 10); // 0.01초마다 화면 갱신
}

function stopTimer(isTimeout = false) {
    clearInterval(timerInterval);
    isRunning = false;
    actionBtn.disabled = true;

    // 실제 걸린 시간 계산
    let finalTime = (Date.now() - startTime) / 1000;
    if (isTimeout) finalTime = 10.00;

    // 블라인드 풀고 실제 멈춘 시간 보여주기
    timerDisplay.textContent = finalTime.toFixed(2);
    timerDisplay.classList.remove('blind');

    checkResult(finalTime);
}

// =========================================
// 3. 결과 판정 및 다음 단계
// =========================================

function checkResult(finalTime) {
    chances--;
    chancesDisplay.textContent = chances;

    // 4.80 ~ 5.20 사이인지 확인
    let diff = Math.abs(finalTime - TARGET_TIME);
    let isHit = diff <= ERROR_MARGIN;

    if (isHit) {
        successCount++;
        successDisplay.textContent = successCount;
        resultMessage.textContent = "🎉 완벽합니다!! 성공!";
        resultMessage.style.color = "#20c997";
        timerDisplay.style.color = "#20c997";
    } else {
        resultMessage.textContent = `💦 아쉽네요! 오차: ${diff.toFixed(2)}초`;
        resultMessage.style.color = "#ff6b6b";
        timerDisplay.style.color = "#ff6b6b";
    }

    // 1.5초 뒤에 다음 라운드로 가거나 게임 종료
    setTimeout(() => {
        timerDisplay.style.color = "#333"; // 색상 원상복구

        if (successCount >= GOAL_SUCCESS) {
            endGame(true); // 1번이라도 성공하면 바로 승리 처리!
        } else if (chances > 0) {
            prepareRound(); // 기회가 남았으면 다음 라운드
        } else {
            endGame(false); // 기회 소진 시 실패
        }
    }, 1500);
}

function endGame(isSuccess) {
    if (isSuccess) {
        alert(`🎉 놀라운 감각이네요! 영토를 점령했습니다!`);
    } else {
        alert(`💦 모든 기회를 소진했습니다. 점령 실패!`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "다시 하기";

    // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
    const resultData = {
        type: 'GAME_RESULT',
        gameId: 5,
        success: isSuccess
    };

    // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
    console.log("📨 React로 날아갈 쪽지 내용:", resultData);

    // 3. 부모 창으로 쪽지를 진짜 던집니다.
    window.parent.postMessage(resultData, '*');
}