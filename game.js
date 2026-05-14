const BOARD_SIZE = 5;

function getCellSize() {
    const cell = document.querySelector('.cell');
    if (cell) return cell.getBoundingClientRect().width;
    return 70;
}

function getGap() {
    const board = document.querySelector('.board');
    if (board) {
        const gapVal = getComputedStyle(board).gap;
        if (gapVal && gapVal.includes('px')) return parseFloat(gapVal);
        return (board.getBoundingClientRect().width - 5 * getCellSize()) / 6;
    }
    return 6;
}
const TYPES = {
    WHITE: 1, BLACK: 2, GREY: 3, ORANGE: 4, BEIGE: 5,
    BONE: 6, TREE: 7
};

const CLASSES = {
    1: 'dog-1', 2: 'dog-2', 3: 'dog-3', 4: 'dog-4', 5: 'dog-5',
    6: 'bone', 7: 'tree'
};

const EMOJIS = {
    1: '🐶', 2: '🐺', 3: '🦝', 4: '🦊', 5: '🐕',
    6: '🦴', 7: '🌲'
};

const INITIAL_PIECES = [
    { id: 'A', baseShape: [[2, 1, 1], [1, 0, 0]] },
    { id: 'B', baseShape: [[1, 2, 1], [0, 1, 0]] },
    { id: 'C', baseShape: [[1, 1, 0], [0, 2, 1]] },
    { id: 'D', baseShape: [[2, 1], [1, 2]] }
];

// Levels are now loaded globally from levels.js into GAME_LEVELS
const LEVEL_SEQUENCE = [
    3, 4, 2, 1,
    7, 6, 11, 12, 10, 14, 13, 5, 9, 8,
    16, 23, 17, 18, 20, 21, 15, 19, 24, 22,
    30, 26, 28, 29, 34, 31, 25, 32, 33, 27,
    35, 36, 40, 41, 43, 37, 42, 38, 39, 44
];

function populateLevelSelect() {
    levelSelect.innerHTML = '';
    const groups = [];

    LEVEL_SEQUENCE.forEach((id, orderIndex) => {
        const lvl = GAME_LEVELS[id];
        if (!lvl) return;

        let group = groups.find(entry => entry.name === lvl.group);
        if (!group) {
            group = { name: lvl.group, options: [] };
            groups.push(group);
        }

        group.options.push({ id, orderIndex });
    });

    groups.forEach(group => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.name;
        group.options.forEach(({ id, orderIndex }) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `關卡 ${orderIndex + 1}`;
            option.title = `原始關卡 ${id}`;
            optgroup.appendChild(option);
        });
        levelSelect.appendChild(optgroup);
    });
}

let currentLevel = LEVEL_SEQUENCE[0];
let boardState = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
let activePieces = [];
let draggingPiece = null;

let moves = 0;
let timeElapsed = 0;
let timerInterval = null;
let isPlaying = false;
let keyboardSelection = null;
let keyboardTarget = { r: 0, c: 0 };

function getMaxLevel() {
    return LEVEL_SEQUENCE[LEVEL_SEQUENCE.length - 1];
}

function getCurrentLevelSequenceIndex() {
    return LEVEL_SEQUENCE.indexOf(Number(currentLevel));
}

// DOM Elements
const boardEl = document.getElementById('board');
const levelSelect = document.getElementById('level-select');
const resetBtn = document.getElementById('reset-btn');
const solveBtn = document.getElementById('solve-btn');
const modal = document.getElementById('victory-modal');
const nextLevelBtn = document.getElementById('next-level-btn');
const timeDisplay = document.getElementById('time-display');
const movesDisplay = document.getElementById('moves-display');

boardEl.tabIndex = 0;
boardEl.setAttribute('role', 'grid');
boardEl.setAttribute('aria-label', '5 乘 5 遊戲底盤。選取拼塊後可用方向鍵選擇放置格。');

