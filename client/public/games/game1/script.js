// script.js
let score = 0;
let timeLeft = 10; // 제한 시간 10초
let timerInterval;
const GOAL_SCORE = 50; // 목표 점수

// 화면 요소 가져오기
const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const tapBtn = document.getElementById('tap-btn');
const startBtn = document.getElementById('start-btn');

// 시작 버튼 클릭
startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 10;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    
    startBtn.style.display = 'none'; 
    tapBtn.disabled = false;         
    tapBtn.textContent = "클릭!!";
    
    // 1초 타이머
    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame(); 
        }
    }, 1000);
});

// 광클 버튼 클릭
tapBtn.addEventListener('click', () => {
    if (timeLeft > 0) {
        score++;
        scoreDisplay.textContent = score;
    }
});

// 게임 종료 처리
function endGame() {
    clearInterval(timerInterval);
    tapBtn.disabled = true;       
    tapBtn.textContent = "종료!";
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "다시 하기";

    const isSuccess = score >= GOAL_SCORE;
    
    if (isSuccess) {
        alert(`🎉 성공! 총 ${score}번 클릭하여 영토를 점령했습니다!`);
    } else {
        alert(`💦 아쉽네요! ${score}번에 그쳐 점령에 실패했습니다.`);
    }

    // 부모 창(React)으로 결과 전송
    window.parent.postMessage({
        type: 'GAME_RESULT',
        gameLevel: 1,
        score: score,
        success: isSuccess
    }, '*');
}