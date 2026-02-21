let chances = 7;
let successCount = 0;
const GOAL_SUCCESS = 4; // 4踰??깃났 ???먮졊

let isMoving = false;
let barPosition = 0; // 0 ~ 100 (%)
let barDirection = 1; // 1: ?ㅻⅨ履? -1: ?쇱そ
let speed = 1.5; // 諛??대룞 ?띾룄
let animationId;

// ?붾㈃ ?붿냼 媛?몄삤湲?
const chancesDisplay = document.getElementById('chances-left');
const successDisplay = document.getElementById('success-count');
const movingBar = document.getElementById('moving-bar');
const actionBtn = document.getElementById('action-btn');
const startBtn = document.getElementById('start-btn');

// ?렗 諛붾? 醫뚯슦濡?遺?쒕읇寃??吏곸씠???좊땲硫붿씠???⑥닔
function moveBar() {
    if (!isMoving) return;

    barPosition += speed * barDirection;

    // ?묒そ ?앹뿉 ?우쑝硫?諛⑺뼢 諛섏쟾
    if (barPosition >= 98) {
        barPosition = 98;
        barDirection = -1;
    } else if (barPosition <= 0) {
        barPosition = 0;
        barDirection = 1;
    }

    movingBar.style.left = barPosition + '%';
    animationId = requestAnimationFrame(moveBar); // 紐⑤땲??二쇱궗?⑥뿉 留욎떠 遺?쒕읇寃??몄텧
}

// ?빘截??쇱슫???쒖옉 ?⑥닔
function startRound() {
    barPosition = 0;
    barDirection = 1;
    movingBar.style.left = '0%';
    movingBar.style.backgroundColor = '#ff6b6b'; // 鍮④컙?됱쑝濡?珥덇린??

    isMoving = true;
    actionBtn.disabled = false;
    moveBar();
}

// [寃뚯엫 ?쒖옉] 踰꾪듉 ?대┃
startBtn.addEventListener('click', () => {
    chances = 7;
    successCount = 0;
    speed = 1.5; // 珥덇린 ?띾룄
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    startBtn.style.display = 'none';
    actionBtn.textContent = "硫덉땄!";

    startRound();
});

// [硫덉땄!] 踰꾪듉 ?대┃
actionBtn.addEventListener('click', () => {
    if (!isMoving) return;

    // 1. ?吏곸엫 硫덉텛湲?
    isMoving = false;
    cancelAnimationFrame(animationId);
    actionBtn.disabled = true;

    // 2. ?寃?議?35% ~ 65%) ?덉뿉 ?덈뒗吏 ?먮퀎
    const minSuccess = 35;
    const maxSuccess = 65;

    if (barPosition >= minSuccess && barPosition <= maxSuccess) {
        successCount++;
        successDisplay.textContent = successCount;
        movingBar.style.backgroundColor = '#20c997'; // ?깃났 ??珥덈줉?됱쑝濡?蹂寃?
        speed += 0.7; // ?깃났???뚮쭏??寃뚯씠吏 ?띾룄媛 ?댁쭩 鍮⑤씪吏?(湲댁옣媛?UP!)
    } else {
        movingBar.style.backgroundColor = '#495057'; // ?ㅽ뙣 ???대몢???뚯깋?쇰줈 蹂寃?
    }

    chances--;
    chancesDisplay.textContent = chances;

    // 3. ?좉퉸(0.8珥? 硫덉톬?ㅺ? ?ㅼ쓬 ?쇱슫??吏꾪뻾
    setTimeout(() => {
        if (chances > 0) {
            startRound();
        } else {
            endGame();
        }
    }, 800);
});

// ?뢾 寃뚯엫 醫낅즺 泥섎━
function endGame() {
    actionBtn.textContent = "醫낅즺!";
    startBtn.style.display = 'inline-block';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    const isSuccess = successCount >= GOAL_SUCCESS;

    if (isSuccess) {
        alert(`?럦 ?깃났! 7踰?以?${successCount}踰??뺥솗??留욎톬?듬땲??`);
    } else {
        alert(`?뮚 ?꾩돺?ㅼ슂! ${successCount}踰??깃났??洹몄낀?듬땲??`);
    }

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 2,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 2,
            success: isSuccess
        }, '*');
    }
}