// Audio System
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(type, freq, dur, vol) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    },
    pickup() { this.play('sine', 600, 0.1, 0.1); },
    drop() { this.play('triangle', 300, 0.1, 0.2); },
    rotate() { this.play('square', 800, 0.05, 0.05); },
    error() { this.play('sawtooth', 150, 0.2, 0.2); },
    win() {
        [400, 500, 600, 800].forEach((f, i) => {
            setTimeout(() => this.play('sine', f, 0.3, 0.2), i * 150);
        });
    }
};

function initGame() {
    modal.classList.remove('active');
    document.getElementById('solution-modal').classList.remove('active');
    clearKeyboardSelection();
    AudioSys.init();
    
    if (levelSelect.options.length === 0) {
        populateLevelSelect();
        levelSelect.value = currentLevel;
    }
    
    // Reset Stats
    moves = 0;
    timeElapsed = 0;
    isPlaying = true;
    updateStatsUI();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(isPlaying) {
            timeElapsed++;
            updateStatsUI();
        }
    }, 1000);

    loadLevel(currentLevel);
    renderBoard();
    initPieces();
}

function updateStatsUI() {
    movesDisplay.textContent = moves;
    const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const s = (timeElapsed % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;
}

function addMove() {
    moves++;
    updateStatsUI();
}

function loadLevel(levelNum) {
    boardState = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    const levelData = GAME_LEVELS[levelNum];
    if (levelData && levelData.items) {
        levelData.items.forEach(item => {
            boardState[item.r][item.c] = item.type;
        });
    }
}

function renderBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', `第 ${r + 1} 列第 ${c + 1} 格`);
            const val = boardState[r][c];
            if (val > 0) {
                const token = document.createElement('div');
                token.className = `dog-token ${CLASSES[val]}`;
                token.textContent = EMOJIS[val];
                cell.appendChild(token);
            }
            cell.dataset.r = r;
            cell.dataset.c = c;
            boardEl.appendChild(cell);
        }
    }
}

function initPieces() {
    activePieces = INITIAL_PIECES.map((p, index) => ({
        ...p,
        index: index,
        shape: JSON.parse(JSON.stringify(p.baseShape)),
        isPlaced: false,
        r: -1,
        c: -1
    }));

    activePieces.forEach((piece, index) => {
        const slot = document.getElementById(`slot-${index}`);
        slot.innerHTML = ''; // Clear slot
        
        const el = document.createElement('div');
        el.className = 'piece';
        el.dataset.index = index;
        el.style.position = 'relative'; // Flex centering in slot
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `拼塊 ${piece.id}。按 Enter 選取，方向鍵選格，R 旋轉，F 翻轉，Enter 放置。`);
        
        renderPieceDOM(piece, el);
        
        // Mouse & Touch Events
        el.addEventListener('mousedown', onDragStart);
        el.addEventListener('touchstart', onDragStart, {passive: false});
        el.addEventListener('keydown', (e) => onPieceKeyDown(e, piece, el));
        
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            AudioSys.rotate();
            flipPiece(piece);
            addMove();
            renderPieceDOM(piece, el);
            if (piece.isPlaced) checkPlacement(piece, el);
        });

        slot.appendChild(el);
    });
}

function renderPieceDOM(piece, el) {
    el.innerHTML = '';
    piece.shape.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'piece-row';
        row.forEach(val => {
            const block = document.createElement('div');
            block.className = 'piece-block';
            if (val === 1) block.classList.add('block-path');
            else if (val === 2) block.classList.add('block-house');
            else block.classList.add('block-empty');
            rowEl.appendChild(block);
        });
        el.appendChild(rowEl);
    });
}

function rotatePiece(piece) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const newShape = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            newShape[c][rows - 1 - r] = piece.shape[r][c];
        }
    }
    piece.shape = newShape;
}

