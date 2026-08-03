let tileSize = 97;
let tilesArray = Array.from({length: 15 }, (_,i) => i+1).concat([0]);
let emptyIndex = 15;
let currentMode = 'tide_mode';
let gridSize = 4;
let shuffleMoveCount = 160; // matches the 'easy' default selected in the difficulty dropdown
let currentDifficulty = 'easy';
let magicHints = 5;

let moveCount = 0;
let secondsElapsed = 0;
let timerInterval = null;


const soundToggle = document.getElementById('sound-toggle');
function playSound(sound) {
    if (soundToggle.checked) {
        sound.currentTime = 0;
        sound.play();
    }
}

let boardLocked = false;


function onSettingsChanged(){
    let puzzleSize = document.getElementById('puzzle-size').value;
    let difficultyMode = document.getElementById('difficulty-mode').value;
    gridSize = Number(puzzleSize);
    tileSize = 390 / gridSize;
    currentDifficulty = difficultyMode;
    shuffleMoveCount = 160;
    magicHints = 5;
    if (difficultyMode == 'easy') {
        magicHints = 5;
        shuffleMoveCount = 160;
    } else if (difficultyMode === 'normal') {
        magicHints = 3;
        shuffleMoveCount = 240;
    } else if (difficultyMode === 'hard') {
        magicHints = 2;
        shuffleMoveCount = 340;
    } else if (difficultyMode === 'adaptive') {
        magicHints = 2;
        shuffleMoveCount = 280;
    }
    

    // Changing size/difficulty needs a full rebuild since gridSize and
    // tileSize both change.
    resetTiles();
    updateMagicHintButton();


}



function updateSessionStats() {
    let totalMoves = 0;
    let totalTime = 0;
    let level = "";
    let sessions = JSON.parse(localStorage.getItem("puzzleSessions")) || [];

    sessions.push({ moves: moveCount, time: secondsElapsed });
    localStorage.setItem("puzzleSessions", JSON.stringify(sessions));
    sessions.forEach((session) => {
        totalMoves = totalMoves + session.moves;
        totalTime = totalTime + session.time;
    });
    let averageMoves = totalMoves/sessions.length;
    let averageTime = totalTime/sessions.length;
    document.getElementById('sessions-count').textContent = sessions.length;
    document.getElementById('avg-time').textContent = Math.floor(averageTime) + 's';
    document.getElementById('avg-moves').textContent = Math.floor(averageMoves);

    if (sessions.length < 5) {
        level = "Starter";
    } else if (sessions.length < 10) {
        level = "Solver";
    } else {
        level = "Master";
    }
    document.getElementById('progression-level').textContent = level;
}


function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    document.getElementById('timer-display').textContent = 'Time: 0s';
    timerInterval = setInterval(() => {
        secondsElapsed++;
        document.getElementById('timer-display').textContent = `Time: ${secondsElapsed}s`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}


function resetTiles(){
    tilesArray = Array.from({length: gridSize * gridSize - 1 }, (_,i) => i+1).concat([0]);
    emptyIndex = tilesArray.length - 1;

    moveCount = 0;
    document.getElementById('move-counter').textContent = 'Moves: 0';

    stopTimer();
    secondsElapsed = 0;
    document.getElementById('timer-display').textContent = 'Time: 0s';

    document.getElementById('message').style.display = 'none';

    renderTiles();

}
document.getElementById('reset-btn').addEventListener('click', resetTiles);

function handleTileClick(index){
    if (boardLocked) return;

    if (isAdjacent(index, emptyIndex)) {
        tilesArray[emptyIndex] = tilesArray[index];
        tilesArray[index] = 0;
        emptyIndex = index;

        moveCount++;
        document.getElementById('move-counter').textContent = `Moves: ${moveCount}`;


        playSound(document.getElementById('move-sound'));

        renderTiles();

        if (isSolved()){
            document.getElementById('message').style.display = 'block';
            stopTimer();
            playSound(document.getElementById('win-sound'));
            updateSessionStats();

            saveScore(); 
        }
    }
}

function setTileImage(value, tile) {
    if (value === 0) return;

    let boardPixelSize = gridSize * tileSize;
    let imageFile = (currentDifficulty === 'hard' || currentDifficulty === 'adaptive')
        ? 'images/hard_adaptive.jpeg'
        : `images/${currentMode}.jpg`;

    let rowInImage = Math.floor((value - 1) / gridSize);
    let colInImage = (value - 1) % gridSize;

    tile.style.backgroundImage = `url(${imageFile})`;
    tile.style.backgroundSize = `${boardPixelSize}px ${boardPixelSize}px`;
    tile.style.backgroundPosition = `-${colInImage * tileSize}px -${rowInImage * tileSize}px`;
}   

function updateModeButtonStyles(){
    let modeButtons = [document.getElementById('tide-mode'), document.getElementById('sunset-mode'), document.getElementById('galaxy-mode')];  
    modeButtons.forEach((button) => {
        button.classList.remove('active-tide', 'active-sunset', 'active-galaxy');
    });
        if (currentMode === 'tide_mode') {
            document.getElementById('tide-mode').classList.add('active-tide');
        } else if (currentMode === 'sunset_mode'){
            document.getElementById('sunset-mode').classList.add('active-sunset');
        } else if (currentMode === 'galaxy_mode'){
            document.getElementById('galaxy-mode').classList.add('active-galaxy');
        }
}

function updateMagicHintButton() {
    let btn = document.getElementById('magic-hint');
    btn.textContent = magicHints > 0 ? `Magic Hint (${magicHints})` : 'No Hints Left';
}


function totalDistance(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        let value = arr[i];
        if (value === 0) continue;
        let targetIndex = value - 1;
        let curRow = Math.floor(i / gridSize), curCol = i % gridSize;
        let tgtRow = Math.floor(targetIndex / gridSize), tgtCol = targetIndex % gridSize;
        total += Math.abs(curRow - tgtRow) + Math.abs(curCol - tgtCol);
    }
    return total;
}


