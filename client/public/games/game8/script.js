let timeLeft = 15; 
let noiseLevel = 50; 

let isGameRunning = false;
let timerId;
let gaugeTimerId;

let noiseIncrease = 1.5; 
const SHH_DECREASE = 30; 

const timeDisplay = document.getElementById('time-left');
const noiseBar = document.getElementById('noise-bar');
const feedbackText = document.getElementById('feedback-text');
const shhBtn = document.getElementById('shh-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    timeLeft = 15;
    noiseLevel = 50;
    noiseIncrease = 1.5; 
    isGameRunning = true;

    timeDisplay.textContent = timeLeft;
    noiseBar.style.width = noiseLevel + '%';
    noiseBar.style.background = 'linear-gradient(90deg, #ffc078, #f03e3e)';
    feedbackText.textContent = "게이지를 유지하세요!";
    feedbackText.style.color = "#8d6e63";

    readyCover.style.display = 'none';
    shhBtn.disabled = false;

    timerId = setInterval(countDown, 1000);
    gaugeTimerId = setInterval(increaseNoise, 100);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    noiseIncrease += 1.2;

    if (timeLeft <= 0) {
        // 🔥 수정 1: 15초 종료 시, 게이지가 30~70 (초록색) 영역에 있는지 깐깐하게 검사합니다!
        if (noiseLevel >= 30 && noiseLevel <= 70) {
            endGame(true);
        } else {
            endGame(false, "out_of_zone"); // 영역 밖이면 실패
        }
    }
}

function increaseNoise() {
    if (!isGameRunning) return;

    noiseLevel += noiseIncrease;
    updateGaugeUI();

    if (noiseLevel >= 100) {
        feedbackText.textContent = "너무 시끄럽습니다! 쫓겨났습니다 😭";
        feedbackText.style.color = "#f03e3e";
        noiseBar.style.background = "#f03e3e";
        endGame(false, "noise");
    } 
}

function updateGaugeUI() {
    if (noiseLevel > 100) noiseLevel = 100;
    if (noiseLevel < 0) noiseLevel = 0;

    noiseBar.style.width = noiseLevel + '%';

    if (noiseLevel < 30 || noiseLevel > 70) {
        noiseBar.style.boxShadow = "0 0 15px rgba(240, 62, 62, 0.8)";
    } else {
        noiseBar.style.boxShadow = "none";
    }
}

shhBtn.addEventListener('mousedown', dropNoise);
shhBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropNoise();
});

function dropNoise() {
    if (!isGameRunning) return;
    
    noiseLevel -= SHH_DECREASE;
    updateGaugeUI();

    // 🔥 수정 2: 광클해서 게이지가 0으로 떨어졌을 때 즉시 실패를 감지합니다!
    if (noiseLevel <= 0) {
        feedbackText.textContent = "너무 조용해서 잠들었습니다 💤";
        feedbackText.style.color = "#4dabf7";
        noiseBar.style.background = "#4dabf7";
        endGame(false, "sleep");
    }
}

function endGame(isSuccess, failReason = "") {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(gaugeTimerId);
    shhBtn.disabled = true;

    // 모달이 뜨기 전에 배경이 빨갛게/파랗게 변하는 걸 살짝 보여주기 위해 0.2초 딜레이를 줍니다.
    setTimeout(() => {
        if (isSuccess) {
            modalTitle.textContent = "🎉 점령 성공!";
            modalTitle.style.color = "#e67700";
            modalMessage.innerHTML = `완벽한 균형 감각!<br><b>15초</b> 동안 무사히 버텼습니다!`;
        } else {
            modalTitle.textContent = "💦 점령 실패";
            modalTitle.style.color = "#f03e3e";
            
            // 🔥 수정 3: 실패 이유에 따라 모달창 멘트가 아주 디테일하게 바뀝니다!
            if(failReason === "noise") {
                modalMessage.innerHTML = `<b>너무 시끄럽습니다! 쫓겨났습니다 😭</b><br>게이지가 폭발했습니다.`;
            } else if (failReason === "sleep") {
                modalMessage.innerHTML = `<b>너무 조용해서 잠들었습니다 💤</b><br>게이지가 바닥났습니다.`;
            } else if (failReason === "out_of_zone") {
                modalMessage.innerHTML = `<b>시간 종료!</b><br>마지막 순간에 게이지가<br>초록색 구역을 벗어났습니다.`;
            }
        }

        resultModal.classList.add('show');

        modalCloseBtn.onclick = () => {
            resultModal.classList.remove('show');
            readyCover.style.display = 'flex';
            startBtn.textContent = "다시 하기";

            const resultData = {
                type: 'GAME_RESULT',
                gameId: 8,
                success: isSuccess
            };

            console.log("📨 React로 날아갈 쪽지 내용:", resultData);
            window.parent.postMessage(resultData, '*');
        };
    }, 200);
}