function flipPiece(piece) {
    piece.shape.forEach(row => row.reverse());
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function announceStatus(message) {
    const status = document.getElementById('assistive-status');
    if (status) status.textContent = message;
}

function clearKeyboardSelection() {
    if (keyboardSelection) {
        keyboardSelection.el.classList.remove('keyboard-selected');
    }
    keyboardSelection = null;
    updateKeyboardTarget();
}

function selectPieceWithKeyboard(piece, el) {
    if (keyboardSelection) {
        keyboardSelection.el.classList.remove('keyboard-selected');
    }

    keyboardSelection = { piece, el };
    keyboardTarget = {
        r: piece.isPlaced ? piece.r : 0,
        c: piece.isPlaced ? piece.c : 0
    };
    el.classList.add('keyboard-selected');
    updateKeyboardTarget();
    announceStatus(`已選取拼塊 ${piece.id}。使用方向鍵選格，Enter 放置。`);
}

function updateKeyboardTarget() {
    document.querySelectorAll('.cell.keyboard-target').forEach(cell => {
        cell.classList.remove('keyboard-target');
    });

    if (!keyboardSelection) return;

    const target = boardEl.querySelector(`[data-r="${keyboardTarget.r}"][data-c="${keyboardTarget.c}"]`);
    if (target) target.classList.add('keyboard-target');
}

function moveKeyboardTarget(dr, dc) {
    keyboardTarget.r = clamp(keyboardTarget.r + dr, 0, BOARD_SIZE - 1);
    keyboardTarget.c = clamp(keyboardTarget.c + dc, 0, BOARD_SIZE - 1);
    updateKeyboardTarget();
    announceStatus(`目標格：第 ${keyboardTarget.r + 1} 列，第 ${keyboardTarget.c + 1} 欄。`);
}

function showInvalidKeyboardPlacement(el) {
    el.classList.remove('invalid-placement');
    void el.offsetWidth;
    el.classList.add('invalid-placement');
}

function placeKeyboardSelection() {
    if (!keyboardSelection) return;

    const { piece, el } = keyboardSelection;
    if (!isValidPlacement(piece, keyboardTarget.r, keyboardTarget.c)) {
        AudioSys.error();
        showInvalidKeyboardPlacement(el);
        announceStatus('這個位置不能放置，請換一格試試。');
        return;
    }

    piece.r = keyboardTarget.r;
    piece.c = keyboardTarget.c;
    piece.isPlaced = true;

    if (el.parentNode !== boardEl) {
        boardEl.appendChild(el);
    }

    const cellSize = getCellSize();
    const gap = getGap();
    const cellStep = cellSize + gap;
    el.style.position = 'absolute';
    el.style.left = `${(gap/2) + piece.c * cellStep}px`;
    el.style.top = `${(gap/2) + piece.r * cellStep}px`;
    el.classList.add('placed');

    addMove();
    AudioSys.drop();
    announceStatus(`拼塊 ${piece.id} 已放置。`);
    checkWinCondition();
}

function onPieceKeyDown(e, piece, el) {
    const key = e.key.toLowerCase();
    const isSelectedPiece = keyboardSelection && keyboardSelection.piece === piece;

    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isSelectedPiece) {
            selectPieceWithKeyboard(piece, el);
        } else {
            placeKeyboardSelection();
        }
        return;
    }

    if (!isSelectedPiece) return;

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveKeyboardTarget(-1, 0);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveKeyboardTarget(1, 0);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveKeyboardTarget(0, -1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveKeyboardTarget(0, 1);
    } else if (key === 'r') {
        e.preventDefault();
        AudioSys.rotate();
        rotatePiece(piece);
        renderPieceDOM(piece, el);
        addMove();
        if (piece.isPlaced) checkPlacement(piece, el);
    } else if (key === 'f') {
        e.preventDefault();
        AudioSys.rotate();
        flipPiece(piece);
        renderPieceDOM(piece, el);
        addMove();
        if (piece.isPlaced) checkPlacement(piece, el);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        clearKeyboardSelection();
        announceStatus('已取消選取拼塊。');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        returnToTray(el, piece);
        addMove();
        announceStatus(`拼塊 ${piece.id} 已回到托盤。`);
    }
}