function getBestHintMove() {
    let row = Math.floor(emptyIndex / gridSize);
    let col = emptyIndex % gridSize;
    let candidates = [];
    if (row > 0) candidates.push(emptyIndex - gridSize);
    if (row < gridSize - 1) candidates.push(emptyIndex + gridSize);
    if (col > 0) candidates.push(emptyIndex - 1);
    if (col < gridSize - 1) candidates.push(emptyIndex + 1);

    let bestMove = null;
    let bestScore = Infinity;
    candidates.forEach((idx) => {
        let testArr = tilesArray.slice();
        testArr[emptyIndex] = testArr[idx];
        testArr[idx] = 0;
        let score = totalDistance(testArr);
        if (score < bestScore) {
            bestScore = score;
            bestMove = idx;
        }
    });
    return bestMove;
}

function useMagicHint() {
    if (boardLocked) return;
    if (isSolved()) return;

    if (magicHints <= 0) {
        updateMagicHintButton();
        return;
    }

    let hintIndex = getBestHintMove();
    if (hintIndex === null) return;

    let tiles = document.querySelectorAll('#puzzle-container .tile');
    let hintTile = tiles[hintIndex];
    if (hintTile) {
        hintTile.classList.add('tile-hint');
        setTimeout(() => hintTile.classList.remove('tile-hint'), 1200);
    }

    magicHints--;
    updateMagicHintButton();
    playSound(document.getElementById('move-sound'));
}
document.getElementById('magic-hint').addEventListener('click', useMagicHint);
updateMagicHintButton();

function isAdjacent(a, b) {
    let rowA = Math.floor(a / gridSize);
    let colA = a % gridSize;
    let rowB = Math.floor(b / gridSize);
    let colB = b % gridSize;

    return (Math.abs(rowA - rowB) === 1 && colA === colB) || (Math.abs(colA - colB) === 1 && rowA === rowB);
}

function renderTiles() {
    let container = document.getElementById('puzzle-container');
    container.innerHTML = '';
    tilesArray.forEach((value, index) => {
        let tile = document.createElement('div'); 
        tile.className = value === 0 ? 'tile empty' : 'tile';
        tile.textContent = value || '';
        tile.addEventListener('click', () => handleTileClick(index));

        let row = Math.floor(index / gridSize);
        let col = index % gridSize;
        tile.style.top = `${row * tileSize}px` ;
        tile.style.left = `${col * tileSize}px` ;
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;

        container.appendChild(tile);
        setTileImage(value, tile);

    })
}
function isSolved(){
    for (let i = 0; i < tilesArray.length - 1; i++){
        if(tilesArray[i] !== i + 1){
            return false;
        }
    }
    return true;

}

function shuffleTiles(){
    boardLocked = true; // prevent clicks while tiles are being rearranged
    let currentEmpty = emptyIndex;
    // shuffleMoveCount comes from onSettingsChanged, scaled per difficulty
    let shuffleSteps = shuffleMoveCount > 0 ? shuffleMoveCount : 160;
    for( let i = 0; i < shuffleSteps; i++){
        let possibleMoves = [];
        let row = Math.floor(currentEmpty / gridSize);
        let col = currentEmpty % gridSize;

        if (row > 0) possibleMoves.push(currentEmpty - gridSize);
        if (row < (gridSize - 1)) possibleMoves.push(currentEmpty + gridSize);
        if (col > 0) possibleMoves.push(currentEmpty - 1);
        if (col < (gridSize - 1)) possibleMoves.push(currentEmpty + 1);

        let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        tilesArray[currentEmpty] = tilesArray[move];
        tilesArray[move] = 0;
        currentEmpty = move;
    }
    emptyIndex = currentEmpty;

    moveCount = 0;
    document.getElementById('move-counter').textContent = 'Moves: 0';
    startTimer();

    renderTiles();
    document.getElementById('message').style.display = 'none';
    boardLocked = false;
}
document.getElementById('shuffle-btn').addEventListener('click', shuffleTiles);

