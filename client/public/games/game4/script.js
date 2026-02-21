let timeLeft = 20;
let matchedPairs = 0;
const GOAL_PAIRS = 6;
let timerId;
let isGameRunning = false;

const timeDisplay = document.getElementById('time-left');
const matchDisplay = document.getElementById('match-count');
const grid = document.getElementById('card-grid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// 🔥 귀여운 다람쥐 간식 아이콘으로 변경!
const symbols = ['🥜', '🐿️', '🌰', '🍪', '🍯', '🌻'];
let cardsArray = [...symbols, ...symbols]; 

let hasFlippedCard = false;
let lockBoard = false; 
let firstCard, secondCard;

startBtn.addEventListener('click', startGame);

function startGame() {
    timeLeft = 20;
    matchedPairs = 0;
    isGameRunning = true;
    timeDisplay.textContent = timeLeft;
    matchDisplay.textContent = matchedPairs;
    readyCover.style.display = 'none';

    grid.innerHTML = ''; 
    shuffle(); 
    createCards(); 

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

function shuffle() {
    cardsArray.sort(() => Math.random() - 0.5);
}

function createCards() {
    cardsArray.forEach(symbol => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.symbol = symbol; 

        const front = document.createElement('div');
        front.classList.add('card-front');
        front.textContent = symbol;

        const back = document.createElement('div');
        back.classList.add('card-back');

        cardElement.appendChild(front);
        cardElement.appendChild(back);
        
        cardElement.addEventListener('click', flipCard);
        grid.appendChild(cardElement);
    });
}

function flipCard() {
    if (lockBoard || !isGameRunning) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        disableCards(); 
    } else {
        unflipCards(); 
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matchedPairs++;
    matchDisplay.textContent = matchedPairs;

    resetBoard(); 

    if (matchedPairs === GOAL_PAIRS) {
        setTimeout(() => endGame(true), 500); 
    }
}

function unflipCards() {
    lockBoard = true; 

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 800); 
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        modalTitle.textContent = "🎉 점령 성공!";
        modalTitle.style.color = "#e67700";
        modalMessage.innerHTML = `완벽한 기억력!<br><b>20초</b> 안에 모두 찾았습니다!`;
    } else {
        modalTitle.textContent = "💦 점령 실패";
        modalTitle.style.color = "#f03e3e";
        modalMessage.innerHTML = `시간 초과!<br>다시 한번 도전해보세요.`;
    }

    resultModal.classList.add('show');

    modalCloseBtn.onclick = () => {
        resultModal.classList.remove('show');
        readyCover.style.display = 'flex';
        startBtn.textContent = "다시 하기";

        const resultData = {
            type: 'GAME_RESULT',
            gameId: 4,
            success: isSuccess
        };
        console.log("📨 React로 날아갈 쪽지 내용:", resultData);
        window.parent.postMessage(resultData, '*');
    };
}