function onBoardKeyDown(e) {
    if (!keyboardSelection) return;

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveKeyboardTarget(-1, 0);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveKeyboardTarget(1, 0);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveKeyboardTarget(0, -1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveKeyboardTarget(0, 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        placeKeyboardSelection();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        clearKeyboardSelection();
        announceStatus('已取消選取拼塊。');
    }
}

function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
    return { x: e.pageX, y: e.pageY };
}

// Drag logic
let dragOffsetX, dragOffsetY;

function onDragStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll
    clearKeyboardSelection();
    
    AudioSys.init(); // Ensure audio context starts
    AudioSys.pickup();
    
    const el = e.currentTarget;
    const piece = activePieces[el.dataset.index];
    const coords = getEventCoords(e);
    
    const rect = el.getBoundingClientRect();
    dragOffsetX = coords.x - (rect.left + window.scrollX);
    dragOffsetY = coords.y - (rect.top + window.scrollY);
    
    // 手機端防手指遮擋偏移 (往上提 1.5 個格子)
    if (e.type === 'touchstart') {
        dragOffsetY += getCellSize() * 1.5;
    }
    
    if (el.parentNode !== document.body) {
        el.style.position = 'absolute';
        document.body.appendChild(el);
    }
    
    el.style.left = `${coords.x - dragOffsetX}px`;
    el.style.top = `${coords.y - dragOffsetY}px`;
    
    piece.isPlaced = false;
    el.classList.remove('placed');
    
    draggingPiece = { el, piece, startX: coords.x, startY: coords.y };
    
    document.addEventListener('mousemove', onDragMove, {passive: false});
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, {passive: false});
    document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
    if (!draggingPiece) return;
    if (e.type === 'touchmove') e.preventDefault();
    const { el } = draggingPiece;
    const coords = getEventCoords(e);
    el.style.left = `${coords.x - dragOffsetX}px`;
    el.style.top = `${coords.y - dragOffsetY}px`;
}

function onDragEnd(e) {
    if (!draggingPiece) return;
    
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
    
    const { el, piece, startX, startY } = draggingPiece;
    draggingPiece = null;
    
    // For touchend, e.clientX is undefined, we use changedTouches
    let endX = startX, endY = startY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        endX = e.changedTouches[0].pageX;
        endY = e.changedTouches[0].pageY;
    } else if (e.pageX !== undefined) {
        endX = e.pageX;
        endY = e.pageY;
    }
    
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const isClick = dx < 5 && dy < 5;
    
    if (isClick) {
        AudioSys.rotate();
        rotatePiece(piece);
        addMove();
        renderPieceDOM(piece, el);
    } else {
        addMove(); // Drag drop counts as a move
    }
    
    const boardRect = boardEl.getBoundingClientRect();
    const cellSize = getCellSize();
    const gap = getGap();
    const cellStep = cellSize + gap;
    
    let firstSolidR = 0, firstSolidC = 0;
    outer: for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] !== 0) {
                firstSolidR = r;
                firstSolidC = c;
                break outer;
            }
        }
    }
    
    const pieceRect = el.getBoundingClientRect();
    const solidBlockX = pieceRect.left + firstSolidC * cellStep + cellStep/2;
    const solidBlockY = pieceRect.top + firstSolidR * cellStep + cellStep/2;
    
    if (solidBlockX >= boardRect.left && solidBlockX <= boardRect.right &&
        solidBlockY >= boardRect.top && solidBlockY <= boardRect.bottom) {
        
        const boardC = Math.floor((solidBlockX - boardRect.left) / cellStep) - firstSolidC;
        const boardR = Math.floor((solidBlockY - boardRect.top) / cellStep) - firstSolidR;
        
        if (isValidPlacement(piece, boardR, boardC)) {
            piece.r = boardR;
            piece.c = boardC;
            piece.isPlaced = true;
            
            boardEl.appendChild(el);
            el.style.left = `${(gap/2) + boardC * cellStep}px`;
            el.style.top = `${(gap/2) + boardR * cellStep}px`;
            el.classList.add('placed');
            AudioSys.drop();
            checkWinCondition();
            return;
        } else {
            AudioSys.error();
        }
    }
    
    returnToTray(el, piece);
}

