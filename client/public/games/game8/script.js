let timeLeft = 15; // 15珥?踰꾪떚湲?
let noiseLevel = 50; // ?쒖옉 ?뚯쓬 ?섏튂 (50%)

let isGameRunning = false;
let timerId;
let gaugeTimerId;

// ?뵦 諛몃윴???⑥튂 (?쒖씠??湲됱긽??)
let noiseIncrease = 1.5; // ?댁젣 ?곸닔媛 ?꾨땲??蹂?섏엯?덈떎! (?먯젏 鍮⑤씪吏?
const SHH_DECREASE = 30; // 8 -> 25濡?????곹뼢! (?꾨? ?뚮쭏???낇썒 ?⑥뼱吏?

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const noiseBar = document.getElementById('noise-bar');
const feedbackText = document.getElementById('feedback-text');
const shhBtn = document.getElementById('shh-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 寃뚯엫 ?쒖옉 諛???대㉧
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 15;
    noiseLevel = 50;
    noiseIncrease = 1.5; // 寃뚯엫 ?쒖옉????李⑥삤瑜대뒗 ?띾룄 珥덇린??
    isGameRunning = true;

    timeDisplay.textContent = timeLeft;
    noiseBar.style.width = noiseLevel + '%';
    noiseBar.style.background = 'linear-gradient(90deg, #ffd43b, #ff6b6b)';
    feedbackText.textContent = "寃뚯씠吏瑜??좎??섏꽭??";
    feedbackText.style.color = "#495057";

    readyCover.style.display = 'none';
    shhBtn.disabled = false;

    // 1珥덈쭏???⑥? ?쒓컙 源롪린
    timerId = setInterval(countDown, 1000);
    // 0.1珥덈쭏???뚯쓬 寃뚯씠吏 ?щ━湲?
    gaugeTimerId = setInterval(increaseNoise, 100);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    // ?뵦 ?듭떖 濡쒖쭅: 1珥덇? 吏???뚮쭏??寃뚯씠吏 李⑥삤瑜대뒗 ?띾룄媛 ?먯젏 ??鍮⑤씪吏묐땲??
    noiseIncrease += 1.2;

    // 15珥덈? 臾댁궗??踰꾪끉?ㅻ㈃ ?깃났!
    if (timeLeft <= 0) {
        endGame(true);
    }
}

// =========================================
// 2. 寃뚯씠吏 ?곸듅 諛??먯젙
// =========================================

function increaseNoise() {
    if (!isGameRunning) return;

    // ?쒓컙??吏?좎닔濡?????媛?noiseIncrease)???뷀빐吏?
    noiseLevel += noiseIncrease;
    updateGaugeUI();

    // ?ㅽ뙣 議곌굔 1: 100% ?꾨떖 (寃쎄퀬 ?댁옣)
    if (noiseLevel >= 100) {
        feedbackText.textContent = "?덈Т ?쒕걚?쎌뒿?덈떎! 已볤꺼?ъ뒿?덈떎 ?삲";
        feedbackText.style.color = "#ff6b6b";
        noiseBar.style.background = "#ff6b6b";
        endGame(false);
    }
    // ?ㅽ뙣 議곌굔 2: 0% ?꾨떖 (?섎㈃ ?곹깭)
    else if (noiseLevel <= 0) {
        feedbackText.textContent = "?덈Т 議곗슜?댁꽌 ?좊뱾?덉뒿?덈떎 ?뮘";
        feedbackText.style.color = "#4dabf7";
        noiseBar.style.background = "#4dabf7";
        endGame(false);
    }
}

function updateGaugeUI() {
    if (noiseLevel > 100) noiseLevel = 100;
    if (noiseLevel < 0) noiseLevel = 0;

    noiseBar.style.width = noiseLevel + '%';

    // ?덉쟾 吏?(30~70)瑜?踰쀬뼱?섎㈃ ?쒓컖??寃쎄퀬
    if (noiseLevel < 30 || noiseLevel > 70) {
        noiseBar.style.boxShadow = "0 0 15px rgba(255, 107, 107, 0.8)";
    } else {
        noiseBar.style.boxShadow = "none";
    }
}

// =========================================
// 3. 踰꾪듉 ?대┃ (?뚯쓬 媛먯냼)
// =========================================

shhBtn.addEventListener('mousedown', dropNoise);
shhBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dropNoise();
});

function dropNoise() {
    if (!isGameRunning) return;

    // 踰꾪듉 ?꾨? ?뚮쭏??寃뚯씠吏媛 ?낇썒 媛먯냼
    noiseLevel -= SHH_DECREASE;
    updateGaugeUI();
}

// =========================================
// 4. 寃뚯엫 醫낅즺 諛?寃곌낵 ?꾩넚
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);
    clearInterval(gaugeTimerId);
    shhBtn.disabled = true;

    setTimeout(() => {
        if (isSuccess) {
            alert(`?럦 ?꾩꽌愿??留ㅻ꼫瑜?吏耳곗뒿?덈떎! ?먮졊 ?깃났!`);
        } else {
            alert(`?뮚 洹좏삎???껋뿀?듬땲?? ?먮졊 ?ㅽ뙣!`);
        }

        readyCover.style.display = 'flex';
        startBtn.textContent = "?ㅼ떆 ?섍린";

        // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
            if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 8,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 8,
            success: isSuccess
        }, '*');
    }
    }, 100);
}
