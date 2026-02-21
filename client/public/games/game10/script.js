let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 30; 

let isGameRunning = false;
let timerId;

const SHAKE_THRESHOLD = 15; 
let lastShakeTime = 0;

const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const shakeArea = document.getElementById('shake-area');
const liquid = document.getElementById('liquid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', async () => {
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
        endGame(false); 
    }
}

function handleMotion(event) {
    if (!isGameRunning) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const totalAcceleration = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

    if (totalAcceleration > SHAKE_THRESHOLD) {
        const currentTime = Date.now();
        if (currentTime - lastShakeTime > 100) {
            lastShakeTime = currentTime;
            addScore();
        }
    }
}

function addScore() {
    score++;
    scoreDisplay.textContent = score;

    let fillPercentage = (score / GOAL_SCORE) * 100;
    if (fillPercentage > 100) fillPercentage = 100;
    liquid.style.height = `${fillPercentage}%`;

    if (score >= GOAL_SCORE) {
        endGame(true);
    }
}

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);
    
    window.removeEventListener('devicemotion', handleMotion);

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `엄청난 열정!<br>게이지를 <b>100%</b> 채웠습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `열정이 조금 부족합니다.<br>(달성: <b>${score}</b>/${GOAL_SCORE})`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
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
    };
}