function returnToTray(el, piece) {
    if (keyboardSelection && keyboardSelection.piece === piece) {
        clearKeyboardSelection();
    }
    piece.isPlaced = false;
    el.classList.remove('placed');
    el.style.position = 'relative';
    el.style.left = '';
    el.style.top = '';
    const slot = document.getElementById(`slot-${piece.index}`);
    slot.appendChild(el);
}

function isValidPlacement(piece, r, c) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    
    for (let pr = 0; pr < rows; pr++) {
        for (let pc = 0; pc < cols; pc++) {
            const val = piece.shape[pr][pc];
            if (val === 0) continue;
            
            const br = r + pr;
            const bc = c + pc;
            
            if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) return false;
            
            const boardVal = boardState[br][bc];
            
            if (boardVal >= 1 && boardVal <= 5) { // Dog
                if (val === 1) return false; // Path cannot cover dog
            }
            if (boardVal === 7) { // Tree
                return false; // Nothing can cover tree
            }
            if (boardVal === 6) { // Bone
                if (val === 2) return false; // House cannot cover bone
            }
            
            for (let i = 0; i < activePieces.length; i++) {
                const other = activePieces[i];
                if (other === piece || !other.isPlaced) continue;
                
                const or = br - other.r;
                const oc = bc - other.c;
                if (or >= 0 && or < other.shape.length && oc >= 0 && oc < other.shape[0].length) {
                    if (other.shape[or][oc] !== 0) return false; 
                }
            }
        }
    }
    return true;
}

function checkPlacement(piece, el) {
    if (!isValidPlacement(piece, piece.r, piece.c)) {
        AudioSys.error();
        returnToTray(el, piece);
    } else {
        AudioSys.drop();
        checkWinCondition();
    }
}

function checkWinCondition() {
    const allPlaced = activePieces.every(p => p.isPlaced);
    if (!allPlaced) return;
    
    let dogsCovered = 0;
    let bonesCovered = 0;
    let totalBones = 0;
    
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if (boardState[r][c] === 6) totalBones++;
        }
    }
    
    activePieces.forEach(piece => {
        for (let pr = 0; pr < piece.shape.length; pr++) {
            for (let pc = 0; pc < piece.shape[0].length; pc++) {
                const br = piece.r + pr;
                const bc = piece.c + pc;
                if (piece.shape[pr][pc] === 2) { 
                    if (boardState[br][bc] >= 1 && boardState[br][bc] <= 5) dogsCovered++;
                } else if (piece.shape[pr][pc] === 1) {
                    if (boardState[br][bc] === 6) bonesCovered++;
                }
            }
        }
    });
    
    if (dogsCovered === 5 && bonesCovered === totalBones) {
        isPlaying = false;
        clearInterval(timerInterval);
        AudioSys.win();
        showVictory();
    }
}

function getThresholds() {
    const lvl = GAME_LEVELS[currentLevel];
    if (lvl.group === '休閒' || lvl.group === '簡單') return { time: 40, moves: 10 };
    if (lvl.group === '困難') return { time: 60, moves: 15 };
    if (lvl.group === '高手') return { time: 80, moves: 18 };
    if (lvl.group === '燒腦') return { time: 100, moves: 22 };
    return { time: 120, moves: 25 }; // Hell
}

function showVictory() {
    const thresholds = getThresholds();
    let stars = 1;
    if (moves <= thresholds.moves && timeElapsed <= thresholds.time) stars = 3;
    else if (moves <= thresholds.moves + 5 || timeElapsed <= thresholds.time + 20) stars = 2;
    
    const starsContainer = document.getElementById('victory-stars');
    starsContainer.innerHTML = '';
    for(let i=0; i<3; i++) {
        const s = document.createElement('span');
        s.className = 'star';
        s.textContent = '⭐';
        if (i < stars) {
            setTimeout(() => s.classList.add('active'), 300 + i * 200);
        }
        starsContainer.appendChild(s);
    }
    
    document.getElementById('vic-time').textContent = timeDisplay.textContent;
    document.getElementById('vic-moves').textContent = moves;
    
    let msg = "";
    if (stars === 3) msg = "完美過關！你具備大師級的解題腦袋！";
    else if (stars === 2) msg = "很不錯喔！下次試著減少移動次數。";
    else msg = "順利過關！多加練習一定能更快！";
    document.getElementById('vic-msg').textContent = msg;
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 400);
}

