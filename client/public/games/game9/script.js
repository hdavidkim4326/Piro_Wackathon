let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 7;

let isGameRunning = false;
let timerId;

// ?렓 ?됱긽 議고빀 議깅낫 ?곗씠??
const RECIPES = [
    { name: "蹂대씪??(Purple)", colors: ["red", "blue"], hex: "#b197fc" },
    { name: "二쇳솴??(Orange)", colors: ["red", "yellow"], hex: "#ff922b" },
    { name: "珥덈줉??(Green)", colors: ["blue", "yellow"], hex: "#51cf66" }
];

// ?ㅼ젣 ?됱긽 肄붾뱶 留ㅽ븨 (?몃젅???쒖떆??
const COLOR_CODES = {
    "red": "#ff6b6b",
    "blue": "#339af0",
    "yellow": "#fcc419"
};

let currentTarget = null;
let selectedColors = []; // ?좎?媛 ?좏깮???됱긽 2媛쒓? ?닿만 諛곗뿴

// ?뵦 ?곗냽 異쒖젣 諛⑹?瑜??꾪븳 湲곗뼲 ?μ튂
let previousTargetName = "";
let consecutiveTargetCount = 0;

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const targetBox = document.getElementById('target-box');
const targetName = document.getElementById('target-name');
const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const feedbackText = document.getElementById('feedback-text');
const colorBtns = document.querySelectorAll('.color-btn');
const resetBtn = document.getElementById('reset-tray-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 寃뚯엫 ?쒖옉 諛???대㉧
// =========================================

startBtn.addEventListener('click', () => {
    timeLeft = 10; // 珥덇린??
    score = 0;
    previousTargetName = ""; // 戮묎린 湲곗뼲 ?μ튂 珥덇린??
    consecutiveTargetCount = 0;
    isGameRunning = true;

    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score;
    readyCover.style.display = 'none';

    setNextTarget();
    timerId = setInterval(countDown, 1000);
});

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); // ?쒓컙 珥덇낵 ?ㅽ뙣
    }
}

// ?ㅼ쓬 臾몄젣 異쒖젣 (?곗냽 異쒖젣 諛⑹? 濡쒖쭅 ?곸슜!)
function setNextTarget() {
    clearTray();

    let randomIdx;
    let nextTarget;

    // ?뵦 媛숈? ?됱긽??3踰??곗냽?쇰줈 ?섏삤???섎㈃ ?ㅼ떆 戮묎린! (do-while 諛섎났臾?
    do {
        randomIdx = Math.floor(Math.random() * RECIPES.length);
        nextTarget = RECIPES[randomIdx];
    } while (nextTarget.name === previousTargetName && consecutiveTargetCount >= 2);

    // ?곗냽 移댁슫??湲곕줉?섍린
    if (nextTarget.name === previousTargetName) {
        consecutiveTargetCount++; // ??媛숈? 嫄??섏솕?? 移댁슫??利앷?
    } else {
        previousTargetName = nextTarget.name;
        consecutiveTargetCount = 1; // ?덈줈??嫄??섏솕?쇰땲 移댁슫??1濡?由ъ뀑
    }

    currentTarget = nextTarget;

    targetBox.style.backgroundColor = currentTarget.hex;
    targetName.textContent = currentTarget.name;
    feedbackText.textContent = "?대뼡 ?됱쓣 ?욎뼱???좉퉴??";
    feedbackText.style.color = "#495057";
}

// =========================================
// 2. ?됱긽 ?좏깮 諛?議고빀 濡쒖쭅
// =========================================

// ?붾젅??踰꾪듉 ?대┃ ?대깽??
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning || selectedColors.length >= 2) return;

        const pickedColor = btn.dataset.color;
        selectedColors.push(pickedColor);
        updateTrayUI();

        // 2媛쒓? 苑?李⑤㈃ ?뺣떟 ?뺤씤!
        if (selectedColors.length === 2) {
            checkMix();
        }
    });
});

// ?몃젅??鍮덉뭏) ?쒓컖???낅뜲?댄듃
function updateTrayUI() {
    // 泥?踰덉㎏ ?щ’
    if (selectedColors[0]) {
        slot1.style.backgroundColor = COLOR_CODES[selectedColors[0]];
        slot1.style.border = "3px solid white";
    } else {
        slot1.style.backgroundColor = "#f8f9fa";
        slot1.style.border = "3px dashed #ced4da";
    }

    // ??踰덉㎏ ?щ’
    if (selectedColors[1]) {
        slot2.style.backgroundColor = COLOR_CODES[selectedColors[1]];
        slot2.style.border = "3px solid white";
    } else {
        slot2.style.backgroundColor = "#f8f9fa";
        slot2.style.border = "3px dashed #ced4da";
    }
}

// ?몃젅??鍮꾩슦湲?(由ъ뀑 踰꾪듉??
resetBtn.addEventListener('click', clearTray);

function clearTray() {
    selectedColors = [];
    updateTrayUI();
}

// =========================================
// 3. ?뺣떟 ?먯젙
// =========================================

function checkMix() {
    // ?쒖꽌 ?곴??놁씠 鍮꾧탳?섍린 ?꾪빐 ?뺣젹 ??臾몄옄濡??⑹묠 (?? "blue,red" === "blue,red")
    const userMix = [...selectedColors].sort().join(',');
    const correctMix = [...currentTarget.colors].sort().join(',');

    if (userMix === correctMix) {
        // ?뺣떟!
        score++;
        scoreDisplay.textContent = score;
        feedbackText.textContent = "???뺣떟?낅땲??";
        feedbackText.style.color = "#20c997";

        if (score >= GOAL_SCORE) {
            setTimeout(() => endGame(true), 300); // ?밸━!
        } else {
            setTimeout(setNextTarget, 400); // 0.4珥????ㅼ쓬 臾몄젣
        }
    } else {
        // ?ㅻ떟!
        feedbackText.textContent = "????몄뒿?덈떎! ?ㅼ떆 ?욎뼱蹂댁꽭??";
        feedbackText.style.color = "#ff6b6b";
        setTimeout(clearTray, 600); // 0.6珥??ㅼ뿉 ?몃젅???먮룞 鍮꾩썙以?
    }
}

// =========================================
// 4. 寃뚯엫 醫낅즺 諛?寃곌낵 ?꾩넚
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);

    if (isSuccess) {
        alert(`?럦 泥쒖옱?곸씤 ?됱콈 媛먭컖! ?곹넗瑜??먮졊?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 ?꾩돺寃??ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?꾩쟾?대낫?몄슂! (?ъ꽦: ${score}/${GOAL_SCORE})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 9,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 9,
            success: isSuccess
        }, '*');
    }
}
