let chances = 7;
let successCount = 0;
const GOAL_SUCCESS = 4; // 4번 성공 시 점령

let isMoving = false;
let barPosition = 0; // 0 ~ 100 (%)
let barDirection = 1; // 1: 오른쪽, -1: 왼쪽
let speed = 1.5; // 바 이동 속도
let animationId;

// 화면 요소 가져오기
const chancesDisplay = document.getElementById('chances-left');
const successDisplay = document.getElementById('success-count');
const movingBar = document.getElementById('moving-bar');
const actionBtn = document.getElementById('action-btn');
const startBtn = document.getElementById('start-btn');

// 🎬 바를 좌우로 부드럽게 움직이는 애니메이션 함수
function moveBar() {
    if (!isMoving) return;

    barPosition += speed * barDirection;

    // 양쪽 끝에 닿으면 방향 반전
    if (barPosition >= 98) {
        barPosition = 98;
        barDirection = -1;
    } else if (barPosition <= 0) {
        barPosition = 0;
        barDirection = 1;
    }

    movingBar.style.left = barPosition + '%';
    animationId = requestAnimationFrame(moveBar); // 모니터 주사율에 맞춰 부드럽게 호출
}

// 🕹️ 라운드 시작 함수
function startRound() {
    barPosition = 0;
    barDirection = 1;
    movingBar.style.left = '0%';
    movingBar.style.backgroundColor = '#ff6b6b'; // 빨간색으로 초기화

    isMoving = true;
    actionBtn.disabled = false;
    moveBar();
}

// [게임 시작] 버튼 클릭
startBtn.addEventListener('click', () => {
    chances = 7;
    successCount = 0;
    speed = 1.5; // 초기 속도
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    startBtn.style.display = 'none';
    actionBtn.textContent = "멈춤!";

    startRound();
});

// [멈춤!] 버튼 클릭
actionBtn.addEventListener('click', () => {
    if (!isMoving) return;

    // 1. 움직임 멈추기
    isMoving = false;
    cancelAnimationFrame(animationId);
    actionBtn.disabled = true;

    // 2. 타겟 존(35% ~ 65%) 안에 있는지 판별
    const minSuccess = 35;
    const maxSuccess = 65;

    if (barPosition >= minSuccess && barPosition <= maxSuccess) {
        successCount++;
        successDisplay.textContent = successCount;
        movingBar.style.backgroundColor = '#20c997'; // 성공 시 초록색으로 변경!
        speed += 0.7; // 성공할 때마다 게이지 속도가 살짝 빨라짐 (긴장감 UP!)
    } else {
        movingBar.style.backgroundColor = '#495057'; // 실패 시 어두운 회색으로 변경
    }

    chances--;
    chancesDisplay.textContent = chances;

    // 3. 잠깐(0.8초) 멈췄다가 다음 라운드 진행
    setTimeout(() => {
        if (chances > 0) {
            startRound();
        } else {
            endGame();
        }
    }, 800);
});

// 🏁 게임 종료 처리
function endGame() {
    actionBtn.textContent = "종료!";
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "다시 하기";

    const isSuccess = successCount >= GOAL_SUCCESS;

    if (isSuccess) {
        alert(`🎉 성공! 7번 중 ${successCount}번 정확히 맞췄습니다!`);
    } else {
        alert(`💦 아쉽네요! ${successCount}번 성공에 그쳤습니다.`);
    }

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