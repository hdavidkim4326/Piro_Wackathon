let score = 0;
let timeLeft = 10;
let timerInterval;
const GOAL_SCORE = 60;

const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const tapBtn = document.getElementById('tap-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// 모달 요소 가져오기
const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 10;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    readyCover.style.display = 'none';
    tapBtn.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
});

tapBtn.addEventListener('click', () => {
    if (timeLeft > 0) {
        score++;
        scoreDisplay.textContent = score;
    }
});

function endGame() {
    clearInterval(timerInterval);
    tapBtn.disabled = true;

    const isSuccess = score >= GOAL_SCORE;

    // 1️⃣ 모달 내용 바꾸기
    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        
        // 💡 textContent 대신 innerHTML을 사용하고, <br> 태그를 넣습니다!
        modalMessage.innerHTML = `최고의 광클!<br>총 <b>${score}</b>개의 땅콩을 심었습니다!`;
        
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        
        // 💡 여기도 동일하게 innerHTML과 <br> 사용!
        modalMessage.innerHTML = `아쉽네요! <b>${score}</b>개에 그쳤습니다.<br>다시 도전하세요!`;
    }

    // 2️⃣ 커스텀 모달 띄우기 (애니메이션과 함께 등장!)
    resultModal.classList.add('show');

    // 3️⃣ 모달의 '확인' 버튼을 눌렀을 때의 동작 설정
    modalCloseBtn.onclick = () => {
        // 모달 닫기
        resultModal.classList.remove('show');

        // 다시 시작할 수 있게 커버 덮기
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        // 1. 보낼 데이터를 변수로 예쁘게 포장합니다.
        const resultData = {
            type: 'GAME_RESULT',
            gameId: 1,
            success: isSuccess
        };

        // 2. F12 콘솔창에 기록을 남깁니다! (내 눈으로 확인용)
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);

        // 3. 부모 창으로 쪽지를 진짜 던집니다.
        window.parent.postMessage(resultData, '*');
    };
}