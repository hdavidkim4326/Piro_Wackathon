let timeLeft = 20;
let matchedPairs = 0;
const GOAL_PAIRS = 6;
let timerId;
let isGameRunning = false;

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const matchDisplay = document.getElementById('match-count');
const grid = document.getElementById('card-grid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// ?럳 寃뚯엫???ъ슜???꾩씠??(罹좏띁??而⑥뀎 6媛吏)
const symbols = ['A', 'B', 'C', 'D', 'E', 'F'];
let cardsArray = [...symbols, ...symbols]; // ??媛쒖뵫 吏앹쓣 留욎텛湲??꾪빐 諛곗뿴 ??踰??⑹묠 (珥?12媛?

// 移대뱶 ?곹깭 愿由?蹂?섎뱾
let hasFlippedCard = false;
let lockBoard = false; // 移대뱶媛 ?ㅼ쭛?덈뒗 ?좊땲硫붿씠???꾩쨷 ?ㅻⅨ 移대뱶 ?대┃ 諛⑹?
let firstCard, secondCard;

// [寃뚯엫 ?쒖옉]
startBtn.addEventListener('click', startGame);

function startGame() {
    timeLeft = 20;
    matchedPairs = 0;
    isGameRunning = true;
    timeDisplay.textContent = timeLeft;
    matchDisplay.textContent = matchedPairs;
    readyCover.style.display = 'none';

    grid.innerHTML = ''; // 洹몃━??鍮꾩슦湲?
    shuffle(); // 移대뱶 ?욊린
    createCards(); // 移대뱶 ?붾㈃??源붽린

    timerId = setInterval(countDown, 1000);
}

// ?⑥? ?쒓컙 移댁슫?몃떎??
function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); // ?쒓컙 珥덇낵 ???ㅽ뙣
    }
}

// 移대뱶 ?욊린 ?⑥닔 (?쇱뀛-?덉씠痢??뷀뵆 ?뚭퀬由ъ쬁)
function shuffle() {
    cardsArray.sort(() => Math.random() - 0.5);
}

// ?붾㈃??12??移대뱶 ?앹꽦?섍린
function createCards() {
    cardsArray.forEach(symbol => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.symbol = symbol; // 移대뱶???대뼡 ?대え吏?몄? 鍮꾨? ?대쫫???ъ븘??

        const front = document.createElement('div');
        front.classList.add('card-front');
        front.textContent = symbol;

        const back = document.createElement('div');
        back.classList.add('card-back');

        cardElement.appendChild(front);
        cardElement.appendChild(back);
        
        // 移대뱶 ?대┃ ??flipCard ?⑥닔 ?ㅽ뻾
        cardElement.addEventListener('click', flipCard);
        
        grid.appendChild(cardElement);
    });
}

// 移대뱶 ?대┃?덉쓣 ???ㅼ쭛???⑥닔
function flipCard() {
    // 寃뚯엫???앸궗嫄곕굹, 蹂대뱶媛 ?좉꼈嫄곕굹, 諛⑷툑 ?꾨Ⅸ 移대뱶瑜????꾨Ⅴ硫?臾댁떆
    if (lockBoard || !isGameRunning) return;
    if (this === firstCard) return;

    // 'flip' ?대옒?ㅻ? ?ｌ뼱?????ㅼ쭛??
    this.classList.add('flip');

    if (!hasFlippedCard) {
        // 泥?踰덉㎏ ?대┃??移대뱶????
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // ??踰덉㎏ ?대┃??移대뱶????
    secondCard = this;
    checkForMatch();
}

// ??移대뱶媛 吏앹씠 留욌뒗吏 ?뺤씤
function checkForMatch() {
    let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        disableCards(); // 留욎븯?쇰㈃ ?대┃ 紐삵븯寃?怨좎젙
    } else {
        unflipCards(); // ??몄쑝硫??ㅼ떆 ?먯긽蹂듦뎄
    }
}

// 吏앹쓣 留욎톬????
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matchedPairs++;
    matchDisplay.textContent = matchedPairs;

    resetBoard(); // 蹂??珥덇린??

    // 6?띿쓣 ??留욎톬?ㅻ㈃?
    if (matchedPairs === GOAL_PAIRS) {
        setTimeout(() => endGame(true), 500); // 留덉?留?移대뱶 ?ㅼ쭛?덈뒗嫄?蹂닿퀬 ?앸궡湲??꾪빐 0.5珥??쒕젅??
    }
}

// 吏앹씠 ??몄쓣 ??(?ㅼ떆 ?ㅼ쭛湲?
function unflipCards() {
    lockBoard = true; // ?ㅼ쭛?덈뒗 ?숈븞 ?ㅻⅨ 移대뱶 ?대┃ 紐삵븯寃??좉툑

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 800); // 0.8珥??숈븞 ?由?移대뱶 蹂댁뿬二쇰떎媛 ?ㅼ떆 ??린
}

// ?대┃ ?곹깭 珥덇린??
function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// 寃뚯엫 醫낅즺 泥섎━
function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        alert(`?럦 ?깃났! 紐⑤뱺 吏앹쓣 20珥??덉뿉 留욎톬?듬땲??`);
    } else {
        alert(`?뮚 ?쒓컙 珥덇낵! ?꾩돺寃뚮룄 吏앹쓣 ??李얠? 紐삵뻽?듬땲??`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 4,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 4,
            success: isSuccess
        }, '*');
    }
}
