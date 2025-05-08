document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Make canvas fullscreen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-initialize or adjust game elements if needed upon resize
        if (gameState !== 'playing') { // Avoid disrupting active game
            initGame(); // Or a more specific resize handler
        }
    }
    window.addEventListener('resize', resizeCanvas);

    // Game state variables
    let bird;
    let pipes = [];
    let clouds = [];
    let buildings = [];
    let score = 0; // This will now be the base score (pipes passed)
    let displayedScore = 0; // The score shown to the player (base_score * multiplier)
    let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
    let scoreMultiplier = 1.0;
    let gameState = 'preview'; // Start with preview mode: 'preview', 'ready', 'playing', 'gameOver'
    let attemptNumber = parseInt(localStorage.getItem('flappyBirdAttemptNumber')) || 1;
    let pastScores = JSON.parse(localStorage.getItem('flappyBirdPastScores')) || [];
    const MAX_PAST_SCORES = 10;
    let frames = 0; // For controlling pipe generation timing
    const groundHeight = 50; // Height of the ground area

    let gameLoopRequest = null; // For managing requestAnimationFrame

    // Load sounds (optional, ensure you have these files or remove if not)
    // const flapSound = new Audio('sounds/flap.wav');
    // const scoreSound = new Audio('sounds/score.wav');
    // const hitSound = new Audio('sounds/hit.wav');

    // Sun properties
    const sunRadius = 50;
    // sunX and sunY will be calculated dynamically in drawSun

    // Cloud properties
    const CLOUD_SPEED_FACTOR = 0.5; // Slower than pipes

    // Building properties
    const BUILDING_SPEED_FACTOR = 0.2; // Slower than clouds

    function initGame(isNewAttempt = false) {
        bird = new Bird(canvas);
        pipes = [];
        clouds = [];
        buildings = [];
        score = 0;
        displayedScore = 0;
        scoreMultiplier = 1.0;
        frames = 0;

        if (isNewAttempt) {
            // This is called when player actively starts or restarts a game attempt
            // Ensure attemptNumber is incremented only once per new attempt
            if (gameState === 'preview' || gameState === 'gameOver' || gameState === 'ready') {
                attemptNumber++;
            }
            localStorage.setItem('flappyBirdAttemptNumber', attemptNumber.toString());
            gameState = 'playing';
        } else { // Initial setup for preview
            gameState = 'preview';
            // Attempt number is already loaded or initialized to 1 globally
            generateInitialScenery();
        }
    }

    function generateInitialScenery() {
        // Pre-populate some clouds and buildings for preview
        for (let i = 0; i < 5; i++) {
            generateCloud(canvas.width * Math.random());
        }
        for (let i = 0; i < 3; i++) {
            generateBuilding(canvas.width * Math.random());
        }
    }

    function masterGameLoop() {
        if (gameState === 'gameOver') {
            if (gameLoopRequest) {
                cancelAnimationFrame(gameLoopRequest);
                gameLoopRequest = null;
            }
            draw(); // Draw the final game over screen
            return; // Stop the loop
        }

        update();
        draw();
        frames++;
        gameLoopRequest = requestAnimationFrame(masterGameLoop);
    }

    function update() {
        if (gameState === 'playing' || gameState === 'preview') {
            if (gameState === 'playing') {
                bird.update();
            } else { // gameState === 'preview'
                bird.autopilotUpdate(pipes, canvas, groundHeight, PIPE_GAP_HEIGHT); // Use autopilot
                bird.update(); // Still need to apply gravity etc.
            }

            // Ground collision
            if (bird.y + BIRD_SIZE / 2 > canvas.height - groundHeight) {
                if (gameState === 'playing') {
                    gameState = 'gameOver';
                    updateHighScoreAndPastScores();
                } else { // preview mode, just reset bird to avoid sticking to ground
                    bird.y = canvas.height / 2;
                    bird.velocity = 0;
                }
                return; // In playing mode, stop updates on game over
            }

            // Pipe generation (only in playing and preview mode)
            if (frames % 100 === 0) {
                generatePipes();
            }
            if (frames % 200 === 0) { // Generate clouds less frequently
                generateCloud();
            }
            if (frames % 350 === 0) { // Generate buildings even less frequently
                generateBuilding();
            }

            // Update pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                pipes[i].update();

                // Collision with pipes
                if (pipes[i].collidesWith(bird)) {
                    if (gameState === 'playing') {
                        gameState = 'gameOver';
                        updateHighScoreAndPastScores();
                        return;
                    } else {
                        // In preview, collisions don't end game, bird should try to avoid
                    }
                }

                // Score (only in playing mode)
                if (gameState === 'playing' && pipes[i].x + pipes[i].width < bird.x && !pipes[i].passed && !pipes[i].isTopPipe) {
                    pipes[i].passed = true;
                    const topPipe = pipes.find(p => p.x === pipes[i].x && p.isTopPipe);
                    if (topPipe) topPipe.passed = true;

                    score++; // Base score is the number of pipes passed

                    if (score > 5) {
                        scoreMultiplier = Math.min(10.0, 1.0 + (score - 5) * 0.1);
                    } else {
                        scoreMultiplier = 1.0;
                    }
                    displayedScore = Math.floor(score * scoreMultiplier);
                }

                // Remove off-screen pipes
                if (pipes[i].isOffScreen()) {
                    pipes.splice(i, 1);
                }
            }
        }
        updateClouds();
        updateBuildings();
    }

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        ctx.fillStyle = '#70c5ce'; // Light blue background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Sun
        drawSun();

        // Draw Clouds
        clouds.forEach(cloud => cloud.draw());

        // Draw Buildings
        buildings.forEach(building => building.draw());

        // Draw pipes
        pipes.forEach(pipe => pipe.draw());

        // Draw ground
        ctx.fillStyle = '#ded895'; // Sandy ground color
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
        ctx.fillStyle = '#543847'; // Ground top line
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 5);

        // Draw bird
        if (bird) { // Ensure bird is initialized
            bird.draw();
        }

        // Draw score
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Score: ' + displayedScore, 10, 25); // Use displayedScore
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.strokeText('Score: ' + displayedScore, 10, 25); // Use displayedScore

        // Display High Score
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('High Score: ' + Math.floor(highScore), canvas.width - 150, 25);
        ctx.strokeStyle = 'black';
        ctx.strokeText('High Score: ' + Math.floor(highScore), canvas.width - 150, 25);

        // Display Attempt Number
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Attempt: #' + attemptNumber, canvas.width - 150, 50);
        ctx.strokeStyle = 'black';
        ctx.strokeText('Attempt: #' + attemptNumber, canvas.width - 150, 50);

        // Display Score Multiplier
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Multiplier: x' + scoreMultiplier.toFixed(1), 10, 50);
        ctx.strokeStyle = 'black';
        ctx.strokeText('Multiplier: x' + scoreMultiplier.toFixed(1), 10, 50);

        if (gameState === 'ready') {
            drawReadyScreen();
        } else if (gameState === 'gameOver') {
            drawGameOverScreen();
        } else if (gameState === 'preview') {
            drawPreviewScreen();
        }
    }

    function generatePipes() {
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - PIPE_GAP_HEIGHT - groundHeight - minPipeHeight;
        const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
        const bottomPipeHeight = canvas.height - topPipeHeight - PIPE_GAP_HEIGHT - groundHeight;

        pipes.push(new Pipe(canvas, true, topPipeHeight, canvas.width));
        pipes.push(new Pipe(canvas, false, bottomPipeHeight, canvas.width));
    }

    function drawSun() {
        const currentSunX = canvas.width - sunRadius - 70;
        const currentSunY = sunRadius + 50;
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(currentSunX, currentSunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cloud Class (simple version)
    class Cloud {
        constructor(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size; // A simple size factor
            this.speed = PIPE_SPEED * CLOUD_SPEED_FACTOR;
        }

        update() {
            this.x -= this.speed;
        }

        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size * 20, this.size * 15, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + this.size * 15, this.y - this.size * 5, this.size * 25, this.size * 20, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x - this.size * 15, this.y - this.size * 3, this.size * 22, this.size * 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        isOffScreen() {
            return this.x + this.size * 40 < 0; // Approximate width
        }
    }

    function generateCloud(startX) {
        const y = Math.random() * (canvas.height / 3) + 30; // Upper third of the screen
        const size = Math.random() * 0.5 + 0.8; // Random size
        clouds.push(new Cloud(startX !== undefined ? startX : canvas.width, y, size));
    }

    function updateClouds() {
        for (let i = clouds.length - 1; i >= 0; i--) {
            clouds[i].update();
            if (clouds[i].isOffScreen()) {
                clouds.splice(i, 1);
            }
        }
    }

    // Building Class
    class Building {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y; // This will be the top of the building, drawn from ground up
            this.width = width;
            this.height = height;
            this.speed = PIPE_SPEED * BUILDING_SPEED_FACTOR;
            this.color = `rgb(${Math.random() * 50 + 50}, ${Math.random() * 50 + 50}, ${Math.random() * 50 + 50})`; // Darkish colors
            this.windowColor = 'rgba(200, 200, 255, 0.7)'; // Light blueish windows
            this.windows = [];
            this.generateWindows();
        }

        generateWindows() {
            const windowMargin = 5;
            const windowSize = 10;
            const numFloors = Math.floor((this.height - windowMargin) / (windowSize + windowMargin));
            const numWindowsPerRow = Math.floor((this.width - windowMargin) / (windowSize + windowMargin));

            for (let r = 0; r < numFloors; r++) {
                for (let c = 0; c < numWindowsPerRow; c++) {
                    if (Math.random() > 0.3) { // Not all windows are lit
                        this.windows.push({
                            x: windowMargin + c * (windowSize + windowMargin),
                            y: windowMargin + r * (windowSize + windowMargin)
                        });
                    }
                }
            }
        }

        update() {
            this.x -= this.speed;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, canvas.height - groundHeight - this.height, this.width, this.height);

            ctx.fillStyle = this.windowColor;
            this.windows.forEach(win => {
                ctx.fillRect(
                    this.x + win.x,
                    canvas.height - groundHeight - this.height + win.y,
                    10, // window width
                    10  // window height
                );
            });
        }

        isOffScreen() {
            return this.x + this.width < 0;
        }
    }

    function generateBuilding(startX) {
        const minBuildingHeight = 50;
        const maxBuildingHeight = canvas.height / 2.5;
        const height = Math.random() * (maxBuildingHeight - minBuildingHeight) + minBuildingHeight;
        const width = Math.random() * 50 + 50;
        buildings.push(new Building(startX !== undefined ? startX : canvas.width, 0, width, height)); // y is not used directly here
    }

    function updateBuildings() {
        for (let i = buildings.length - 1; i >= 0; i--) {
            buildings[i].update();
            if (buildings[i].isOffScreen()) {
                buildings.splice(i, 1);
            }
        }
    }

    function drawReadyScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Press Space to Start', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Arial';
        ctx.fillText('Flap to fly!', canvas.width / 2, canvas.height / 2 + 30);
    }

    function drawPreviewScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Lighter overlay for preview
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flappy Bird Preview', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText('Click or Press Space to Play!', canvas.width / 2, canvas.height / 2 + 20);
    }

    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 120); // Adjusted Y for table
        ctx.font = '20px Arial';
        ctx.fillText('Score: ' + displayedScore, canvas.width / 2, canvas.height / 2 - 80); // Adjusted Y
        ctx.fillText('High Score: ' + Math.floor(highScore), canvas.width / 2, canvas.height / 2 - 50); // Adjusted Y

        // Draw High Score Table
        drawPastScoresTable();

        ctx.font = '25px Arial';
        ctx.fillText('Click or Press Space to Restart', canvas.width / 2, canvas.height / 2 + 150); // Adjusted Y
    }

    function drawPastScoresTable() {
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';

        const tableStartY = canvas.height / 2 - 20;
        const lineHeight = 22;
        ctx.fillText('Top Scores', canvas.width / 2, tableStartY);

        ctx.font = '14px Arial';
        ctx.fillText('Rank   Attempt   Score', canvas.width / 2, tableStartY + lineHeight);
        ctx.fillText('---------------------------', canvas.width / 2, tableStartY + lineHeight + 5);

        const scoresToDisplay = pastScores.slice(0, MAX_PAST_SCORES);
        scoresToDisplay.forEach((entry, index) => {
            const rank = (index + 1).toString().padStart(2, ' ');
            const attempt = entry.attempt.toString().padStart(5, ' ');
            const scoreVal = entry.score.toString().padStart(5, ' ');
            ctx.fillText(
                `${rank}    #${attempt}    ${scoreVal}`,
                canvas.width / 2,
                tableStartY + (index + 2) * lineHeight + 10 // +2 for header lines
            );
        });
    }

    function updateHighScoreAndPastScores() {
        // Update overall high score (single highest)
        if (displayedScore > highScore) {
            highScore = displayedScore;
            localStorage.setItem('flappyBirdHighScore', highScore);
        }

        // Add current score to pastScores list
        pastScores.push({ score: displayedScore, attempt: attemptNumber });

        // Sort pastScores by score descending, then by attempt number ascending for ties
        pastScores.sort((a, b) => {
            if (b.score === a.score) {
                return a.attempt - b.attempt; // Lower attempt number first for ties
            }
            return b.score - a.score; // Higher score first
        });

        // Keep only top MAX_PAST_SCORES
        if (pastScores.length > MAX_PAST_SCORES) {
            pastScores = pastScores.slice(0, MAX_PAST_SCORES);
        }

        localStorage.setItem('flappyBirdPastScores', JSON.stringify(pastScores));
    }

    // Event listener for flapping
    function handleInput() {
        if (gameState === 'playing') {
            bird.flap();
        } else if (gameState === 'gameOver') {
            initGame(true); // Start a new attempt, sets gameState to 'playing'
            bird.flap();    // Give a starting flap
            if (!gameLoopRequest) { // If loop was fully stopped
                masterGameLoop(); // Restart it
            }
        } else if (gameState === 'ready' || gameState === 'preview') {
            initGame(true); // Start a new attempt, sets gameState to 'playing'
            bird.flap();
            // If coming from preview, the masterGameLoop should already be running.
            // initGame(true) sets gameState to 'playing', so the loop will continue correctly.
            // If it was somehow stopped, ensure it starts.
            if (!gameLoopRequest) {
                masterGameLoop();
            }
        }
    }

    canvas.addEventListener('click', handleInput);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent space from scrolling the page
            handleInput();
        }
    });

    // Start the game
    resizeCanvas(); // Call resizeCanvas once after DOM is loaded and before initGame
    // Load attemptNumber and pastScores if not already done at the top
    const initialAttemptNumber = localStorage.getItem('flappyBirdAttemptNumber');
    if (initialAttemptNumber) {
        attemptNumber = parseInt(initialAttemptNumber);
    } else {
        attemptNumber = 1; // Start with 1 if nothing is stored, initGame will increment for the first actual attempt
    }
    const initialPastScores = localStorage.getItem('flappyBirdPastScores');
    if (initialPastScores) {
        pastScores = JSON.parse(initialPastScores);
    }

    initGame(false); // Initialize with preview mode (isNewAttempt = false)
    masterGameLoop(); // Start the game loop once everything is loaded
});