levelSelect.addEventListener('change', (e) => {
    currentLevel = parseInt(e.target.value);
    initGame();
});

resetBtn.addEventListener('click', initGame);
boardEl.addEventListener('keydown', onBoardKeyDown);

solveBtn.addEventListener('click', () => {
    const sol = GAME_LEVELS[currentLevel].solution;
    if (!sol) {
        alert('抱歉，此關卡解答建置中。');
        return;
    }
    
    const container = document.getElementById('solution-board-container');
    container.innerHTML = '';
    
    // Create a mini board
    const miniBoard = document.createElement('div');
    miniBoard.className = 'board';
    
    // Render base items
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const val = boardState[r][c];
            if (val > 0) {
                const token = document.createElement('div');
                token.className = `dog-token ${CLASSES[val]}`;
                token.textContent = EMOJIS[val];
                cell.appendChild(token);
            }
            miniBoard.appendChild(cell);
        }
    }
    
    const cellSize = getCellSize();
    const gap = getGap();
    
    // Render solution pieces
    sol.forEach((placement, idx) => {
        const piece = { shape: placement.shape };
        const el = document.createElement('div');
        el.className = 'piece';
        renderPieceDOM(piece, el);
        miniBoard.appendChild(el);
        el.style.left = `${(gap/2) + placement.c * (cellSize + gap)}px`;
        el.style.top = `${(gap/2) + placement.r * (cellSize + gap)}px`;
    });
    
    container.appendChild(miniBoard);
    document.getElementById('solution-modal').classList.add('active');
});

document.getElementById('close-solution-btn').addEventListener('click', () => {
    document.getElementById('solution-modal').classList.remove('active');
});

nextLevelBtn.addEventListener('click', () => {
    const currentSequenceIndex = getCurrentLevelSequenceIndex();
    if (currentSequenceIndex >= 0 && currentSequenceIndex < LEVEL_SEQUENCE.length - 1) {
        currentLevel = LEVEL_SEQUENCE[currentSequenceIndex + 1];
        levelSelect.value = currentLevel;
        initGame();
    } else {
        alert('恭喜你全破了！您已完成所有關卡。');
        modal.classList.remove('active');
    }
});

// Prevent context menu on touch devices
document.addEventListener('contextmenu', e => {
    if(e.target.closest('.piece')) e.preventDefault();
});

initGame();

// View Mode Toggle Logic
let isManualMode = false;
function checkAutoMobile() {
    if (isManualMode) return;
    if (window.innerWidth <= 850) {
        document.documentElement.classList.add('mobile-mode');
    } else {
        document.documentElement.classList.remove('mobile-mode');
    }
}
window.addEventListener('resize', checkAutoMobile);
checkAutoMobile();

function repositionPieces() {
    const cellSize = getCellSize();
    const gap = getGap();
    const cellStep = cellSize + gap;
    activePieces.forEach(p => {
        if (p.isPlaced) {
            const el = document.querySelector(`.piece[data-index='${p.index}']`);
            if(el) {
                el.style.left = `${(gap/2) + p.c * cellStep}px`;
                el.style.top = `${(gap/2) + p.r * cellStep}px`;
            }
        }
    });
}

const toggleBtn = document.getElementById('toggle-mode-btn');
if(toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        isManualMode = true;
        document.documentElement.classList.toggle('mobile-mode');
        setTimeout(repositionPieces, 50);
    });
}

window.addEventListener('resize', () => {
    if(!isManualMode) checkAutoMobile();
    repositionPieces();
});
