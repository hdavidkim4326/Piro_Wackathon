let score = 0;
let timeLeft = 20;
const GOAL_SCORE = 15;

let isGameRunning = false;
let timerId;
let moleTimerId;

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const holes = document.querySelectorAll('.hole');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 寃뚯엫 ?쒖옉 諛???대㉧
// =========================================

startBtn.addEventListener('click', () => {
    score = 0;
    timeLeft = 20;
    isGameRunning = true;
    
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    readyCover.style.display = 'none';

    // 1珥덈쭏???⑥? ?쒓컙 媛먯냼
    timerId = setInterval(countDown, 1000);
    
    // 0.6珥덈쭏???쒕뜡?섍쾶 ?먮뜑吏 ?앹꽦
    moleTimerId = setInterval(popMole, 600); 
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// =========================================
// 2. ?먮뜑吏 ?앹꽦 濡쒖쭅
// =========================================

function popMole() {
    if (!isGameRunning) return;

    // 鍮?援щ찉 以??섎굹瑜?臾댁옉?꾨줈 ?좏깮
    const randomIdx = Math.floor(Math.random() * holes.length);
    const hole = holes[randomIdx];

    // 留뚯빟 怨좊Ⅸ 援щ찉???대? ?먮뜑吏媛 ?덈떎硫??⑥뒪
    if (hole.querySelector('.mole')) return;

    // ?덈줈???먮뜑吏 ?섎━癒쇳듃 留뚮뱾湲?
    const mole = document.createElement('div');
    mole.classList.add('mole');

    // 70% ?뺣쪧濡??쇱씠踰??삁), 30% ?뺣쪧濡??곕━ ?숆탳(?룶) 異쒗쁽
    const isRival = Math.random() < 0.7;
    mole.textContent = isRival ? '?삁' : '?룶';
    mole.dataset.type = isRival ? 'rival' : 'ours';
    mole.dataset.whacked = 'false'; // ?꾩쭅 留욊린 ???곹깭

    // 紐⑤컮???곗튂? PC 留덉슦???대┃ 紐⑤몢 媛먯? (諛섏쓳?띾룄 理쒖쟻??
    mole.addEventListener('mousedown', whack);
    mole.addEventListener('touchstart', (e) => {
        e.preventDefault(); // ?붾툝 ???뺣? ??紐⑤컮??湲곕낯 ?숈옉 諛⑹?
        whack.call(mole);
    });

    hole.appendChild(mole);

    // 援щ찉???ｌ옄留덉옄 ?댁쭩 ?쒕젅?????꾨줈 ?щ씪?ㅻ뒗 ?좊땲硫붿씠???ㅽ뻾
    setTimeout(() => {
        mole.classList.add('up');
    }, 50);

    // ?쇱젙 ?쒓컙(0.8珥?~ 1.3珥??쒕뜡)??吏?섎㈃ ?ㅼ떆 ?대젮媛怨???젣??
    const stayTime = 800 + Math.random() * 500;
    setTimeout(() => {
        if (!mole.classList.contains('up')) return; // ?대? 留욎븘???대젮媛붿쑝硫?臾댁떆
        mole.classList.remove('up');
        
        // ?좊땲硫붿씠???앸굹硫?DOM?먯꽌 吏?곌린
        setTimeout(() => {
            if (mole.parentNode === hole) hole.removeChild(mole);
        }, 200);
    }, stayTime);
}

// =========================================
// 3. ?먮뜑吏 ?寃??대┃) ?먯젙
// =========================================

function whack() {
    if (!isGameRunning) return;
    if (this.dataset.whacked === 'true') return; // ?대? ?뚮┛ ?덉? ??踰?紐??뚮┝

    this.dataset.whacked = 'true';
    this.classList.remove('up'); // 留욎쑝硫?利됱떆 諛묒쑝濡??⑥쓬

    if (this.dataset.type === 'rival') {
        // ?뺣떟! ?먯닔 +1
        score++;
        this.textContent = '?뮙'; // ?寃??댄럺?몃줈 蹂寃?
    } else {
        // ?ㅻ떟! (?곕━ ?숆탳 ?뚮┝) ?먯닔 -2
        score = Math.max(0, score - 2); // 0??諛묒쑝濡쒕뒗 ???대젮媛寃?諛⑹뼱
        this.textContent = 'X';
    }

    scoreDisplay.textContent = score;

    // ?좎떆 ????젣
    setTimeout(() => {
        if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);

    // 15?먯쓣 ?ъ꽦?덉쑝硫?利됱떆 ?깃났 醫낅즺!
    if (score >= GOAL_SCORE) {
        endGame();
    }
}

// =========================================
// 4. 寃뚯엫 醫낅즺 諛?寃곌낵 ?꾩넚
// =========================================

function endGame() {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(moleTimerId);

    // ?붾㈃???⑥? ?먮뜑吏??泥?냼
    document.querySelectorAll('.mole').forEach(mole => mole.remove());

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        alert(`?럦 ?寃⑹솗! ${timeLeft}珥덈? ?④린怨??곹넗瑜??먮졊?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 ?먯닔 遺議? ?쇱씠踰뚯쓣 ??鍮좊Ⅴ寃??댁튂?섏꽭?? (理쒖쥌 ?먯닔: ${score})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 7,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 7,
            success: isSuccess
        }, '*');
    }
}
