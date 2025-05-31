document.addEventListener('DOMContentLoaded', () => {
    // Constants for maze elements
    const CELL_TYPE = {
        WALL: 0,
        PATH: 1,
        PLAYER: 2,
        LETTER: 3,
        DOOR: 4,
        OPEN_DOOR: 6,
    };

    const TILE_SIZE = 20; // Size of each cell in pixels
    const PLAYER_COLOR = 'blue';
    const WALL_COLOR = 'black';
    const PATH_COLOR = 'white';
    const LETTER_COLOR = 'green';
    const DOOR_COLOR = 'red';
    const OPEN_DOOR_COLOR = '#FFD700'; // Gold for open door
    const FOG_COLOR = 'rgba(50, 50, 50, 0.8)'; // For line of sight

    // Viewport settings
    const VIEWPORT_WIDTH_TILES = 25;
    const VIEWPORT_HEIGHT_TILES = 20;

    // DOM Elements
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const difficultySelect = document.getElementById('difficulty');
    const startGameButton = document.getElementById('startGame');
    const timerDisplay = document.getElementById('timer');
    const hintListDisplay = document.getElementById('hintList');
    const collectedLettersDisplay = document.getElementById('letters');
    const leaderboardListDisplay = document.getElementById('leaderboardList');
    // Modal DOM Elements
    const doorModal = document.getElementById('doorModal');
    const closeDoorModalButton = document.getElementById('closeDoorModal');
    const doorWordInput = document.getElementById('doorWordInput');
    const submitDoorWordButton = document.getElementById('submitDoorWord');
    const doorMessageDisplay = document.getElementById('doorMessage');

    // Game State Variables
    let currentDifficulty = 'easy';
    let maze = [];
    let mazeWidth, mazeHeight;
    let player = { x: 0, y: 0 };
    let collectedLetters = new Set();
    let wordsForLevel = [];
    let doors = []; // {x, y, word, isOpen, id}
    let gameTimerInterval;
    let secondsElapsed = 0;
    let gameActive = false;
    let currentInteractingDoor = null; // To store which door the modal is for
    let previouslySeen = []; // For persistent map reveal

    const difficultySettings = {
        easy: { width: 15, height: 15, fogRadius: 4 },
        medium: { width: 35, height: 30, fogRadius: 3 },
        hard: { width: 65, height: 50, fogRadius: 3 }
    };

    // --- Core Game Logic ---

    async function initGame() {
        console.log("Initializing game...");
        gameActive = true;
        clearInterval(gameTimerInterval);
        secondsElapsed = 0;
        timerDisplay.textContent = 'Time: 0s';
        collectedLetters.clear();
        collectedLettersDisplay.textContent = '';
        hintListDisplay.innerHTML = '';
        doors = [];
        currentInteractingDoor = null;
        doorWordInput.value = '';
        doorMessageDisplay.textContent = '';
        startGameButton.textContent = "Start Game";

        currentDifficulty = difficultySelect.value;
        const settings = difficultySettings[currentDifficulty];
        mazeWidth = settings.width;
        mazeHeight = settings.height;
        // Set canvas to fixed viewport size
        canvas.width = VIEWPORT_WIDTH_TILES * TILE_SIZE;
        canvas.height = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

        // Initialize previouslySeen grid
        previouslySeen = Array.from({ length: mazeHeight }, () => Array(mazeWidth).fill(false));

        wordsForLevel = getWordsForDifficulty(currentDifficulty);
        hintListDisplay.innerHTML = ''; // Clear previous hints
        wordsForLevel.forEach(word => {
            const listItem = document.createElement('li');
            const initialMaskedWord = maskWord(word);
            listItem.textContent = initialMaskedWord;
            listItem.dataset.originalWord = word;
            listItem.dataset.maskedWord = initialMaskedWord;
            hintListDisplay.appendChild(listItem);
        });

        let solvable = false;
        let generationAttempts = 0;
        const maxGenerationAttempts = 20; // Increased from 10 to 20

        while(!solvable && generationAttempts < maxGenerationAttempts) {
            generationAttempts++;
            console.log(`Maze generation attempt: ${generationAttempts}`);
            generateMaze();
            placePlayer(); 
            placeDoors();  
            // Place letters AND check if all required letters were successfully placed
            if (!placeLetters()) { 
                console.warn("Letter placement failed. Retrying generation...");
                maze = Array.from({ length: mazeHeight }, () => Array(mazeWidth).fill(CELL_TYPE.WALL)); // Reset maze
                doors = []; // Reset doors
                continue; // Skip solvability check and retry generation
            }

            if (isLevelSolvable()) {
                solvable = true;
                console.log("Generated level is solvable.");
            } else {
                console.warn("Generated level is NOT solvable. Regenerating...");
                // Clear doors for next attempt, as they are tied to maze structure
                doors = [];
                 // Reset maze for next attempt if `generateMaze` doesn't fully clear/reinit
                maze = Array.from({ length: mazeHeight }, () => Array(mazeWidth).fill(CELL_TYPE.WALL));
            }
        }

        if (!solvable) {
            gameActive = false;
            alert("Failed to generate a solvable level after multiple attempts. Please try adjusting difficulty or refreshing.");
            console.error("Failed to generate a solvable level.");
            return;
        }

        drawMaze();
        startTimer();
        updateLeaderboardDisplay();
    }

    function generateMaze() {
        console.log(`Generating maze of size: ${mazeWidth}x${mazeHeight}`);
        maze = Array.from({ length: mazeHeight }, () => Array(mazeWidth).fill(CELL_TYPE.WALL));

        // Randomized Prim's algorithm or Recursive Backtracker
        // For simplicity, we'll start with a basic recursive backtracker.
        // We'll carve paths from a starting point.

        const stack = [];
        const startX = Math.floor(Math.random() * (mazeWidth / 2)) * 2 + 1;
        const startY = Math.floor(Math.random() * (mazeHeight / 2)) * 2 + 1;

        // Ensure start is within bounds and odd
        const sx = Math.max(1, Math.min(startX, mazeWidth - 2));
        const sy = Math.max(1, Math.min(startY, mazeHeight - 2));

        maze[sy][sx] = CELL_TYPE.PATH;
        stack.push({ x: sx, y: sy });

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];

            // Check neighbors (2 cells away)
            // N, S, E, W
            const directions = [
                { x: 0, y: -2, wallX: 0, wallY: -1 }, // North
                { x: 0, y: 2,  wallX: 0, wallY: 1 },  // South
                { x: 2, y: 0,  wallX: 1, wallY: 0 },  // East
                { x: -2, y: 0, wallX: -1, wallY: 0 }  // West
            ];

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;

                if (nx > 0 && nx < mazeWidth -1 && ny > 0 && ny < mazeHeight -1 && maze[ny][nx] === CELL_TYPE.WALL) {
                    neighbors.push({ nx, ny, wallX: current.x + dir.wallX, wallY: current.y + dir.wallY });
                }
            }

            if (neighbors.length > 0) {
                const { nx, ny, wallX, wallY } = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[ny][nx] = CELL_TYPE.PATH;         // Carve path to neighbor
                maze[wallY][wallX] = CELL_TYPE.PATH; // Carve path through wall
                stack.push({ x: nx, y: ny });
            } else {
                stack.pop(); // Backtrack
            }
        }
         // Ensure border walls (optional, but good for a closed maze)
        for (let y = 0; y < mazeHeight; y++) {
            maze[y][0] = CELL_TYPE.WALL;
            maze[y][mazeWidth - 1] = CELL_TYPE.WALL;
        }
        for (let x = 0; x < mazeWidth; x++) {
            maze[0][x] = CELL_TYPE.WALL;
            maze[mazeHeight - 1][x] = CELL_TYPE.WALL;
        }

        console.log("Maze generation complete.");
    }


    function placePlayer() {
        // Find a random path cell for the player
        let placed = false;
        while (!placed) {
            const x = Math.floor(Math.random() * (mazeWidth - 2)) + 1; // avoid border
            const y = Math.floor(Math.random() * (mazeHeight - 2)) + 1;
            if (maze[y][x] === CELL_TYPE.PATH) {
                player.x = x;
                player.y = y;
                console.log(`Player placed at (${player.x}, ${player.y})`);
                placed = true;
            }
        }
    }

    function placeDoors() {
        const doorWords = [...wordsForLevel]; // Use a copy
        let attempts = 0;
        const maxAttempts = mazeWidth * mazeHeight; // Safety break

        for (let i = 0; i < doorWords.length && attempts < maxAttempts; attempts++) {
            const x = Math.floor(Math.random() * (mazeWidth - 2)) + 1;
            const y = Math.floor(Math.random() * (mazeHeight - 2)) + 1;

            // Ensure door is on a path, not where player is, and not already a door
            if (maze[y][x] === CELL_TYPE.PATH &&
                (x !== player.x || y !== player.y) &&
                !doors.some(d => d.x === x && d.y === y)) {

                // Check if it's a suitable place for a door (e.g., part of a wall segment that can be replaced)
                // For simplicity, we'll just place it on a path cell that isn't critical for maze solvability.
                // A more robust approach would identify actual wall cells to convert into doors.
                // For now, we mark a path cell as a door.
                maze[y][x] = CELL_TYPE.DOOR;
                doors.push({ x, y, word: doorWords[i], isOpen: false, id: `door-${x}-${y}` });
                console.log(`Door for word "${doorWords[i]}" placed at (${x}, ${y})`);
                i++; // Move to next door word
            }
        }
        if (doors.length < doorWords.length) {
            console.warn("Could not place all doors. Maze might be too small or dense.");
        }
    }

    function placeLetters() {
        const allRequiredLetters = new Set(wordsForLevel.join('').split(''));
        let lettersToPlace = Array.from(allRequiredLetters);
        let placedCount = 0;
        let attempts = 0;
        // Increase maxAttempts for letter placement, especially if maze is dense or many letters
        const maxPlacementAttempts = mazeWidth * mazeHeight * 4; // Increased attempts

        // Shuffle letters for random placement
        lettersToPlace = lettersToPlace.sort(() => 0.5 - Math.random());

        console.log("Required letters for doors:", allRequiredLetters);
        console.log("Letters to place:", lettersToPlace);

        for (const letter of lettersToPlace) {
            let placedThisLetter = false;
            let letterAttempts = 0;
            // Max attempts per letter, to avoid one difficult letter blocking all
            const maxAttemptsPerLetter = Math.floor(maxPlacementAttempts / (lettersToPlace.length || 1));

            while (!placedThisLetter && letterAttempts < maxAttemptsPerLetter && attempts < maxPlacementAttempts) {
                const x = Math.floor(Math.random() * (mazeWidth - 2)) + 1;
                const y = Math.floor(Math.random() * (mazeHeight - 2)) + 1;

                if (maze[y] && maze[y][x] === CELL_TYPE.PATH &&
                    (x !== player.x || y !== player.y) &&
                    !doors.some(d => d.x === x && d.y === y)) {

                    maze[y][x] = { type: CELL_TYPE.LETTER, char: letter };
                    console.log(`Letter '${letter}' placed at (${x}, ${y})`);
                    placedThisLetter = true;
                    placedCount++;
                }
                letterAttempts++;
                attempts++;
            }
            if (attempts >= maxPlacementAttempts) {
                console.warn("Max total attempts reached during letter placement.");
                break;
            }
            if (!placedThisLetter) {
                 console.warn(`Could not place letter '${letter}' after ${maxAttemptsPerLetter} attempts.`);
            }
        }
        console.log(`Placed ${placedCount} unique letter items out of ${lettersToPlace.length} required.`);
        if (placedCount < lettersToPlace.length) {
            console.warn("Not all required letters could be placed. This attempt will fail solvability.");
            return false; // Signal failure to place all required letters
        }
        return true; // Signal success
    }


    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const fogRadius = difficultySettings[currentDifficulty].fogRadius;

        // Calculate viewport centered on player
        let viewXStart = Math.max(0, player.x - Math.floor(VIEWPORT_WIDTH_TILES / 2));
        let viewYStart = Math.max(0, player.y - Math.floor(VIEWPORT_HEIGHT_TILES / 2));
        let viewXEnd = Math.min(mazeWidth, viewXStart + VIEWPORT_WIDTH_TILES);
        let viewYEnd = Math.min(mazeHeight, viewYStart + VIEWPORT_HEIGHT_TILES);

        // Adjust viewport if it's smaller than maze dimensions to prevent drawing outside maze
        // and to ensure the viewport is filled if player is near edge.
        if (viewXEnd - viewXStart < VIEWPORT_WIDTH_TILES && mazeWidth >= VIEWPORT_WIDTH_TILES) {
            viewXStart = Math.max(0, viewXEnd - VIEWPORT_WIDTH_TILES);
        }
        if (viewYEnd - viewYStart < VIEWPORT_HEIGHT_TILES && mazeHeight >= VIEWPORT_HEIGHT_TILES) {
            viewYStart = Math.max(0, viewYEnd - VIEWPORT_HEIGHT_TILES);
        }
        // Ensure start is not negative if maze is smaller than viewport
        viewXStart = Math.max(0, viewXStart);
        viewYStart = Math.max(0, viewYStart);


        // No longer using global translate for the border effect with viewport.
        // Instead, we draw directly onto the fixed-size canvas.
        // ctx.save();
        // ctx.translate(TILE_SIZE, TILE_SIZE); // REMOVED global offset

        for (let y = viewYStart; y < viewYEnd; y++) {
            for (let x = viewXStart; x < viewXEnd; x++) {
                // Calculate drawing position on canvas (relative to viewport)
                const canvasX = (x - viewXStart) * TILE_SIZE;
                const canvasY = (y - viewYStart) * TILE_SIZE;

                // Line of Sight (Raycasting/Bresenham's Line Algorithm)
                // Visibility check is still based on player's true position (player.x, player.y)
                // relative to the cell's true position (x,y)
                let isVisible = false;
                const dist = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));

                if (dist <= fogRadius) {
                    isVisible = true; 
                    let linePlayerX = player.x;
                    let linePlayerY = player.y;
                    let lineCellX = x;
                    let lineCellY = y;

                    const dx = linePlayerX - lineCellX;
                    const dy = linePlayerY - lineCellY;
                    const steps = Math.max(Math.abs(dx), Math.abs(dy));

                    if (steps > 0) {
                        const xIncrement = dx / steps;
                        const yIncrement = dy / steps;

                        for (let i = 1; i < steps; i++) {
                            const checkX = Math.round(lineCellX + xIncrement * i);
                            const checkY = Math.round(lineCellY + yIncrement * i);

                            if (checkX >= 0 && checkX < mazeWidth && checkY >= 0 && checkY < mazeHeight) {
                                if (maze[checkY][checkX] === CELL_TYPE.WALL) {
                                    isVisible = false;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (isVisible) {
                    previouslySeen[y][x] = true;
                }

                if (!isVisible && !previouslySeen[y][x] && gameActive) {
                    ctx.fillStyle = FOG_COLOR;
                    ctx.fillRect(canvasX, canvasY, TILE_SIZE, TILE_SIZE);
                    continue;
                }

                let color = PATH_COLOR;
                let text = null;
                let textColor = 'black';

                // Ensure we are accessing a valid cell in the maze array
                if (y < 0 || y >= mazeHeight || x < 0 || x >= mazeWidth) {
                    // This should ideally not happen if viewport logic is correct
                    // but as a fallback, draw fog or skip
                    ctx.fillStyle = FOG_COLOR;
                    ctx.fillRect(canvasX, canvasY, TILE_SIZE, TILE_SIZE);
                    continue;
                }
                const cell = maze[y][x];

                if (cell === CELL_TYPE.WALL) color = WALL_COLOR;
                else if (cell === CELL_TYPE.PATH) color = PATH_COLOR;
                else if (typeof cell === 'object' && cell.type === CELL_TYPE.LETTER) {
                    color = PATH_COLOR;
                    text = cell.char;
                    textColor = LETTER_COLOR;
                } else if (cell === CELL_TYPE.DOOR || (typeof cell === 'object' && cell.type === CELL_TYPE.DOOR)) {
                    const doorInfo = doors.find(d => d.x === x && d.y === y);
                    if (doorInfo && doorInfo.isOpen) {
                        color = OPEN_DOOR_COLOR;
                        if (maze[y] && maze[y][x]) maze[y][x] = CELL_TYPE.OPEN_DOOR;
                    } else {
                        color = DOOR_COLOR;
                    }
                } else if (cell === CELL_TYPE.OPEN_DOOR) {
                    color = OPEN_DOOR_COLOR;
                }

                ctx.fillStyle = color;
                ctx.fillRect(canvasX, canvasY, TILE_SIZE, TILE_SIZE);

                if (text) {
                    ctx.font = `${TILE_SIZE * 0.6}px Arial`;
                    ctx.fillStyle = textColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, canvasX + TILE_SIZE / 2, canvasY + TILE_SIZE / 2);
                }
            }
        }

        // Draw player relative to the viewport
        const playerCanvasX = (player.x - viewXStart) * TILE_SIZE;
        const playerCanvasY = (player.y - viewYStart) * TILE_SIZE;

        // Only draw player if they are within the calculated viewport bounds
        // This check might be redundant if viewport logic correctly always includes player,
        // but good as a safeguard.
        if (player.x >= viewXStart && player.x < viewXEnd && player.y >= viewYStart && player.y < viewYEnd) {
            ctx.fillStyle = PLAYER_COLOR;
            ctx.fillRect(playerCanvasX, playerCanvasY, TILE_SIZE, TILE_SIZE);
        }

        // ctx.restore(); // No longer needed as global translate was removed

        // console.log("Maze drawn with viewport."); // Optional: for debugging
    }


    function movePlayer(dx, dy) {
        if (!gameActive) return;

        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newX < 0 || newX >= mazeWidth || newY < 0 || newY >= mazeHeight) {
            return; // Out of bounds
        }

        const targetCell = maze[newY][newX];
        const targetCellType = (typeof targetCell === 'object' && targetCell.type) ? targetCell.type : targetCell;


        // Check wall collision
        if (targetCellType === CELL_TYPE.WALL) {
            return;
        }

        // Check door collision
        if (targetCellType === CELL_TYPE.DOOR) {
            const door = doors.find(d => d.x === newX && d.y === newY);
            if (door && !door.isOpen) {
                currentInteractingDoor = door;
                openDoorModal(door);
                return; // Stop movement, modal will handle outcome
            }
        }


        // Move player
        player.x = newX;
        player.y = newY;

        // Check for letter collection
        if (targetCellType === CELL_TYPE.LETTER) {
            const letterChar = targetCell.char; // Store before overwriting cell
            collectedLetters.add(letterChar);
            maze[newY][newX] = CELL_TYPE.PATH; // Remove letter from maze, make it a path
            updateCollectedLettersDisplay();
            updateWordHints(letterChar); // New function to update hints
            console.log(`Collected letter: ${letterChar}. Current letters: ${Array.from(collectedLetters).join(', ')}`);
        }

        drawMaze(); // Redraw after move
    }

    function canUnlockDoorWithCollectedLetters(doorWord) {
        for (const char of doorWord) {
            if (!collectedLetters.has(char)) {
                return false;
            }
        }
        return true;
    }

    function updateHintListAfterUnlock(unlockedWord) {
        const items = hintListDisplay.getElementsByTagName('li');
        for (let item of items) {
            if (item.dataset.originalWord === unlockedWord) {
                item.textContent = unlockedWord; // Show full word before striking
                item.style.textDecoration = 'line-through';
                item.style.color = '#aaa';
                break;
            }
        }
    }


    function updateCollectedLettersDisplay() {
        collectedLettersDisplay.textContent = Array.from(collectedLetters).sort().join(', ');
    }

    function startTimer() {
        gameTimerInterval = setInterval(() => {
            secondsElapsed++;
            timerDisplay.textContent = `Time: ${secondsElapsed}s`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(gameTimerInterval);
    }

    function winGame() {
        if (!gameActive) return; // Prevent multiple win triggers
        gameActive = false;
        stopTimer();
        alert(`Congratulations! You've unlocked all doors in ${secondsElapsed} seconds.`);
        saveScore(currentDifficulty, secondsElapsed);
        updateLeaderboardDisplay();
        // Consider resetting the game or offering a new game
        startGameButton.textContent = "Play Again?";
    }

    // --- Leaderboard Logic ---
    function saveScore(difficulty, time) {
        const scores = JSON.parse(localStorage.getItem(`mazeLeaderboard_${difficulty}`)) || [];
        scores.push({ time, date: new Date().toLocaleDateString() });
        scores.sort((a, b) => a.time - b.time); // Sort by best time
        localStorage.setItem(`mazeLeaderboard_${difficulty}`, JSON.stringify(scores.slice(0, 10))); // Keep top 10
    }

    function loadScores(difficulty) {
        return JSON.parse(localStorage.getItem(`mazeLeaderboard_${difficulty}`)) || [];
    }

    function updateLeaderboardDisplay() {
        const scores = loadScores(currentDifficulty); // Load scores for the current/selected difficulty
        leaderboardListDisplay.innerHTML = ''; // Clear existing
        if (scores.length === 0) {
            leaderboardListDisplay.innerHTML = '<li>No scores yet for this difficulty.</li>';
            return;
        }
        scores.forEach(score => {
            const li = document.createElement('li');
            li.textContent = `Time: ${score.time}s (${score.date})`;
            leaderboardListDisplay.appendChild(li);
        });
    }

    // --- Door Modal Logic ---
    function openDoorModal(door) {
        if (!door) return;
        currentInteractingDoor = door;
        doorWordInput.value = '';
        doorMessageDisplay.textContent = `Enter word for door at (${door.x}, ${door.y}).`;
        doorModal.style.display = 'block';
        doorWordInput.focus();
    }

    function closeDoorModal() {
        doorModal.style.display = 'none';
        currentInteractingDoor = null;
        doorMessageDisplay.textContent = '';
    }

    function handleDoorWordSubmit() {
        if (!currentInteractingDoor || !gameActive) return;

        const enteredWord = doorWordInput.value.trim().toUpperCase();
        const door = currentInteractingDoor;

        if (!enteredWord) {
            doorMessageDisplay.textContent = "Please enter a word.";
            return;
        }

        if (enteredWord === door.word) {
            // Word is correct, open the door regardless of collected letters for THIS word
            door.isOpen = true;
            maze[door.y][door.x] = CELL_TYPE.OPEN_DOOR;
            console.log(`Door at (${door.x},${door.y}) for word "${door.word}" unlocked by correct guess!`);
            updateHintListAfterUnlock(door.word); // Visually mark word as used
            closeDoorModal();

            // Check for win condition (all doors open)
            if (doors.every(d => d.isOpen)) {
                winGame();
            } else {
                drawMaze(); // Redraw maze if game not won yet
            }
        } else {
            // Incorrect word
            doorMessageDisplay.textContent = `"${enteredWord}" is incorrect. Try again.`;
            console.log(`Incorrect word for door ${door.id}. Entered: ${enteredWord}, Expected: ${door.word}`);
            doorWordInput.value = ''; // Clear input for next try, only if incorrect
        }
    }

    // --- Solvability Check (BFS) ---
    function isLevelSolvable() {
        if (!maze.length || !player || !wordsForLevel.length ) { // Removed doors.length === 0 check here, handled differently
            console.warn("Cannot check solvability: Missing critical game elements (maze, player, or words).");
            if (!player.x && !player.y) return false; // Player not placed
            if (!wordsForLevel.length) return false; // No words means no objective
        }

        if (doors.length === 0 && wordsForLevel.length > 0) {
             console.warn("Solvability check: No doors were placed, but words exist. Marking as unsolvable as doors are required.");
             return false;
        }
        // If there are no doors AND no words (e.g. an empty level definition), it's trivially solvable by doing nothing.
        // But our game implies doors from words.
        if (doors.length === 0) {
            console.log("Solvability check: No doors to unlock, level is trivially solvable (or no objective defined).");
            return true; 
        }

        // ** Adaptive Solvability based on difficulty **
        if (currentDifficulty === 'easy') {
            return isLevelSolvableStrict();
        } else {
            return isLevelSolvableRelaxed();
        }
    }

    // Stricter solvability check (used for 'easy')
    function isLevelSolvableStrict() {
        console.log("Running STRICT solvability check for easy difficulty...");
        const queue = [{
            x: player.x,
            y: player.y,
            letters: new Set(),
            openedDoors: new Set()
        }];
        const visited = new Set([`${player.x},${player.y},${''},${''}`]);
        let iterations = 0;
        const maxIterations = (mazeWidth * mazeHeight * (doors.length + 1) * 250);

        while (queue.length > 0) {
            iterations++;
            if (iterations > maxIterations) {
                console.warn("Strict Solvability: Max iterations reached.");
                return false;
            }
            const current = queue.shift();
            const { x, y, letters, openedDoors } = current;
            if (openedDoors.size === doors.length) {
                console.log("Strict Solvability: All doors can be opened.");
                return true;
            }
            const directions = [{dx:0, dy:-1}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:1, dy:0}];
            for (const dir of directions) {
                const nextX = x + dir.dx;
                const nextY = y + dir.dy;
                if (nextX >= 0 && nextX < mazeWidth && nextY >= 0 && nextY < mazeHeight) {
                    const cell = maze[nextY][nextX];
                    let cellType = (typeof cell === 'object' && cell.type) ? cell.type : cell;
                    let currentSimLetters = new Set(letters);
                    let currentSimOpenedDoors = new Set(openedDoors);
                    if (cellType === CELL_TYPE.WALL) continue;
                    if (cellType === CELL_TYPE.LETTER) currentSimLetters.add(cell.char);
                    if (cellType === CELL_TYPE.DOOR) {
                        const doorInfo = doors.find(d => d.x === nextX && d.y === nextY);
                        if (doorInfo && !currentSimOpenedDoors.has(doorInfo.id)) {
                            let canPassDoor = true;
                            for (const char of doorInfo.word) {
                                if (!currentSimLetters.has(char)) {
                                    canPassDoor = false; break;
                                }
                            }
                            if (canPassDoor) currentSimOpenedDoors.add(doorInfo.id);
                            else continue;
                        }
                    }
                    const lettersKey = Array.from(currentSimLetters).sort().join(',');
                    const openedDoorsKey = Array.from(currentSimOpenedDoors).sort().join(',');
                    const visitedKey = `${nextX},${nextY},${lettersKey},${openedDoorsKey}`;
                    if (visited.has(visitedKey)) continue;
                    visited.add(visitedKey);
                    queue.push({ x: nextX, y: nextY, letters: new Set(currentSimLetters), openedDoors: new Set(currentSimOpenedDoors) });
                }
            }
        }
        console.warn("Strict Solvability: Not all doors could be opened.");
        return false;
    }

    // Relaxed solvability check (used for 'medium' and 'hard')
    function isLevelSolvableRelaxed() {
        console.log("Running RELAXED solvability check for medium/hard difficulty...");
        const allRequiredUniqueLetters = new Set(wordsForLevel.join('').split(''));
        if (allRequiredUniqueLetters.size === 0 && doors.length > 0) {
            console.warn("Relaxed Solvability: Words are empty but doors exist. Unsolvable.")
            return false; // Should not happen if words.js is okay
        }
        if (allRequiredUniqueLetters.size === 0 && doors.length === 0) {
            return true; // No letters to collect, no doors to open.
        }

        // 1. Check if all unique letters are reachable and collectable
        let collectedAllLetters = false;
        const letterCollectionQueue = [{ x: player.x, y: player.y, letters: new Set() }];
        // Visited for letter collection: x,y,sortedCollectedLetters
        const letterCollectionVisited = new Set([`${player.x},${player.y},${''}`]);
        let letterIterations = 0;
        const maxLetterIterations = mazeWidth * mazeHeight * allRequiredUniqueLetters.size * 50; // Generous limit

        while (letterCollectionQueue.length > 0) {
            letterIterations++;
            if (letterIterations > maxLetterIterations) {
                console.warn("Relaxed Solvability (Letter Collection): Max iterations reached.");
                break; // Assume letters not all collectable
            }
            const current = letterCollectionQueue.shift();
            const { x, y, letters } = current;

            if (Array.from(allRequiredUniqueLetters).every(l => letters.has(l))) {
                collectedAllLetters = true;
                console.log("Relaxed Solvability: All unique required letters are collectable.");
                break;
            }

            const directions = [{dx:0, dy:-1}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:1, dy:0}];
            for (const dir of directions) {
                const nextX = x + dir.dx;
                const nextY = y + dir.dy;
                if (nextX >= 0 && nextX < mazeWidth && nextY >= 0 && nextY < mazeHeight) {
                    const cell = maze[nextY][nextX];
                    let cellType = (typeof cell === 'object' && cell.type) ? cell.type : cell;
                    if (cellType === CELL_TYPE.WALL || cellType === CELL_TYPE.DOOR) continue; // Cannot pass walls or (unopened) doors in this BFS part
                    
                    let nextLetters = new Set(letters);
                    if (cellType === CELL_TYPE.LETTER) {
                        nextLetters.add(cell.char);
                    }

                    const lettersKey = Array.from(nextLetters).sort().join(',');
                    const visitedKey = `${nextX},${nextY},${lettersKey}`;
                    if (letterCollectionVisited.has(visitedKey)) continue;
                    letterCollectionVisited.add(visitedKey);

                    letterCollectionQueue.push({ x: nextX, y: nextY, letters: new Set(nextLetters) });
                }
            }
        }

        if (!collectedAllLetters) {
            console.warn("Relaxed Solvability: Failed to find a path to collect all unique letters.");
            return false;
        }

        // 2. Check if all door locations are reachable (simple pathfinding, ignoring letters/door states)
        for (const door of doors) {
            const doorReachableQueue = [{ x: player.x, y: player.y, path: [`${player.x},${player.y}`] }];
            const doorReachableVisited = new Set([`${player.x},${player.y}`]);
            let doorFound = false;
            let doorPathIterations = 0;
            const maxDoorPathIterations = mazeWidth * mazeHeight * 2; // Limit for simple pathfind

            while (doorReachableQueue.length > 0) {
                doorPathIterations++;
                if (doorPathIterations > maxDoorPathIterations) {
                    console.warn(`Relaxed Solvability (Door Reachable ${door.id}): Max iterations.`);
                    break;
                }
                const current = doorReachableQueue.shift();
                if (current.x === door.x && current.y === door.y) {
                    doorFound = true;
                    break;
                }
                const directions = [{dx:0, dy:-1}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:1, dy:0}];
                for (const dir of directions) {
                    const nextX = current.x + dir.dx;
                    const nextY = current.y + dir.dy;
                    if (nextX >= 0 && nextX < mazeWidth && nextY >= 0 && nextY < mazeHeight) {
                        const cell = maze[nextY][nextX];
                        const cellType = (typeof cell === 'object' && cell.type) ? cell.type : cell;
                        // Can only move through paths or already opened doors (though this check doesn't track open state)
                        // For simplicity, allow pathing through anything not a wall.
                        // The door itself (target) is fine.
                        if (cellType !== CELL_TYPE.WALL || (nextX === door.x && nextY === door.y) ) {
                            const visitedKey = `${nextX},${nextY}`;
                            if (doorReachableVisited.has(visitedKey)) continue;
                            doorReachableVisited.add(visitedKey);
                            doorReachableQueue.push({ x: nextX, y: nextY, path: [...current.path, visitedKey] });
                        }
                    }
                }
            }
            if (!doorFound) {
                console.warn(`Relaxed Solvability: Door at (${door.x}, ${door.y}) is not reachable.`);
                return false;
            }
        }
        console.log("Relaxed Solvability: All unique letters and all doors are reachable.");
        return true;
    }

    // --- Event Listeners ---
    startGameButton.addEventListener('click', initGame);
    closeDoorModalButton.addEventListener('click', closeDoorModal);
    submitDoorWordButton.addEventListener('click', handleDoorWordSubmit);
    doorWordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && doorModal.style.display === 'block') {
            handleDoorWordSubmit();
        }
    });

    difficultySelect.addEventListener('change', () => {
        // When difficulty changes, update the leaderboard display for that difficulty
        // The game itself will only restart with the new difficulty when "Start Game" is pressed
        currentDifficulty = difficultySelect.value; // Update for leaderboard loading
        updateLeaderboardDisplay();
    });


    // Initial setup
    updateLeaderboardDisplay(); // Load leaderboard on page load for the default selected difficulty
    console.log("Game script loaded. Waiting for start.");

    window.addEventListener('keydown', (e) => {
        if (!gameActive || doorModal.style.display === 'block') return; // Ignore keydown if game not active or modal is open

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                movePlayer(0, -1);
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                movePlayer(0, 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                movePlayer(-1, 0);
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                movePlayer(1, 0);
                e.preventDefault();
                break;
        }
    });

    // New helper function to mask words
    function maskWord(word) {
        return '* '.repeat(word.length).trim(); // Add spaces for better readability
    }

    // New function to update word hints when a letter is collected
    function updateWordHints(collectedChar) {
        const items = hintListDisplay.getElementsByTagName('li');
        for (let item of items) {
            const originalWord = item.dataset.originalWord;
            let currentMaskedWord = item.dataset.maskedWord;

            if (originalWord.includes(collectedChar)) {
                let newMaskedArr = currentMaskedWord.split(' '); // Split by space for individual chars
                for (let i = 0; i < originalWord.length; i++) {
                    if (originalWord[i] === collectedChar) {
                        newMaskedArr[i] = collectedChar;
                    }
                }
                const newMaskedWord = newMaskedArr.join(' ');
                item.textContent = newMaskedWord;
                item.dataset.maskedWord = newMaskedWord;
            }
        }
    }
}); 