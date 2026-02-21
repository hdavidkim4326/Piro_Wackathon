let score = 0;
let timeLeft = 20;
const GOAL_SCORE = 15;

let isGameRunning = false;
let timerId;
let moleTimerId;

const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const holes = document.querySelectorAll('.hole');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 20;
    isGameRunning = true;
    
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    readyCover.style.display = 'none';

    timerId = setInterval(countDown, 1000);
    moleTimerId = setInterval(popMole, 600); 
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) endGame();
}

function popMole() {
    if (!isGameRunning) return;

    const randomIdx = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIdx];

    if (hole.querySelector('.mole')) return;

    const mole = document.createElement('div');
    mole.classList.add('mole');

    // 🔥 나쁜 벌레(🐛)와 착한 다람쥐(🐿️) 등장 로직!
    const isBad = Math.random() < 0.7;
    mole.textContent = isBad ? '🐛' : '🐿️';
    mole.dataset.type = isBad ? 'bad' : 'good';
    mole.dataset.whacked = 'false'; 

    mole.addEventListener('mousedown', whack);
    mole.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        whack.call(mole);
    });

    hole.appendChild(mole);

    setTimeout(() => { mole.classList.add('up'); }, 50);

    const stayTime = 800 + Math.random() * 500;
    setTimeout(() => {
        if (!mole.classList.contains('up')) return; 
        mole.classList.remove('up');
        setTimeout(() => {
            if (mole.parentNode === hole) hole.removeChild(mole);
        }, 200);
    }, stayTime);
}

function whack() {
    if (!isGameRunning) return;
    if (this.dataset.whacked === 'true') return; 

    this.dataset.whacked = 'true';
    this.classList.remove('up'); 

    if (this.dataset.type === 'bad') {
        score++;
        this.textContent = '💥'; 
    } else {
        score = Math.max(0, score - 2); 
        this.textContent = '❌'; 
    }

    scoreDisplay.textContent = score;

    setTimeout(() => {
        if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);

    if (score >= GOAL_SCORE) endGame();
}

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(moleTimerId);

    document.querySelectorAll('.mole').forEach(mole => mole.remove());

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `타격왕!<br><b>${timeLeft}초</b>를 남기고 성공했습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `아쉽네요!<br>최종 점수: <b>${score}</b>점`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        const resultData = { type: 'GAME_RESULT', gameId: 7, success: isSuccess };
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);
        window.parent.postMessage(resultData, '*');
    };
}