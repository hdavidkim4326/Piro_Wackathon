let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 7;

let isGameRunning = false;
let timerId;

// 🎨 색상 조합 족보 데이터
const RECIPES = [
    { name: "보라색 (Purple)", colors: ["red", "blue"], hex: "#b197fc" },
    { name: "주황색 (Orange)", colors: ["red", "yellow"], hex: "#ff922b" },
    { name: "초록색 (Green)", colors: ["blue", "yellow"], hex: "#51cf66" }
];

// 실제 색상 코드 매핑 (트레이 표시용)
const COLOR_CODES = {
    "red": "#ff6b6b",
    "blue": "#339af0",
    "yellow": "#fcc419"
};

let currentTarget = null;
let selectedColors = []; // 유저가 선택한 색상 2개가 담길 배열

// 🔥 연속 출제 방지를 위한 기억 장치
let previousTargetName = "";
let consecutiveTargetCount = 0;

// 화면 요소 가져오기
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

// =========================================
// 1. 게임 시작 및 타이머
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 10; // 초기화
    score = 0;
    previousTargetName = ""; // 뽑기 기억 장치 초기화
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
        endGame(false); // 시간 초과 실패
    }
}

// 다음 문제 출제 (연속 출제 방지 로직 적용!)
function setNextTarget() {
    clearTray();

    let randomIdx;
    let nextTarget;

    // 🔥 같은 색상이 3번 연속으로 나오려 하면 다시 뽑기! (do-while 반복문)
    do {
        randomIdx = Math.floor(Math.random() * RECIPES.length);
        nextTarget = RECIPES[randomIdx];
    } while (nextTarget.name === previousTargetName && consecutiveTargetCount >= 2);

    // 연속 카운트 기록하기
    if (nextTarget.name === previousTargetName) {
        consecutiveTargetCount++; // 또 같은 거 나왔네? 카운트 증가
    } else {
        previousTargetName = nextTarget.name;
        consecutiveTargetCount = 1; // 새로운 거 나왔으니 카운트 1로 리셋
    }

    currentTarget = nextTarget;

    targetBox.style.backgroundColor = currentTarget.hex;
    targetName.textContent = currentTarget.name;
    feedbackText.textContent = "어떤 색을 섞어야 할까요?";
    feedbackText.style.color = "#495057";
}

// =========================================
// 2. 색상 선택 및 조합 로직
// =========================================

// 팔레트 버튼 클릭 이벤트
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning || selectedColors.length >= 2) return;

        const pickedColor = btn.dataset.color;
        selectedColors.push(pickedColor);
        updateTrayUI();

        // 2개가 꽉 차면 정답 확인!
        if (selectedColors.length === 2) {
            checkMix();
        }
    });
});

// 트레이(빈칸) 시각적 업데이트
function updateTrayUI() {
    // 첫 번째 슬롯
    if (selectedColors[0]) {
        slot1.style.backgroundColor = COLOR_CODES[selectedColors[0]];
        slot1.style.border = "3px solid white";
    } else {
        slot1.style.backgroundColor = "#f8f9fa";
        slot1.style.border = "3px dashed #ced4da";
    }

    // 두 번째 슬롯
    if (selectedColors[1]) {
        slot2.style.backgroundColor = COLOR_CODES[selectedColors[1]];
        slot2.style.border = "3px solid white";
    } else {
        slot2.style.backgroundColor = "#f8f9fa";
        slot2.style.border = "3px dashed #ced4da";
    }
}

// 트레이 비우기 (리셋 버튼용)
resetBtn.addEventListener('click', clearTray);

function clearTray() {
    selectedColors = [];
    updateTrayUI();
}

// =========================================
// 3. 정답 판정
// =========================================

function checkMix() {
    // 순서 상관없이 비교하기 위해 정렬 후 문자로 합침 (예: "blue,red" === "blue,red")
    const userMix = [...selectedColors].sort().join(',');
    const correctMix = [...currentTarget.colors].sort().join(',');

    if (userMix === correctMix) {
        // 정답!
        score++;
        scoreDisplay.textContent = score;
        feedbackText.textContent = "✨ 정답입니다!";
        feedbackText.style.color = "#20c997";

        if (score >= GOAL_SCORE) {
            setTimeout(() => endGame(true), 300); // 승리!
        } else {
            setTimeout(setNextTarget, 400); // 0.4초 뒤 다음 문제
        }
    } else {
        // 오답!
        feedbackText.textContent = "❌ 틀렸습니다! 다시 섞어보세요.";
        feedbackText.style.color = "#ff6b6b";
        setTimeout(clearTray, 600); // 0.6초 뒤에 트레이 자동 비워줌
    }
}

// =========================================
// 4. 게임 종료 및 결과 전송
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        alert(`🎉 천재적인 색채 감각! 영토를 점령했습니다!`);
    } else {
        alert(`💦 아쉽게 실패했습니다. 다시 도전해보세요! (달성: ${score}/${GOAL_SCORE})`);
    }

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
}