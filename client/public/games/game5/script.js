// 寃뚯엫 ?ㅼ젙
const TARGET_TIME = 5.00;
const BLIND_TIME = 2.00; // 2珥덈????レ옄媛 媛?ㅼ쭚
const ERROR_MARGIN = 0.20; // ?ㅼ감 ?덉슜 踰붿쐞 (4.80 ~ 5.20珥?
const TOTAL_CHANCES = 3;
const GOAL_SUCCESS = 1; // 3踰?以?1踰덈쭔 ?깃났?대룄 ?먮졊!

let chances = TOTAL_CHANCES;
let successCount = 0;

let startTime = 0;
let timerInterval;
let isRunning = false;

// ?붾㈃ ?붿냼
const chancesDisplay = document.getElementById('chances-left');
const successDisplay = document.getElementById('success-count');
const timerDisplay = document.getElementById('timer-display');
const resultMessage = document.getElementById('result-message');
const actionBtn = document.getElementById('action-btn');
const startBtn = document.getElementById('start-btn');
const readyCover = document.getElementById('ready-cover');

// =========================================
// 1. 珥덇린??諛?寃뚯엫 ?쒖옉
// =========================================

startBtn.addEventListener('click', () => {
    chances = TOTAL_CHANCES;
    successCount = 0;
    chancesDisplay.textContent = chances;
    successDisplay.textContent = successCount;

    readyCover.style.display = 'none';
    prepareRound();
});

// ???쇱슫???쒕룄) 以鍮??곹깭
function prepareRound() {
    timerDisplay.textContent = "0.00";
    timerDisplay.classList.remove('blind');
    resultMessage.textContent = "以鍮꾧? ?섎㈃ ??대㉧瑜??쒖옉?섏꽭??";
    resultMessage.style.color = "#868e96";

    actionBtn.textContent = "??대㉧ ?쒖옉!";
    actionBtn.classList.remove('stop-mode');
    actionBtn.disabled = false;
    isRunning = false;
}

// =========================================
// 2. ??대㉧ ?숈옉 (?쒖옉 & 硫덉땄)
// =========================================

actionBtn.addEventListener('click', () => {
    if (!isRunning) {
        // ??대㉧ ?쒖옉!
        startTimer();
    } else {
        // ??대㉧ 硫덉땄!
        stopTimer();
    }
});

function startTimer() {
    isRunning = true;
    startTime = Date.now(); // ?뺥솗???쒖옉 ?쒓컙 湲곕줉

    actionBtn.textContent = "硫덉땄!!";
    actionBtn.classList.add('stop-mode');
    resultMessage.textContent = "5.00珥덉뿉 留욊쾶 硫덉텛?몄슂!";

    // ?붾㈃ ?낅뜲?댄듃 猷⑦봽
    timerInterval = setInterval(() => {
        let elapsedTime = (Date.now() - startTime) / 1000;

        // 2珥덇? ?섏뼱媛硫?釉붾씪?몃뱶 泥섎━ (?.??)
        if (elapsedTime >= BLIND_TIME) {
            timerDisplay.textContent = "?.??";
            timerDisplay.classList.add('blind');
        } else {
            // 2珥??꾧퉴吏???ㅼ떆媛??レ옄 蹂댁뿬以?
            timerDisplay.textContent = elapsedTime.toFixed(2);
        }

        // ?뱀떆 ?좎?媛 ???꾨Ⅴ怨??좎닔 ?硫?10珥덉뿉??媛뺤젣 醫낅즺 (?덉쟾?μ튂)
        if (elapsedTime > 10.00) {
            stopTimer(true);
        }
    }, 10); // 0.01珥덈쭏???붾㈃ 媛깆떊
}

function stopTimer(isTimeout = false) {
    clearInterval(timerInterval);
    isRunning = false;
    actionBtn.disabled = true;

    // ?ㅼ젣 嫄몃┛ ?쒓컙 怨꾩궛
    let finalTime = (Date.now() - startTime) / 1000;
    if (isTimeout) finalTime = 10.00;

    // 釉붾씪?몃뱶 ?怨??ㅼ젣 硫덉텣 ?쒓컙 蹂댁뿬二쇨린
    timerDisplay.textContent = finalTime.toFixed(2);
    timerDisplay.classList.remove('blind');

    checkResult(finalTime);
}

// =========================================
// 3. 寃곌낵 ?먯젙 諛??ㅼ쓬 ?④퀎
// =========================================

function checkResult(finalTime) {
    chances--;
    chancesDisplay.textContent = chances;

    // 4.80 ~ 5.20 ?ъ씠?몄? ?뺤씤
    let diff = Math.abs(finalTime - TARGET_TIME);
    let isHit = diff <= ERROR_MARGIN;

    if (isHit) {
        successCount++;
        successDisplay.textContent = successCount;
        resultMessage.textContent = "?럦 ?꾨꼍?⑸땲??! ?깃났!";
        resultMessage.style.color = "#20c997";
        timerDisplay.style.color = "#20c997";
    } else {
        resultMessage.textContent = "Miss! diff: " + diff.toFixed(2) + "s";
        resultMessage.style.color = "#ff6b6b";
        timerDisplay.style.color = "#ff6b6b";
    }

    // 1.5珥??ㅼ뿉 ?ㅼ쓬 ?쇱슫?쒕줈 媛嫄곕굹 寃뚯엫 醫낅즺
    setTimeout(() => {
        timerDisplay.style.color = "#333"; // ?됱긽 ?먯긽蹂듦뎄

        if (successCount >= GOAL_SUCCESS) {
            endGame(true); // 1踰덉씠?쇰룄 ?깃났?섎㈃ 諛붾줈 ?밸━ 泥섎━!
        } else if (chances > 0) {
            prepareRound(); // 湲고쉶媛 ?⑥븯?쇰㈃ ?ㅼ쓬 ?쇱슫??
        } else {
            endGame(false); // 湲고쉶 ?뚯쭊 ???ㅽ뙣
        }
    }, 1500);
}

function endGame(isSuccess) {
    if (isSuccess) {
        alert(`?럦 ??쇱슫 媛먭컖?대꽕?? ?곹넗瑜??먮졊?덉뒿?덈떎!`);
    } else {
        alert(`?뮚 紐⑤뱺 湲고쉶瑜??뚯쭊?덉뒿?덈떎. ?먮졊 ?ㅽ뙣!`);
    }

    readyCover.style.display = 'flex';
    startBtn.textContent = "?ㅼ떆 ?섍린";

    // 1. 蹂대궪 ?곗씠?곕? 蹂?섎줈 ?덉걯寃??ъ옣?⑸땲??
        if (window.CampusTurfGameBridge && typeof window.CampusTurfGameBridge.postResult === 'function') {
        window.CampusTurfGameBridge.postResult({
            type: 'GAME_RESULT',
            gameId: 5,
            success: isSuccess
        });
    } else {
        window.parent.postMessage({
            type: 'GAME_RESULT',
            gameId: 5,
            success: isSuccess
        }, '*');
    }
}
