let score = 0;
let timeLeft = 20;
const GOAL_SCORE = 15;

let isGameRunning = false;
let timerId;
let moleTimerId;

// 화면 요소 가져오기
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const holes = document.querySelectorAll('.hole');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 게임 시작 및 타이머
// =========================================

startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 20;
    isGameRunning = true;
    
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    readyCover.style.display = 'none';

    // 1초마다 남은 시간 감소
    timerId = setInterval(countDown, 1000);
    
    // 0.6초마다 랜덤하게 두더지 생성
    moleTimerId = setInterval(popMole, 600); 
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// =========================================
// 2. 두더지 생성 로직
// =========================================

function popMole() {
    if (!isGameRunning) return;

    // 빈 구멍 중 하나를 무작위로 선택
    const randomIdx = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIdx];

    // 만약 고른 구멍에 이미 두더지가 있다면 패스
    if (hole.querySelector('.mole')) return;

    // 새로운 두더지 엘리먼트 만들기
    const mole = document.createElement('div');
    mole.classList.add('mole');

    // 70% 확률로 라이벌(😈), 30% 확률로 우리 학교(🏫) 출현
    const isRival = Math.random() < 0.7;
    mole.textContent = isRival ? '😈' : '🏫';
    mole.dataset.type = isRival ? 'rival' : 'ours';
    mole.dataset.whacked = 'false'; // 아직 맞기 전 상태

    // 모바일 터치와 PC 마우스 클릭 모두 감지 (반응속도 최적화)
    mole.addEventListener('mousedown', whack);
    mole.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 더블 탭 확대 등 모바일 기본 동작 방지
        whack.call(mole);
    });

    hole.appendChild(mole);

    // 구멍에 넣자마자 살짝 딜레이 후 위로 올라오는 애니메이션 실행
    setTimeout(() => {
        mole.classList.add('up');
    }, 50);

    // 일정 시간(0.8초 ~ 1.3초 랜덤)이 지나면 다시 내려가고 삭제됨
    const stayTime = 800 + Math.random() * 500;
    setTimeout(() => {
        if (!mole.classList.contains('up')) return; // 이미 맞아서 내려갔으면 무시
        mole.classList.remove('up');
        
        // 애니메이션 끝나면 DOM에서 지우기
        setTimeout(() => {
            if (mole.parentNode === hole) hole.removeChild(mole);
        }, 200);
    }, stayTime);
}

// =========================================
// 3. 두더지 타격(클릭) 판정
// =========================================

function whack() {
    if (!isGameRunning) return;
    if (this.dataset.whacked === 'true') return; // 이미 때린 놈은 두 번 못 때림

    this.dataset.whacked = 'true';
    this.classList.remove('up'); // 맞으면 즉시 밑으로 숨음

    if (this.dataset.type === 'rival') {
        // 정답! 점수 +1
        score++;
        this.textContent = '💥'; // 타격 이펙트로 변경
    } else {
        // 오답! (우리 학교 때림) 점수 -2
        score = Math.max(0, score - 2); // 0점 밑으로는 안 내려가게 방어
        this.textContent = '❌'; 
    }

    scoreDisplay.textContent = score;

    // 잠시 후 삭제
    setTimeout(() => {
        if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);

    // 15점을 달성했으면 즉시 성공 종료!
    if (score >= GOAL_SCORE) {
        endGame();
    }
}

// =========================================
// 4. 게임 종료 및 결과 전송
// =========================================

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(moleTimerId);

    // 화면에 남은 두더지들 청소
    document.querySelectorAll('.mole').forEach(mole => mole.remove());

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        alert(`🎉 타격왕! ${timeLeft}초를 남기고 영토를 점령했습니다!`);
    } else {
        alert(`💦 점수 부족! 라이벌을 더 빠르게 퇴치하세요. (최종 점수: ${score})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "다시 하기";

    // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
    const resultData = {
        type: 'GAME_RESULT',
        gameId: 7,
        success: isSuccess
    };

    // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
    console.log("📨 React로 날아갈 쪽지 내용:", resultData);

    // 3. 부모 창으로 쪽지를 진짜 던집니다.
    window.parent.postMessage(resultData, '*');
}