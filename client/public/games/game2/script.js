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
const readyCover = document.getElementById('ready-cover'); // ✨ 추가됨

// 모달 요소 가져오기
const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// 🎬 바를 좌우로 부드럽게 움직이는 애니메이션 함수
function moveBar() {
    if (!isMoving) return;

    barPosition += speed * barDirection;

    if (barPosition >= 98) {
        barPosition = 98;
        barDirection = -1;
    } else if (barPosition <= 0) {
        barPosition = 0;
        barDirection = 1;
    }

    movingBar.style.left = barPosition + '%';
    animationId = requestAnimationFrame(moveBar);
}

// 🕹️ 라운드 시작 함수
function startRound() {
    barPosition = 0;
    barDirection = 1;
    movingBar.style.left = '0%';
    movingBar.style.backgroundColor = '#ff6b6b'; 

    isMoving = true;
    actionBtn.disabled = false;
    moveBar();
}

// [게임 시작] 버튼 클릭
startBtn.addEventListener('click', () => {
    chances = 7;
    successCount = 0;
    speed = 1.5; 
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    // ✨ 커버 숨기기 & 텍스트 세팅
    readyCover.style.display = 'none';
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

    // 2. 판별
    const minSuccess = 35;
    const maxSuccess = 65;

    if (barPosition >= minSuccess && barPosition <= maxSuccess) {
        successCount++;
        successDisplay.textContent = successCount;
        movingBar.style.backgroundColor = '#40c057'; // 초록색
        speed += 0.7; 
    } else {
        movingBar.style.backgroundColor = '#adb5bd'; // 회색
    }

    chances--;
    chancesDisplay.textContent = chances;

    // 3. 잠깐 멈췄다가 다음 라운드 진행
    setTimeout(() => {
        if (chances > 0) {
            startRound();
        } else {
            endGame();
        }
    }, 800);
});

// 🏁 게임 종료 및 모달 띄우기
function endGame() {
    actionBtn.textContent = "종료!";
    
    const isSuccess = successCount >= GOAL_SUCCESS;

    // 1️⃣ 커스텀 모달 내용 세팅
    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `정확한 타이밍!<br>총 <b>${successCount}</b>번 맞췄습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `아쉽네요!<br><b>${successCount}</b>번 성공에 그쳤습니다.`;
    }

    // 2️⃣ 모달 띄우기
    resultModal.classList.add('show');

    // 3️⃣ 모달 '확인' 버튼 클릭 시 동작
    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');

        // 커버 다시 덮기
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        // 1. 보낼 데이터를 변수로 예쁘게 포장합니다. (gameId: 2)
        const resultData = {
            type: 'GAME_RESULT',
            gameId: 2,
            success: isSuccess
        };

        // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);

        // 3. 부모 창으로 쪽지를 진짜 던집니다.
        window.parent.postMessage(resultData, '*');
    };
}