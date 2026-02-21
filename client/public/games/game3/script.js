let score = 0;
let timeLeft = 30;
const GOAL_SCORE = 150; // 紐⑺몴 ?먯닔

let gameTimerId;    // ?⑥? ?쒓컙 ??대㉧
let spawnTimerId;   // ?꾩씠???앹꽦 ??대㉧
let gameLoopId;     // 寃뚯엫 硫붿씤 猷⑦봽 (?吏곸엫, 異⑸룎)
let isGameRunning = false;

// ?뵦 ?쒖씠???곸듅???꾪빐 ?띾룄瑜?'蹂??濡?蹂寃?
let itemSpeed = 3;
const SPAWN_RATE = 400; // ?꾩씠???앹꽦 二쇨린 (ms)

// ?붾㈃ ?붿냼 媛?몄삤湲?
const scoreDisplay = document.getElementById('current-score');
const timeDisplay = document.getElementById('time-left');
const gameArea = document.getElementById('game-area');
const catcher = document.getElementById('catcher');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

let activeItems = []; // ?붾㈃???좎엳???꾩씠?쒕뱾 愿由?諛곗뿴

// =========================================
// 1. 寃뚯엫 濡쒖쭅 (?쒖옉, 醫낅즺, ??대㉧)
// =========================================

startBtn.addEventListener('click', startGame);

function startGame() {
    // 珥덇린??
    score = 0;
    timeLeft = 30;
    itemSpeed = 3; // ?쒖옉????珥덇린 ?띾룄 ?명똿
    activeItems = [];
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    isGameRunning = true;

    // 湲곗〈 ?꾩씠????吏?곌린
    const existingItems = document.querySelectorAll('.item');
    existingItems.forEach(item => item.remove());

    // UI 蹂寃?
    readyCover.style.display = 'none';
    catcher.style.left = '50%';

    // ??대㉧ 諛?猷⑦봽 ?쒖옉
    gameTimerId = setInterval(countDown, 1000);
    spawnTimerId = setInterval(spawnItem, SPAWN_RATE);
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ?⑥? ?쒓컙 移댁슫?몃떎??
function countDown() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;

    // ?뵦 留ㅼ큹留덈떎 ?꾩씠???⑥뼱吏???띾룄媛 0.2??鍮⑤씪吏묐땲?? (?꾨컲遺 ?먯뀡 ??컻)
    itemSpeed += 0.2;

    if (timeLeft <= 0) {
        endGame();
    }
}

// =========================================
// 2. 議곗옉 (諛붽뎄???吏곸씠湲?- 紐⑤컮???곗튂 ?ы븿)
// =========================================

function moveCatcher(e) {
    if (!isGameRunning) return;

    // ?곗튂 ?대깽?몄? 留덉슦???대깽??醫뚰몴 ?듭씪
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const gameAreaRect = gameArea.getBoundingClientRect();

    // 寃뚯엫 ?곸뿭 ?댁뿉?쒖쓽 ?곷???X 醫뚰몴 怨꾩궛
    let relativeX = clientX - gameAreaRect.left;

    // 諛붽뎄?덇? ?붾㈃ 諛뽰쑝濡??섍?吏 ?딅룄濡?怨좎젙
    if (relativeX < 0) relativeX = 0;
    if (relativeX > gameAreaRect.width) relativeX = gameAreaRect.width;

    catcher.style.left = `${relativeX}px`;
}

gameArea.addEventListener('mousemove', moveCatcher);
gameArea.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 紐⑤컮???곗튂 ???ㅽ겕濡?諛⑹?
    moveCatcher(e);
}, { passive: false });

// =========================================
// 3. ?꾩씠???앹꽦 諛?愿由?
// =========================================

function spawnItem() {
    if (!isGameRunning) return;

    const item = document.createElement('div');
    item.classList.add('item');

    // ?뵦 ??깂 ?앹꽦 ?뺣쪧
    const isGood = Math.random() > 0.35;

    if (isGood) {
        item.textContent = '?룶';
        item.classList.add('good');
        item.dataset.points = 10;
    } else {
        item.textContent = '?뮗';
        item.classList.add('bad');
        item.dataset.points = -20;
    }

    const randomX = Math.floor(Math.random() * (gameArea.offsetWidth - 30));
    item.style.left = `${randomX}px`;
    item.style.top = '-30px';

    gameArea.appendChild(item);
    activeItems.push(item);
}

// =========================================
// 4. 寃뚯엫 硫붿씤 猷⑦봽 (?좊땲硫붿씠??+ 異⑸룎 泥댄겕)
// =========================================

function gameLoop() {
    if (!isGameRunning) return;

    const catcherRect = catcher.getBoundingClientRect();

    activeItems.forEach((item, index) => {
        // 1) ?꾩씠???꾨옒濡??대룞 (?먯젏 鍮⑤씪吏??itemSpeed 諛섏쁺)
        let currentTop = parseFloat(item.style.top || -30);
        item.style.top = `${currentTop + itemSpeed}px`;

        const itemRect = item.getBoundingClientRect();

        // 2) 異⑸룎 泥댄겕 (諛붽뎄?덉? ?꾩씠?쒖씠 寃뱀낀?붽??)
        if (
            itemRect.bottom >= catcherRect.top &&
            itemRect.top <= catcherRect.bottom &&
            itemRect.right >= catcherRect.left &&
            itemRect.left <= catcherRect.right
        ) {
            score += parseInt(item.dataset.points);
            scoreDisplay.textContent = score;
            item.remove();
            activeItems.splice(index, 1);
        }
        // 3) ?꾧퉴 ?섏젙???붾㈃ 諛붾떏 ?リ퀬 吏?섍컙 ?꾩씠???쒓굅
        else if (currentTop > gameArea.offsetHeight) {
            item.remove();
            activeItems.splice(index, 1);
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop);
}

// =========================================
// 5. 寃뚯엫 醫낅즺
// =========================================

function endGame() {
    isGameRunning = false;
    clearInterval(gameTimerId);
    clearInterval(spawnTimerId);
    cancelAnimationFrame(gameLoopId);

    const isSuccess = score >= GOAL_SCORE;

    if (isSuccess) {
        alert(`?럦 ?깃났! ${score}?먯쓣 ?띾뱷?섏뿬 紐⑺몴瑜??ъ꽦?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 ?꾩돺?ㅼ슂! ${score}?먯뿉 洹몄퀜 ?ㅽ뙣?덉뒿?덈떎. (紐⑺몴: ${GOAL_SCORE}??`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 3,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 3,
            success: isSuccess
        }, '*');
    }
}
