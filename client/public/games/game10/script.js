let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 30; // 10초 안에 30번 흔들기(또는 클릭)

let isGameRunning = false;
let timerId;

// 쉐이킹 감지용 변수
const SHAKE_THRESHOLD = 15; // 이 수치 이상으로 강하게 흔들어야 인정됨
let lastShakeTime = 0;

// 화면 요소 가져오기
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const shakeArea = document.getElementById('shake-area');
const liquid = document.getElementById('liquid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 게임 시작 및 타이머
// =========================================

startBtn.addEventListener('click', async () => {
    // 🍏 아이폰(iOS 13+)의 경우 센서 접근 권한을 물어봐야 합니다.
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            } else {
                alert("센서 권한이 거부되었습니다. 기기 설정에서 모션 센서 접근을 허용해주세요!");
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        // 안드로이드나 일반 PC는 권한 요청 없이 바로 리스너 등록
        window.addEventListener('devicemotion', handleMotion);
    }

    startGameLoop();
});

function startGameLoop() {
    timeLeft = 10;
    score = 0;
    isGameRunning = true;
    
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score;
    liquid.style.height = '0%';
    readyCover.style.display = 'none';
    
    timerId = setInterval(countDown, 1000);
}

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); // 시간 초과
    }
}

// =========================================
// 2. 흔들기 & 클릭 감지 로직
// =========================================

// 모바일 가속도 센서 감지
function handleMotion(event) {
    if (!isGameRunning) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    // x, y, z 축의 가속도를 모두 더해서 얼마나 세게 흔들렸는지 계산
    const totalAcceleration = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

    if (totalAcceleration > SHAKE_THRESHOLD) {
        const currentTime = Date.now();
        // 한 번 흔들고 0.1초(100ms)가 지나야 다음 흔들기로 인정 (중복 방지)
        if (currentTime - lastShakeTime > 100) {
            lastShakeTime = currentTime;
            addScore();
        }
    }
}

// 점수 증가 및 UI 업데이트
function addScore() {
    score++;
    scoreDisplay.textContent = score;

    // 게이지(액체)가 차오르는 높이 계산 (최대 100%)
    let fillPercentage = (score / GOAL_SCORE) * 100;
    if (fillPercentage > 100) fillPercentage = 100;
    liquid.style.height = `${fillPercentage}%`;

    // 목표 달성 시 승리!
    if (score >= GOAL_SCORE) {
        endGame(true);
    }
}

// =========================================
// 3. 게임 종료 및 결과 전송
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);
    
    // 센서 리스너 해제 (배터리 낭비 방지)
    window.removeEventListener('devicemotion', handleMotion);

    if (isSuccess) {
        alert(`🎉 엄청난 열정입니다! 영토를 점령했습니다!`);
    } else {
        alert(`💦 열정이 조금 부족합니다. (달성: ${score}/${GOAL_SCORE})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "다시 하기";

    // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
    const resultData = {
        type: 'GAME_RESULT',
        gameId: 10,
        success: isSuccess
    };

    // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
    console.log("📨 React로 날아갈 쪽지 내용:", resultData);

    // 3. 부모 창으로 쪽지를 진짜 던집니다.
    window.parent.postMessage(resultData, '*');
}