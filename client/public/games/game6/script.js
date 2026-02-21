let timeLeft = 10; // 10珥???꾩뼱??
let successCount = 0;
const GOAL_SUCCESS = 15; // 15踰??깃났 紐⑺몴

let isGameRunning = false;
let timerId;

// 諛⑺뼢 ?곗씠??(?뺣떟 鍮꾧탳??
const DIRECTIONS = [
    { dir: 'UP', icon: '燧놅툘' },
    { dir: 'DOWN', icon: '燧뉛툘' },
    { dir: 'LEFT', icon: '燧낉툘' },
    { dir: 'RIGHT', icon: '?∽툘' }
];
let currentTargetDir = ''; 

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('success-count');
const swipeArea = document.getElementById('swipe-area');
const arrowDisplay = document.getElementById('arrow-display');
const feedbackText = document.getElementById('feedback-text');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 寃뚯엫 ?쒖옉 諛???대㉧
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 10;
    successCount = 0;
    isGameRunning = true;
    
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = successCount;
    readyCover.style.display = 'none';
    swipeArea.style.backgroundColor = '#e3f2fd';
    
    setNextArrow(); // 泥?踰덉㎏ ?붿궡???꾩슦湲?
    timerId = setInterval(countDown, 1000);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// ?ㅼ쓬 ?붿궡???쒕뜡?쇰줈 戮묎린
function setNextArrow() {
    const randomIdx = Math.floor(Math.random() * DIRECTIONS.length);
    currentTargetDir = DIRECTIONS[randomIdx].dir;
    arrowDisplay.textContent = DIRECTIONS[randomIdx].icon;
    feedbackText.textContent = "諛⑺뼢??留욊쾶 ?쒕옒洹?";
    feedbackText.style.color = "#495057";
}

// =========================================
// 2. ?ㅼ??댄봽 (?쒕옒洹? 諛⑺뼢 媛먯? 濡쒖쭅
// =========================================

let startX = 0;
let startY = 0;
const SWIPE_THRESHOLD = 30; // ???쎌?(30px) ?댁긽 諛?댁빞 ?몄젙 (?댁쭩 ?우? 嫄?臾댁떆)

// (1) ?곗튂/留덉슦???꾨? ???쒖옉 醫뚰몴 ???
function handleSwipeStart(e) {
    if (!isGameRunning) return;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
}

// (2) ?곗튂/留덉슦????????醫뚰몴 怨꾩궛
function handleSwipeEnd(e) {
    if (!isGameRunning) return;
    let endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    let endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // ?쇰쭏??諛?덈뒗吏 怨꾩궛 (??醫뚰몴 - ?쒖옉 醫뚰몴)
    let diffX = endX - startX;
    let diffY = endY - startY;

    // ?덈Т 議곌툑 ?吏곸??쇰㈃ 洹몃깷 ?대┃??嫄몃줈 媛꾩＜?섍퀬 臾댁떆
    if (Math.abs(diffX) < SWIPE_THRESHOLD && Math.abs(diffY) < SWIPE_THRESHOLD) return;

    let userSwipeDir = '';

    // X異뺤쑝濡???留롮씠 諛?덈뒗吏, Y異뺤쑝濡???留롮씠 諛?덈뒗吏 ?먮퀎
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 醫뚯슦 ?ㅼ??댄봽
        userSwipeDir = diffX > 0 ? 'RIGHT' : 'LEFT';
    } else {
        // ?곹븯 ?ㅼ??댄봽
        userSwipeDir = diffY > 0 ? 'DOWN' : 'UP';
    }

    checkSwipe(userSwipeDir);
}

// ?대깽??由ъ뒪???깅줉 (紐⑤컮???곗튂 + PC 留덉슦??紐⑤몢 吏??
swipeArea.addEventListener('touchstart', handleSwipeStart);
swipeArea.addEventListener('touchend', handleSwipeEnd);
swipeArea.addEventListener('mousedown', handleSwipeStart);
swipeArea.addEventListener('mouseup', handleSwipeEnd);

// =========================================
// 3. ?뺣떟 ?먮퀎 諛?寃뚯엫 醫낅즺
// =========================================

function checkSwipe(userSwipeDir) {
    // ?? ?섎뒗 ?좊땲硫붿씠???④낵瑜??꾪빐 ?좉퉸 ?붿궡?쒕? 異뺤냼?쒗궡
    arrowDisplay.style.transform = 'scale(0.8)';
    setTimeout(() => arrowDisplay.style.transform = 'scale(1)', 100);

    if (userSwipeDir === currentTargetDir) {
        // ?뺣떟!
        successCount++;
        scoreDisplay.textContent = successCount;
        
        // ?쒓컖???쇰뱶諛?(諛곌꼍 珥덈줉??諛섏쭩)
        swipeArea.style.backgroundColor = '#d3f9d8';
        setTimeout(() => swipeArea.style.backgroundColor = '#e3f2fd', 150);
        
        // 15踰덉쓣 ??梨꾩썱?쇰㈃ 利됱떆 ?깃났 醫낅즺
        if (successCount >= GOAL_SUCCESS) {
            endGame();
        } else {
            setNextArrow(); // ?ㅼ쓬 臾몄젣 異쒖젣
        }
    } else {
        // ?ㅻ떟!
        feedbackText.textContent = "??몄뒿?덈떎! ?ㅼ떆!";
        feedbackText.style.color = "#ff6b6b";
        
        // ?쒓컖???쇰뱶諛?(諛곌꼍 鍮④컙??諛섏쭩)
        swipeArea.style.backgroundColor = '#ffe3e3';
        setTimeout(() => swipeArea.style.backgroundColor = '#e3f2fd', 150);
    }
}

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);

    const isSuccess = successCount >= GOAL_SUCCESS;

    if (isSuccess) {
        alert(`?럦 ?꾩껌???쒕컻?? ${successCount}踰?諛⑺뼢??留욎톬?듬땲??`);
    } else {
        alert(`?뮚 ?쒓컙??遺議깊빀?덈떎. (?깃났: ${successCount}/${GOAL_SUCCESS})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 6,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 6,
            success: isSuccess
        }, '*');
    }
}
