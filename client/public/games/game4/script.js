let timeLeft = 20;
let matchedPairs = 0;
const GOAL_PAIRS = 6;
let timerId;
let isGameRunning = false;

// 화면 요소 가져오기
const timeDisplay = document.getElementById('time-left');
const matchDisplay = document.getElementById('match-count');
const grid = document.getElementById('card-grid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// 🎓 게임에 사용할 아이템 (캠퍼스 컨셉 6가지)
const symbols = ['📚', '🎓', '💻', '🎒', '🏫', '☕'];
let cardsArray = [...symbols, ...symbols]; // 두 개씩 짝을 맞추기 위해 배열 두 번 합침 (총 12개)

// 카드 상태 관리 변수들
let hasFlippedCard = false;
let lockBoard = false; // 카드가 뒤집히는 애니메이션 도중 다른 카드 클릭 방지
let firstCard, secondCard;

// [게임 시작]
startBtn.addEventListener('click', startGame);

function startGame() {
    timeLeft = 20;
    matchedPairs = 0;
    isGameRunning = true;
    timeDisplay.textContent = timeLeft;
    matchDisplay.textContent = matchedPairs;
    readyCover.style.display = 'none';

    grid.innerHTML = ''; // 그리드 비우기
    shuffle(); // 카드 섞기
    createCards(); // 카드 화면에 깔기

    timerId = setInterval(countDown, 1000);
}

// 남은 시간 카운트다운
function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); // 시간 초과 시 실패
    }
}

// 카드 섞기 함수 (피셔-예이츠 셔플 알고리즘)
function shuffle() {
    cardsArray.sort(() => Math.random() - 0.5);
}

// 화면에 12장 카드 생성하기
function createCards() {
    cardsArray.forEach(symbol => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.symbol = symbol; // 카드에 어떤 이모지인지 비밀 이름표 달아둠

        const front = document.createElement('div');
        front.classList.add('card-front');
        front.textContent = symbol;

        const back = document.createElement('div');
        back.classList.add('card-back');

        cardElement.appendChild(front);
        cardElement.appendChild(back);
        
        // 카드 클릭 시 flipCard 함수 실행
        cardElement.addEventListener('click', flipCard);
        
        grid.appendChild(cardElement);
    });
}

// 카드 클릭했을 때 뒤집는 함수
function flipCard() {
    // 게임이 끝났거나, 보드가 잠겼거나, 방금 누른 카드를 또 누르면 무시
    if (lockBoard || !isGameRunning) return;
    if (this === firstCard) return;

    // 'flip' 클래스를 넣어서 휙 뒤집음
    this.classList.add('flip');

    if (!hasFlippedCard) {
        // 첫 번째 클릭한 카드일 때
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // 두 번째 클릭한 카드일 때
    secondCard = this;
    checkForMatch();
}

// 두 카드가 짝이 맞는지 확인
function checkForMatch() {
    let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        disableCards(); // 맞았으면 클릭 못하게 고정
    } else {
        unflipCards(); // 틀렸으면 다시 원상복구
    }
}

// 짝을 맞췄을 때
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matchedPairs++;
    matchDisplay.textContent = matchedPairs;

    resetBoard(); // 변수 초기화

    // 6쌍을 다 맞췄다면?
    if (matchedPairs === GOAL_PAIRS) {
        setTimeout(() => endGame(true), 500); // 마지막 카드 뒤집히는거 보고 끝내기 위해 0.5초 딜레이
    }
}

// 짝이 틀렸을 때 (다시 뒤집기)
function unflipCards() {
    lockBoard = true; // 뒤집히는 동안 다른 카드 클릭 못하게 잠금

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 800); // 0.8초 동안 틀린 카드 보여주다가 다시 덮기
}

// 클릭 상태 초기화
function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// 게임 종료 처리
function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        alert(`🎉 성공! 모든 짝을 20초 안에 맞췄습니다!`);
    } else {
        alert(`💦 시간 초과! 아쉽게도 짝을 다 찾지 못했습니다.`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "다시 하기";

    // 📩 React로 결과 쏘기 (gameId: 4)
    window.parent.postMessage({
        type: 'GAME_RESULT',
        gameId: 4,
        success: isSuccess
    }, '*');
}