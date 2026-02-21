let score = 0;
let timeLeft = 30;
const GOAL_SCORE = 150; // 목표 점수

let gameTimerId;    // 남은 시간 타이머
let spawnTimerId;   // 아이템 생성 타이머
let gameLoopId;     // 게임 메인 루프 (움직임, 충돌)
let isGameRunning = false;

// 🔥 난이도 상승을 위해 속도를 '변수'로 변경
let itemSpeed = 3;
const SPAWN_RATE = 400; // 아이템 생성 주기 (ms)

// 화면 요소 가져오기
const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const gameArea = document.getElementById('game-area');
const catcher = document.getElementById('catcher');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

let activeItems = []; // 화면에 떠있는 아이템들 관리 배열

// =========================================
// 1. 게임 로직 (시작, 종료, 타이머)
// =========================================

startBtn.addEventListener('click', startGame);

function startGame() {
    // 초기화
    score = 0;
    timeLeft = 30;
    itemSpeed = 3; // 시작할 때 초기 속도 세팅
    activeItems = [];
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    isGameRunning = true;

    // 기존 아이템 다 지우기
    const existingItems = document.querySelectorAll('.item');
    existingItems.forEach(item => item.remove());

    // UI 변경
    readyCover.style.display = 'none';
    catcher.style.left = '50%';

    // 타이머 및 루프 시작
    gameTimerId = setInterval(countDown, 1000);
    spawnTimerId = setInterval(spawnItem, SPAWN_RATE);
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 남은 시간 카운트다운
function countDown() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    // 🔥 매초마다 아이템 떨어지는 속도가 0.2씩 빨라집니다! (후반부 텐션 폭발)
    itemSpeed += 0.2;

    if (timeLeft <= 0) {
        endGame();
    }
}

// =========================================
// 2. 조작 (바구니 움직이기 - 모바일 터치 포함)
// =========================================

function moveCatcher(e) {
    if (!isGameRunning) return;

    // 터치 이벤트와 마우스 이벤트 좌표 통일
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const gameAreaRect = gameArea.getBoundingClientRect();

    // 게임 영역 내에서의 상대적 X 좌표 계산
    let relativeX = clientX - gameAreaRect.left;

    // 바구니가 화면 밖으로 나가지 않도록 고정
    if (relativeX < 0) relativeX = 0;
    if (relativeX > gameAreaRect.width) relativeX = gameAreaRect.width;

    catcher.style.left = `${relativeX}px`;
}

gameArea.addEventListener('mousemove', moveCatcher);
gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 모바일 터치 시 스크롤 방지
    moveCatcher(e);
}, { passive: false });

// =========================================
// 3. 아이템 생성 및 관리
// =========================================

function spawnItem() {
    if (!isGameRunning) return;

    const item = document.createElement('div');
    item.classList.add('item');

    // 🔥 폭탄 생성 확률
    const isGood = Math.random() > 0.35;

    if (isGood) {
        item.textContent = '🏫';
        item.classList.add('good');
        item.dataset.points = 10;
    } else {
        item.textContent = '💣';
        item.classList.add('bad');
        item.dataset.points = -20;
    }

    const randomX = Math.floor(Math.random() * (gameArea.offsetWidth - 30));
    item.style.left = `${randomX}px`;
    item.style.top = '-30px';

    gameArea.appendChild(item);
    activeItems.push(item);
}

// =========================================
// 4. 게임 메인 루프 (애니메이션 + 충돌 체크)
// =========================================

function gameLoop() {
    if (!isGameRunning) return;

    const catcherRect = catcher.getBoundingClientRect();

    activeItems.forEach((item, index) => {
        // 1) 아이템 아래로 이동 (점점 빨라지는 itemSpeed 반영)
        let currentTop = parseFloat(item.style.top || -30);
        item.style.top = `${currentTop + itemSpeed}px`;

        const itemRect = item.getBoundingClientRect();

        // 2) 충돌 체크 (바구니와 아이템이 겹쳤는가?)
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
        }
        // 3) 아까 수정한 화면 바닥 뚫고 지나간 아이템 제거
        else if (currentTop > gameArea.offsetHeight) {
            item.remove();
            activeItems.splice(index, 1);
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

// =========================================
// 5. 게임 종료
// =========================================

function endGame() {
    isGameRunning = false;
    clearInterval(gameTimerId);
    clearInterval(spawnTimerId);
    cancelAnimationFrame(gameLoopId);

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        alert(`🎉 성공! ${score}점을 획득하여 목표를 달성했습니다!`);
    } else {
        alert(`💦 아쉽네요! ${score}점에 그쳐 실패했습니다. (목표: ${GOAL_SCORE}점)`);
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