// Board should never load in the solved state, so shuffle immediately
document.getElementById('message').style.display = 'none';
shuffleTiles();
updateModeButtonStyles();

document.getElementById('tide-mode').addEventListener('click', () => { currentMode = 'tide_mode'; renderTiles(); updateModeButtonStyles()});       
document.getElementById('sunset-mode').addEventListener('click', () => { currentMode = 'sunset_mode'; renderTiles(); updateModeButtonStyles()});
document.getElementById('galaxy-mode').addEventListener('click', () => { currentMode = 'galaxy_mode'; renderTiles(); updateModeButtonStyles()}); 



function formatModeName(mode) {
    return mode.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function finalizeScoreSave(player) {
    let mode = formatModeName(currentMode);

    // Save locally first and render right away -- this guarantees the score
    // you just earned shows up immediately, regardless of what the server
    // does or how long it takes.
    saveScoreLocally(player, mode, moveCount, secondsElapsed);
    let localScores = JSON.parse(localStorage.getItem("puzzleLeaderboard")) || [];
    renderLeaderboardRows(localScores);

    // Try the server too, so the leaderboard is shared across devices, not
    // just stuck in this browser's storage. Only re-check the server list
    // AFTER this request finishes -- calling loadLeaderboard() immediately
    // here would race the INSERT and could load stale data that doesn't
    // include the score we just saved, overwriting the local render above.
    fetch('api/save_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player: player,
            variant: mode,
            moves: moveCount,
            time: secondsElapsed
        })
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                console.warn('Server rejected the score save:', data.error);
            }
        })
        .catch((err) => {
            // No PHP/DB running locally, or db.php couldn't connect -- fine,
            // the local render above already shows the score either way.
            console.warn('Could not reach save_score.php, using localStorage only:', err);
        })
        .finally(() => {
            loadLeaderboard();
        });
}

function saveScore() {
    let nameInput = document.getElementById('player-name');
    let player = nameInput.value.trim();

    if (player === "") {
        let entered = window.prompt("Nice solve! Enter your name for the leaderboard:", "");
        player = (entered || "").trim() || "Player";
    }

    finalizeScoreSave(player);
}

function saveScoreLocally(name, mode, moves, time) {
    let scores = JSON.parse(localStorage.getItem("puzzleLeaderboard")) || [];

    scores.push({
        name: name,
        mode: mode,
        moves: moves,
        time: time,
        date: new Date().toLocaleDateString()
    });

    scores.sort(function (a, b) {
        return a.time - b.time || a.moves - b.moves;
    });

    scores = scores.slice(0, 5); // keep top 5 only

    localStorage.setItem("puzzleLeaderboard", JSON.stringify(scores));
}

function renderLeaderboardRows(scores) {
    let tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = "";

    if (scores.length === 0) {
        let row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">No scores yet. Solve a puzzle to create the first record.</td>';
        tbody.appendChild(row);
        return;
    }

    scores.forEach(function (entry) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        let modeCell = document.createElement("td");
        let movesCell = document.createElement("td");
        let timeCell = document.createElement("td");
        let dateCell = document.createElement("td");

        nameCell.textContent = entry.name;
        modeCell.textContent = entry.mode;
        movesCell.textContent = entry.moves;
        timeCell.textContent = entry.time + "s";
        dateCell.textContent = entry.date || "";

        row.appendChild(nameCell);
        row.appendChild(modeCell);
        row.appendChild(movesCell);
        row.appendChild(timeCell);
        row.appendChild(dateCell);

        tbody.appendChild(row);
    });

}

function loadLeaderboard() {
    let localScores = JSON.parse(localStorage.getItem("puzzleLeaderboard")) || [];

    fetch('api/get_scores.php')
        .then((response) => response.json())
        .then((scores) => {
            // A server response of [] can mean "genuinely no scores yet" OR
            // "db.php couldn't connect, so get_scores.php returned an empty
            // array instead of an error." If we have local scores but the
            // server says none, trust the local copy instead of wiping it.
            if (scores.length === 0 && localScores.length > 0) {
                renderLeaderboardRows(localScores);
            } else {
                renderLeaderboardRows(scores);
            }
        })
        .catch((err) => {
            // API/DB not reachable -- fall back to local storage
            console.warn('Could not reach get_scores.php, falling back to localStorage:', err);
            renderLeaderboardRows(localScores);
        });
}

loadLeaderboard();
document.getElementById('puzzle-size').addEventListener('change', onSettingsChanged);
document.getElementById('difficulty-mode').addEventListener('change', onSettingsChanged);
