let timeLeft = 15; // 15초 버티기
let noiseLevel = 50; // 시작 소음 수치 (50%)

let isGameRunning = false;
let timerId;
let gaugeTimerId;

// 🔥 밸런스 패치 (난이도 급상승!)
let noiseIncrease = 1.5; // 이제 상수가 아니라 변수입니다! (점점 빨라짐)
const SHH_DECREASE = 30; // 8 -> 25로 대폭 상향! (누를 때마다 훅훅 떨어짐)

// 화면 요소 가져오기
const timeDisplay = document.getElementById('time-left');
const noiseBar = document.getElementById('noise-bar');
const feedbackText = document.getElementById('feedback-text');
const shhBtn = document.getElementById('shh-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 게임 시작 및 타이머
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 15;
    noiseLevel = 50;
    noiseIncrease = 1.5; // 게임 시작할 때 차오르는 속도 초기화
    isGameRunning = true;

    timeDisplay.textContent = timeLeft;
    noiseBar.style.width = noiseLevel + '%';
    noiseBar.style.background = 'linear-gradient(90deg, #ffd43b, #ff6b6b)';
    feedbackText.textContent = "게이지를 유지하세요!";
    feedbackText.style.color = "#495057";

    readyCover.style.display = 'none';
    shhBtn.disabled = false;

    // 1초마다 남은 시간 깎기
    timerId = setInterval(countDown, 1000);
    // 0.1초마다 소음 게이지 올리기
    gaugeTimerId = setInterval(increaseNoise, 100);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    // 🔥 핵심 로직: 1초가 지날 때마다 게이지 차오르는 속도가 점점 더 빨라집니다!
    noiseIncrease += 1.2;

    // 15초를 무사히 버텼다면 성공!
    if (timeLeft <= 0) {
        endGame(true);
    }
}

// =========================================
// 2. 게이지 상승 및 판정
// =========================================

function increaseNoise() {
    if (!isGameRunning) return;

    // 시간이 지날수록 더 큰 값(noiseIncrease)이 더해짐
    noiseLevel += noiseIncrease;
    updateGaugeUI();

    // 실패 조건 1: 100% 도달 (경고 퇴장)
    if (noiseLevel >= 100) {
        feedbackText.textContent = "너무 시끄럽습니다! 쫓겨났습니다 😭";
        feedbackText.style.color = "#ff6b6b";
        noiseBar.style.background = "#ff6b6b";
        endGame(false);
    }
    // 실패 조건 2: 0% 도달 (수면 상태)
    else if (noiseLevel <= 0) {
        feedbackText.textContent = "너무 조용해서 잠들었습니다 💤";
        feedbackText.style.color = "#4dabf7";
        noiseBar.style.background = "#4dabf7";
        endGame(false);
    }
}

function updateGaugeUI() {
    if (noiseLevel > 100) noiseLevel = 100;
    if (noiseLevel < 0) noiseLevel = 0;

    noiseBar.style.width = noiseLevel + '%';

    // 안전 지대(30~70)를 벗어나면 시각적 경고
    if (noiseLevel < 30 || noiseLevel > 70) {
        noiseBar.style.boxShadow = "0 0 15px rgba(255, 107, 107, 0.8)";
    } else {
        noiseBar.style.boxShadow = "none";
    }
}

// =========================================
// 3. 버튼 클릭 (소음 감소)
// =========================================

shhBtn.addEventListener('mousedown', dropNoise);
shhBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropNoise();
});

function dropNoise() {
    if (!isGameRunning) return;

    // 버튼 누를 때마다 게이지가 훅훅 감소
    noiseLevel -= SHH_DECREASE;
    updateGaugeUI();
}

// =========================================
// 4. 게임 종료 및 결과 전송
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(gaugeTimerId);
    shhBtn.disabled = true;

    setTimeout(() => {
        if (isSuccess) {
            alert(`🎉 도서관의 매너를 지켰습니다! 점령 성공!`);
        } else {
            alert(`💦 균형을 잃었습니다. 점령 실패!`);
        }

        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
        const resultData = {
            type: 'GAME_RESULT',
            gameId: 8,
            success: isSuccess
        };

        // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);

        // 3. 부모 창으로 쪽지를 진짜 던집니다.
        window.parent.postMessage(resultData, '*');
    }, 100);
}