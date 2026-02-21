let timeLeft = 10; // 10초 타임어택
let successCount = 0;
const GOAL_SUCCESS = 15; // 15번 성공 목표

let isGameRunning = false;
let timerId;

// 방향 데이터 (정답 비교용)
const DIRECTIONS = [
    { dir: 'UP', icon: '⬆️' },
    { dir: 'DOWN', icon: '⬇️' },
    { dir: 'LEFT', icon: '⬅️' },
    { dir: 'RIGHT', icon: '➡️' }
];
let currentTargetDir = ''; 

// 화면 요소 가져오기
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('success-count');
const swipeArea = document.getElementById('swipe-area');
const arrowDisplay = document.getElementById('arrow-display');
const feedbackText = document.getElementById('feedback-text');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 게임 시작 및 타이머
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 10;
    successCount = 0;
    isGameRunning = true;
    
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = successCount;
    readyCover.style.display = 'none';
    swipeArea.style.backgroundColor = '#e3f2fd';
    
    setNextArrow(); // 첫 번째 화살표 띄우기
    timerId = setInterval(countDown, 1000);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// 다음 화살표 랜덤으로 뽑기
function setNextArrow() {
    const randomIdx = Math.floor(Math.random() * DIRECTIONS.length);
    currentTargetDir = DIRECTIONS[randomIdx].dir;
    arrowDisplay.textContent = DIRECTIONS[randomIdx].icon;
    feedbackText.textContent = "방향에 맞게 드래그!";
    feedbackText.style.color = "#495057";
}

// =========================================
// 2. 스와이프 (드래그) 방향 감지 로직
// =========================================

let startX = 0;
let startY = 0;
const SWIPE_THRESHOLD = 30; // 이 픽셀(30px) 이상 밀어야 인정 (살짝 닿은 건 무시)

// (1) 터치/마우스 누를 때 시작 좌표 저장
function handleSwipeStart(e) {
    if (!isGameRunning) return;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
}

// (2) 터치/마우스 뗄 때 끝 좌표 계산
function handleSwipeEnd(e) {
    if (!isGameRunning) return;
    let endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    let endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // 얼마나 밀었는지 계산 (끝 좌표 - 시작 좌표)
    let diffX = endX - startX;
    let diffY = endY - startY;

    // 너무 조금 움직였으면 그냥 클릭한 걸로 간주하고 무시
    if (Math.abs(diffX) < SWIPE_THRESHOLD && Math.abs(diffY) < SWIPE_THRESHOLD) return;

    let userSwipeDir = '';

    // X축으로 더 많이 밀었는지, Y축으로 더 많이 밀었는지 판별
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 좌우 스와이프
        userSwipeDir = diffX > 0 ? 'RIGHT' : 'LEFT';
    } else {
        // 상하 스와이프
        userSwipeDir = diffY > 0 ? 'DOWN' : 'UP';
    }

    checkSwipe(userSwipeDir);
}

// 이벤트 리스너 등록 (모바일 터치 + PC 마우스 모두 지원)
swipeArea.addEventListener('touchstart', handleSwipeStart);
swipeArea.addEventListener('touchend', handleSwipeEnd);
swipeArea.addEventListener('mousedown', handleSwipeStart);
swipeArea.addEventListener('mouseup', handleSwipeEnd);

// =========================================
// 3. 정답 판별 및 게임 종료
// =========================================

function checkSwipe(userSwipeDir) {
    // 휙! 하는 애니메이션 효과를 위해 잠깐 화살표를 축소시킴
    arrowDisplay.style.transform = 'scale(0.8)';
    setTimeout(() => arrowDisplay.style.transform = 'scale(1)', 100);

    if (userSwipeDir === currentTargetDir) {
        // 정답!
        successCount++;
        scoreDisplay.textContent = successCount;
        
        // 시각적 피드백 (배경 초록색 반짝)
        swipeArea.style.backgroundColor = '#d3f9d8';
        setTimeout(() => swipeArea.style.backgroundColor = '#e3f2fd', 150);
        
        // 15번을 다 채웠으면 즉시 성공 종료
        if (successCount >= GOAL_SUCCESS) {
            endGame();
        } else {
            setNextArrow(); // 다음 문제 출제
        }
    } else {
        // 오답!
        feedbackText.textContent = "틀렸습니다! 다시!";
        feedbackText.style.color = "#ff6b6b";
        
        // 시각적 피드백 (배경 빨간색 반짝)
        swipeArea.style.backgroundColor = '#ffe3e3';
        setTimeout(() => swipeArea.style.backgroundColor = '#e3f2fd', 150);
    }
}

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);

    const isSuccess = successCount >= GOAL_SUCCESS;

    if (isSuccess) {
        alert(`🎉 엄청난 순발력! ${successCount}번 방향을 맞췄습니다!`);
    } else {
        alert(`💦 시간이 부족합니다. (성공: ${successCount}/${GOAL_SUCCESS})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "다시 하기";

    // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
    const resultData = {
        type: 'GAME_RESULT',
        gameId: 6,
        success: isSuccess
    };

    // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
    console.log("📨 React로 날아갈 쪽지 내용:", resultData);

    // 3. 부모 창으로 쪽지를 진짜 던집니다.
    window.parent.postMessage(resultData, '*');
}