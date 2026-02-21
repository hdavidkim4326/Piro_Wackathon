let timeLeft = 10;
let score = 0;
const GOAL_SCORE = 30; // 10珥??덉뿉 30踰??붾뱾湲??먮뒗 ?대┃)

let isGameRunning = false;
let timerId;

// ?먯씠??媛먯???蹂??
const SHAKE_THRESHOLD = 15; // ???섏튂 ?댁긽?쇰줈 媛뺥븯寃??붾뱾?댁빞 ?몄젙??
let lastShakeTime = 0;

// ?붾㈃ ?붿냼 媛?몄삤湲?
const timeDisplay = document.getElementById('time-left');
const scoreDisplay = document.getElementById('current-score');
const shakeArea = document.getElementById('shake-area');
const liquid = document.getElementById('liquid');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 寃뚯엫 ?쒖옉 諛???대㉧
// =========================================

startBtn.addEventListener('click', async () => {
    // ?뜌 ?꾩씠??iOS 13+)??寃쎌슦 ?쇱꽌 ?묎렐 沅뚰븳??臾쇱뼱遊먯빞 ?⑸땲??
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            } else {
                alert("?쇱꽌 沅뚰븳??嫄곕??섏뿀?듬땲?? 湲곌린 ?ㅼ젙?먯꽌 紐⑥뀡 ?쇱꽌 ?묎렐???덉슜?댁＜?몄슂!");
            }
        } catch (error) {
            console.error(error);
        }
    } else {
        // ?덈뱶濡쒖씠?쒕굹 ?쇰컲 PC??沅뚰븳 ?붿껌 ?놁씠 諛붾줈 由ъ뒪???깅줉
        window.addEventListener('devicemotion', handleMotion);
    }

    startGameLoop();
});

function startGameLoop() {
    timeLeft = 10;
    score = 0;
    isGameRunning = true;
    
    timeDisplay.textContent = timeLeft;
    scoreDisplay.textContent = score;
    liquid.style.height = '0%';
    readyCover.style.display = 'none';
    
    timerId = setInterval(countDown, 1000);
}

function countDown() {
    if (!isGameRunning) return;
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame(false); // ?쒓컙 珥덇낵
    }
}

// =========================================
// 2. ?붾뱾湲?& ?대┃ 媛먯? 濡쒖쭅
// =========================================

// 紐⑤컮??媛?띾룄 ?쇱꽌 媛먯?
function handleMotion(event) {
    if (!isGameRunning) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    // x, y, z 異뺤쓽 媛?띾룄瑜?紐⑤몢 ?뷀빐???쇰쭏???멸쾶 ?붾뱾?몃뒗吏 怨꾩궛
    const totalAcceleration = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);

    if (totalAcceleration > SHAKE_THRESHOLD) {
        const currentTime = Date.now();
        // ??踰??붾뱾怨?0.1珥?100ms)媛 吏?섏빞 ?ㅼ쓬 ?붾뱾湲곕줈 ?몄젙 (以묐났 諛⑹?)
        if (currentTime - lastShakeTime > 100) {
            lastShakeTime = currentTime;
            addScore();
        }
    }
}

// ?먯닔 利앷? 諛?UI ?낅뜲?댄듃
function addScore() {
    score++;
    scoreDisplay.textContent = score;

    // 寃뚯씠吏(?≪껜)媛 李⑥삤瑜대뒗 ?믪씠 怨꾩궛 (理쒕? 100%)
    let fillPercentage = (score / GOAL_SCORE) * 100;
    if (fillPercentage > 100) fillPercentage = 100;
    liquid.style.height = `${fillPercentage}%`;

    // 紐⑺몴 ?ъ꽦 ???밸━!
    if (score >= GOAL_SCORE) {
        endGame(true);
    }
}

// =========================================
// 3. 寃뚯엫 醫낅즺 諛?寃곌낵 ?꾩넚
// =========================================

function endGame(isSuccess) {
    isGameRunning = false;
    clearInterval(timerId);
    
    // ?쇱꽌 由ъ뒪???댁젣 (諛고꽣由???퉬 諛⑹?)
    window.removeEventListener('devicemotion', handleMotion);

    if (isSuccess) {
        alert(`?럦 ?꾩껌???댁젙?낅땲?? ?곹넗瑜??먮졊?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 ?댁젙??議곌툑 遺議깊빀?덈떎. (?ъ꽦: ${score}/${GOAL_SCORE})`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 10,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 10,
            success: isSuccess
        }, '*');
    }
}
