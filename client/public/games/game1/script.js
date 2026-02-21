// script.js
let score = 0;
let timeLeft = 10; // ?쒗븳 ?쒓컙 10珥?
let timerInterval;
const GOAL_SCORE = 60; // 紐⑺몴 ?먯닔

// ?붾㈃ ?붿냼 媛?몄삤湲?
const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const tapBtn = document.getElementById('tap-btn');
const startBtn = document.getElementById('start-btn');

// ?쒖옉 踰꾪듉 ?대┃
startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 10;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    
    startBtn.style.display = 'none'; 
    tapBtn.disabled = false;         
    tapBtn.textContent = "?대┃!!";
    
    // 1珥???대㉧
    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame(); 
        }
    }, 1000);
});

// 愿묓겢 踰꾪듉 ?대┃
tapBtn.addEventListener('click', () => {
    if (timeLeft > 0) {
        score++;
        scoreDisplay.textContent = score;
    }
});

// 寃뚯엫 醫낅즺 泥섎━
function endGame() {
    clearInterval(timerInterval);
    tapBtn.disabled = true;       
    tapBtn.textContent = "醫낅즺!";
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    const isSuccess = score >= GOAL_SCORE;
    
    if (isSuccess) {
        alert(`?럦 ?깃났! 珥?${score}踰??대┃?섏뿬 ?곹넗瑜??먮졊?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 ?꾩돺?ㅼ슂! ${score}踰덉뿉 洹몄퀜 ?먮졊???ㅽ뙣?덉뒿?덈떎.`);
    }

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 1,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 1,
            success: isSuccess
        }, '*');
    }
}
