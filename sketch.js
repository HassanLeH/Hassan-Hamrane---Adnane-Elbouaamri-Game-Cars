/**
 * sketch.js - Racing Game with Real Competition
 * Player must WIN the race (finish 1st) or LOSE
 */

// Game states
let gameState = 'menu';
let currentLevel = 1;
const MAX_LEVEL = 10;
const LAPS_TO_WIN = 2;

// Objects
let track;
let playerCar;
let aiCars = [];
let levelSelect;

// Race state
let racePositions = [];
let raceFinished = false;
let playerPosition = 1;
let winner = null;

// Config
let debugMode = false;

function setup() {
    createCanvas(1000, 700);
    textFont('Arial');
    levelSelect = new LevelSelect();
}

function initLevel(level) {
    currentLevel = level;
    track = new Track(level);

    // Reset race state
    raceFinished = false;
    winner = null;
    playerPosition = 1;

    // Create player at start line
    const startPos = track.waypoints[0];
    playerCar = new PlayerCar(startPos.x, startPos.y, track);

    if (track.waypoints.length > 1) {
        const dir = p5.Vector.sub(track.waypoints[1], track.waypoints[0]);
        dir.normalize();
        dir.mult(2);
        playerCar.velocity = dir;
    }

    createAICars(level);
    gameState = 'playing';
}

/**
 * Create AI cars with difficulty scaling
 * All cars start at the same starting line (lap 0) for fair racing
 */
function createAICars(level) {
    aiCars = [];

    const numCars = min(3 + level, 10);

    // AI speed scales with level - gets progressively harder
    const baseSpeed = 2.5 + level * 0.35;
    const speedVariation = 0.25;

    // Get starting direction
    const startPos = track.waypoints[0];
    const nextWp = track.waypoints[1];
    const startDir = p5.Vector.sub(nextWp, startPos);
    startDir.normalize();
    const perpDir = createVector(-startDir.y, startDir.x);

    for (let i = 0; i < numCars; i++) {
        // Grid start: 2 cars per row, staggered behind player
        const row = floor(i / 2) + 1;  // Start from row 1 (behind player)
        const col = (i % 2) * 2 - 1;   // -1 or +1 (left or right)

        // Position behind start line
        const offset = p5.Vector.mult(startDir, -row * 35);      // Behind
        const sideOffset = p5.Vector.mult(perpDir, col * 20);    // Side

        const spawnPos = p5.Vector.add(startPos, offset);
        spawnPos.add(sideOffset);

        const ai = new FollowerCar(spawnPos.x, spawnPos.y, track);

        // Everyone starts at waypoint 0, lap 0
        ai.currentWaypointIndex = 0;
        ai.lastCheckpoint = 0;
        ai.laps = 0;
        ai.checkpointsReached = 0;

        // Progressive difficulty
        ai.maxspeed = baseSpeed + random(-speedVariation, speedVariation);
        ai.maxforce = 0.18 + level * 0.025;

        // Initial velocity pointing forward
        ai.velocity = p5.Vector.mult(startDir, 1.5);

        aiCars.push(ai);
    }

}

/**
 * Calculate race positions
 */
function updateRacePositions() {
    // Get player progress
    const playerProgress = playerCar.laps * track.waypoints.length + playerCar.lastCheckpoint;

    // Get all racers with their progress
    let racers = [
        { type: 'player', progress: playerProgress, laps: playerCar.laps }
    ];

    for (let i = 0; i < aiCars.length; i++) {
        const ai = aiCars[i];
        const aiProgress = ai.laps * track.waypoints.length + ai.lastCheckpoint;
        racers.push({
            type: 'ai',
            index: i,
            progress: aiProgress,
            laps: ai.laps
        });
    }

    // Sort by progress (highest first)
    racers.sort((a, b) => b.progress - a.progress);

    // Find player position
    for (let i = 0; i < racers.length; i++) {
        if (racers[i].type === 'player') {
            playerPosition = i + 1;
            break;
        }
    }

    racePositions = racers;
}

/**
 * Check for race completion
 */
function checkRaceFinished() {
    // Check if player finished
    if (playerCar.laps >= LAPS_TO_WIN && !raceFinished) {
        raceFinished = true;
        winner = 'player';
        playerCar.finished = true;

        // Player won - unlock next level
        levelSelect.unlockLevel(currentLevel + 1);

        if (currentLevel >= MAX_LEVEL) {
            gameState = 'gameOver';
        } else {
            gameState = 'levelComplete';
        }
        return;
    }

    // Check if any AI finished first
    for (let ai of aiCars) {
        if (ai.laps >= LAPS_TO_WIN && !raceFinished) {
            raceFinished = true;
            winner = 'ai';

            // Player lost!
            gameState = 'raceLost';
            return;
        }
    }
}

function draw() {
    switch (gameState) {
        case 'menu':
            drawMainMenu();
            break;
        case 'levelSelect':
            drawLevelSelect();
            break;
        case 'playing':
            updateGame();
            break;
        case 'levelComplete':
            drawLevelComplete();
            break;
        case 'raceLost':
            drawRaceLost();
            break;
        case 'gameOver':
            drawGameOver();
            break;
    }
}

/**
 * Main menu
 */
function drawMainMenu() {
    for (let y = 0; y < height; y++) {
        stroke(lerpColor(color(25, 30, 55), color(15, 20, 40), y / height));
        line(0, y, width, y);
    }

    noStroke();
    fill(255, 200, 50, 30);
    for (let i = 0; i < 5; i++) {
        ellipse(100 + i * 200, 600, 300, 100);
    }

    fill(255, 200, 50);
    textAlign(CENTER, CENTER);
    textSize(70);
    textStyle(BOLD);
    text("🏎️ RACE", width / 2, height / 3 - 30);
    text("CHALLENGE", width / 2, height / 3 + 50);

    textStyle(NORMAL);

    drawMenuButton(width / 2, height / 2 + 60, "START GAME", true);
    drawMenuButton(width / 2, height / 2 + 120, "RESET PROGRESS", false);

    fill(120, 120, 120);
    textSize(14);
    text("Press SPACE or click to start", width / 2, height - 80);

    fill(255, 100, 100);
    textSize(13);
    text("⚠️ You must FINISH FIRST to win!", width / 2, height - 55);

    fill(80, 80, 80);
    textSize(11);
    text("v1.0 - 10 Levels  •  Real Competition", width / 2, height - 30);
}

function drawMenuButton(x, y, label, isPrimary) {
    const bw = 250;
    const bh = 45;

    const isHovered = mouseX >= x - bw / 2 && mouseX <= x + bw / 2 &&
        mouseY >= y - bh / 2 && mouseY <= y + bh / 2;

    noStroke();
    fill(0, 0, 0, 60);
    rect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh, 8);

    fill(isPrimary ? (isHovered ? color(80, 200, 100) : color(50, 180, 80)) :
        (isHovered ? color(100, 100, 110) : color(70, 75, 90)));
    stroke(isPrimary ? color(100, 220, 120) : color(90, 95, 110));
    strokeWeight(2);
    rect(x - bw / 2, y - bh / 2, bw, bh, 8);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text(label, x, y);
    textStyle(NORMAL);
}

function drawLevelSelect() {
    levelSelect.handleMouseMove(mouseX, mouseY);
    levelSelect.show();
}

/**
 * Game update
 */
function updateGame() {
    track.show();

    // Update positions
    updateRacePositions();

    // Update player
    playerCar.update();
    playerCar.show();

    // Update AI
    for (let ai of aiCars) {
        ai.applyBehaviors(aiCars, playerCar);
        ai.update();
        ai.show();
    }

    // Check race end
    checkRaceFinished();

    // Draw HUD
    drawGameHUD();

    if (debugMode) {
        drawDebug();
    }
}

/**
 * Player won!
 */
function drawLevelComplete() {
    track.show();
    playerCar.show();
    for (let ai of aiCars) ai.show();

    fill(0, 100, 0, 220);
    rect(0, 0, width, height);

    const bounce = sin(frameCount * 0.1) * 10;

    fill(255, 215, 0);
    textAlign(CENTER, CENTER);
    textSize(80);
    text("🏆", width / 2, height / 3 - 20 + bounce);

    fill(100, 255, 100);
    textSize(50);
    textStyle(BOLD);
    text("1st PLACE!", width / 2, height / 2 - 30);

    textStyle(NORMAL);
    fill(255);
    textSize(26);
    text(`Level ${currentLevel} Complete!`, width / 2, height / 2 + 20);

    if (currentLevel < MAX_LEVEL) {
        fill(255, 255, 100);
        textSize(18);
        text(`Level ${currentLevel + 1} Unlocked!`, width / 2, height / 2 + 60);
    }

    fill(200, 200, 200);
    textSize(16);
    text("SPACE: Next Level  •  M: Menu", width / 2, height * 0.78);
}

/**
 * Player lost!
 */
function drawRaceLost() {
    track.show();
    playerCar.show();
    for (let ai of aiCars) ai.show();

    fill(100, 0, 0, 220);
    rect(0, 0, width, height);

    const shake = sin(frameCount * 0.3) * 3;

    fill(255, 80, 80);
    textAlign(CENTER, CENTER);
    textSize(70);
    text("💥", width / 2 + shake, height / 3 - 10);

    fill(255, 100, 100);
    textSize(50);
    textStyle(BOLD);
    text("YOU LOST!", width / 2, height / 2 - 30);

    textStyle(NORMAL);
    fill(255);
    textSize(24);
    text(`Finished in position ${playerPosition}`, width / 2, height / 2 + 20);

    fill(200, 200, 200);
    textSize(16);
    text("An opponent finished first!", width / 2, height / 2 + 55);

    fill(255, 200, 100);
    textSize(18);
    text("SPACE: Try Again  •  M: Menu", width / 2, height * 0.78);
}

/**
 * Champion!
 */
function drawGameOver() {
    track.show();
    playerCar.show();
    for (let ai of aiCars) ai.show();

    fill(50, 0, 80, 220);
    rect(0, 0, width, height);

    const bounce = sin(frameCount * 0.08) * 8;

    fill(255, 215, 0);
    textAlign(CENTER, CENTER);
    textSize(60);
    text("🏆👑🏆", width / 2, height / 3 - 10 + bounce);

    fill(255, 215, 0);
    textSize(55);
    textStyle(BOLD);
    text("CHAMPION!", width / 2, height / 2 - 10);

    textStyle(NORMAL);
    fill(255);
    textSize(24);
    text("You won all 10 races!", width / 2, height / 2 + 40);

    fill(200, 200, 255);
    textSize(18);
    text("SPACE: Play Again  •  M: Menu", width / 2, height * 0.75);
}

/**
 * Game HUD with positions and NITRO gauge
 */
function drawGameHUD() {
    push();

    // Left panel - Race info
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 200, 170, 0, 0, 12, 0);

    fill(255, 200, 50);
    textAlign(LEFT, TOP);
    textSize(20);
    textStyle(BOLD);
    text(`LEVEL ${currentLevel}`, 12, 10);

    // Position indicator (BIG)
    textSize(36);
    if (playerPosition === 1) {
        fill(255, 215, 0);
    } else if (playerPosition <= 3) {
        fill(200, 200, 200);
    } else {
        fill(255, 100, 100);
    }
    text(`P${playerPosition}`, 140, 8);

    textStyle(NORMAL);
    fill(180);
    textSize(11);
    text(levelSelect.getLevelInfo(currentLevel).name, 12, 35);

    fill(255);
    textSize(15);
    text(`Lap: ${playerCar.laps + 1} / ${LAPS_TO_WIN}`, 12, 55);

    // Progress bar
    fill(40, 40, 40);
    rect(12, 78, 176, 12, 4);

    const progress = playerCar.getLapProgress();
    fill(playerPosition === 1 ? color(100, 255, 100) : color(255, 200, 50));
    rect(12, 78, 176 * (progress / 100), 12, 4);

    // === NITRO GAUGE ===
    fill(180);
    textSize(11);
    text("NITRO [SHIFT/N]:", 12, 98);

    // Nitro bar background
    fill(40, 40, 40);
    rect(12, 113, 176, 14, 4);

    // Nitro bar fill
    const nitroPercent = playerCar.getNitroPercent();
    if (playerCar.nitroActive) {
        // Pulsing blue when active
        const pulse = sin(frameCount * 0.3) * 30;
        fill(50 + pulse, 150 + pulse, 255);
    } else if (nitroPercent < 30) {
        // Red when low
        fill(255, 80, 80);
    } else {
        // Cyan when ready
        fill(50, 200, 255);
    }
    rect(12, 113, 176 * (nitroPercent / 100), 14, 4);

    // Nitro percentage text
    fill(255);
    textSize(9);
    textAlign(CENTER, CENTER);
    text(`${floor(nitroPercent)}%`, 100, 120);

    // Position list
    fill(180);
    textAlign(LEFT, TOP);
    textSize(10);
    text("Positions:", 12, 135);

    for (let i = 0; i < min(3, racePositions.length); i++) {
        const racer = racePositions[i];
        if (racer.type === 'player') {
            fill(255, 200, 50);
            text(`${i + 1}. YOU`, 12, 148 + i * 10);
        } else {
            fill(150);
            text(`${i + 1}. Car ${racer.index + 1}`, 12, 148 + i * 10);
        }
    }

    // Right - controls
    fill(0, 0, 0, 150);
    rect(width - 140, 0, 140, 90, 0, 0, 0, 12);

    fill(150);
    textAlign(RIGHT, TOP);
    textSize(10);
    text("↑↓←→ / WASD: Drive", width - 10, 10);
    text("SHIFT / N: NITRO 🔥", width - 10, 24);
    text("A: Auto Mode 🤖", width - 10, 38);
    text("D: Debug", width - 10, 52);
    text("ESC: Restart", width - 10, 66);
    text("M: Menu", width - 10, 80);
    textSize(9);
    text(`FPS: ${floor(frameRate())}`, width - 10, 94);

    // Speed meter
    fill(0, 0, 0, 150);
    rect(width - 85, height - 60, 85, 60, 12, 0, 0, 0);

    const speed = floor(playerCar.velocity.mag() * 25);

    // Speed text (blue when nitro active)
    if (playerCar.nitroActive) {
        fill(100, 200, 255);
    } else {
        fill(255);
    }
    textAlign(CENTER, CENTER);
    textSize(24);
    text(speed, width - 42, height - 35);
    textSize(10);
    text("km/h", width - 42, height - 14);

    // Warning if not in 1st
    if (playerPosition > 1) {
        fill(255, 50, 50, 150 + sin(frameCount * 0.2) * 100);
        textAlign(CENTER, TOP);
        textSize(16);
        textStyle(BOLD);
        text(`⚠️ POSITION ${playerPosition} - CATCH UP!`, width / 2, 10);
        textStyle(NORMAL);
    }

    // Auto mode indicator
    if (playerCar.autoMode) {
        fill(50, 200, 255, 200);
        textAlign(CENTER, TOP);
        textSize(18);
        textStyle(BOLD);
        text("🤖 AUTO MODE", width / 2, 35);
        textStyle(NORMAL);
    }

    pop();
}

function drawDebug() {
    push();

    track.showDebug();

    const playerTarget = track.waypoints[playerCar.lastCheckpoint];
    stroke(255, 255, 0);
    strokeWeight(2);
    noFill();
    ellipse(playerTarget.x, playerTarget.y, 30, 30);

    stroke(255, 100, 100, 150);
    strokeWeight(1);
    for (let ai of aiCars) {
        const target = track.waypoints[ai.currentWaypointIndex];
        line(ai.position.x, ai.position.y, target.x, target.y);
    }

    stroke(0, 255, 0);
    strokeWeight(2);
    const pv = p5.Vector.mult(playerCar.velocity, 8);
    line(playerCar.position.x, playerCar.position.y,
        playerCar.position.x + pv.x, playerCar.position.y + pv.y);

    // === OBSTACLE DETECTION VISUALIZATION FOR ALL CARS ===
    drawObstacleDetectionRays(playerCar, color(255, 255, 0));  // Yellow for player
    for (let ai of aiCars) {
        drawObstacleDetectionRays(ai, ai.carColor || color(255, 100, 100));
    }

    fill(0, 0, 0, 180);
    noStroke();
    rect(0, height - 100, 200, 100, 0, 12, 0, 0);

    fill(0, 255, 0);
    textAlign(LEFT, TOP);
    textSize(11);
    text("DEBUG MODE", 10, height - 95);
    fill(200);
    text(`Player Laps: ${playerCar.laps}`, 10, height - 78);
    text(`Player Progress: ${playerCar.lastCheckpoint}`, 10, height - 62);
    text(`AI[0] Laps: ${aiCars[0]?.laps || 0}`, 10, height - 46);
    text(`AI[0] Speed: ${aiCars[0]?.maxspeed.toFixed(2) || 0}`, 10, height - 30);
    text(`Position: ${playerPosition} / ${aiCars.length + 1}`, 10, height - 14);

    pop();
}

/**
 * Draw obstacle detection rays for a car (left, center, right)
 * Green = no obstacle detected, Red = obstacle detected
 */
function drawObstacleDetectionRays(car, baseColor) {
    if (!car || !car.velocity || car.velocity.mag() < 0.1) return;

    const lookAhead = 40;  // Distance to check for obstacles (reduced for closer detection)
    const heading = car.velocity.heading();

    // Three rays: left (-30°), center (0°), right (+30°)
    const rayAngles = [
        { name: 'left', angle: heading - PI / 6, offset: -1 },   // -30 degrees
        { name: 'center', angle: heading, offset: 0 },            // straight ahead
        { name: 'right', angle: heading + PI / 6, offset: 1 }     // +30 degrees
    ];

    for (let ray of rayAngles) {
        // Calculate ray end point
        const rayEnd = createVector(
            car.position.x + cos(ray.angle) * lookAhead,
            car.position.y + sin(ray.angle) * lookAhead
        );

        // Check if this ray detects any obstacle
        let obstacleDetected = false;
        let closestObsDist = Infinity;
        let closestObsPos = null;

        if (track && track.obstacles) {
            for (let obs of track.obstacles) {
                // Check if ray intersects with obstacle
                const toObs = p5.Vector.sub(obs.position, car.position);
                const rayDir = createVector(cos(ray.angle), sin(ray.angle));

                // Project obstacle onto ray direction
                const projection = p5.Vector.dot(toObs, rayDir);

                // Only check obstacles ahead on this ray
                if (projection > 0 && projection < lookAhead) {
                    // Calculate perpendicular distance from ray to obstacle center
                    const closestPointOnRay = p5.Vector.add(
                        car.position,
                        p5.Vector.mult(rayDir, projection)
                    );
                    const perpDist = p5.Vector.dist(closestPointOnRay, obs.position);

                    // Check if ray passes through obstacle radius
                    if (perpDist < obs.radius + 5) {
                        obstacleDetected = true;
                        if (projection < closestObsDist) {
                            closestObsDist = projection;
                            closestObsPos = obs.position.copy();
                        }
                    }
                }
            }
        }

        // Draw the ray
        strokeWeight(2);
        if (obstacleDetected) {
            // Red ray if obstacle detected
            stroke(255, 50, 50, 200);
            line(car.position.x, car.position.y, rayEnd.x, rayEnd.y);

            // Draw warning circle at obstacle position
            noFill();
            stroke(255, 0, 0, 150);
            strokeWeight(3);
            if (closestObsPos) {
                ellipse(closestObsPos.x, closestObsPos.y, 25, 25);
            }
        } else {
            // Green ray if no obstacle
            stroke(50, 255, 50, 150);
            line(car.position.x, car.position.y, rayEnd.x, rayEnd.y);
        }

        // Draw small indicator at ray end
        noStroke();
        fill(obstacleDetected ? color(255, 50, 50) : color(50, 255, 50));
        ellipse(rayEnd.x, rayEnd.y, 6, 6);
    }

    // Draw car label for identification
    fill(baseColor);
    noStroke();
    textSize(8);
    textAlign(CENTER, CENTER);
    if (car === playerCar) {
        text("P", car.position.x, car.position.y - 20);
    }
}

function keyPressed() {
    if (gameState === 'menu') {
        if (key === ' ') gameState = 'levelSelect';
        if (key === 'r' || key === 'R') levelSelect.resetProgress();
        return;
    }

    if (gameState === 'levelSelect') {
        if (key === ' ' && levelSelect.canStartSelected()) {
            initLevel(levelSelect.getSelectedLevel());
        }
        if (keyCode === ESCAPE) gameState = 'menu';
        return;
    }

    if (gameState === 'playing') {
        if (key === 'd' || key === 'D') debugMode = !debugMode;
        if (key === 'a' || key === 'A') playerCar.autoMode = !playerCar.autoMode;
        if (keyCode === ESCAPE) initLevel(currentLevel);
        if (key === 'm' || key === 'M') gameState = 'levelSelect';
        return;
    }

    if (gameState === 'levelComplete') {
        if (key === ' ') initLevel(currentLevel + 1);
        if (key === 'm' || key === 'M') gameState = 'levelSelect';
        return;
    }

    if (gameState === 'raceLost') {
        if (key === ' ') initLevel(currentLevel);  // Retry same level
        if (key === 'm' || key === 'M') gameState = 'levelSelect';
        return;
    }

    if (gameState === 'gameOver') {
        if (key === ' ') initLevel(1);
        if (key === 'm' || key === 'M') gameState = 'levelSelect';
        return;
    }
}

function mousePressed() {
    if (gameState === 'menu') {
        const bw = 250;
        const bh = 45;

        if (mouseX >= width / 2 - bw / 2 && mouseX <= width / 2 + bw / 2 &&
            mouseY >= height / 2 + 60 - bh / 2 && mouseY <= height / 2 + 60 + bh / 2) {
            gameState = 'levelSelect';
        }

        if (mouseX >= width / 2 - bw / 2 && mouseX <= width / 2 + bw / 2 &&
            mouseY >= height / 2 + 120 - bh / 2 && mouseY <= height / 2 + 120 + bh / 2) {
            levelSelect.resetProgress();
        }
        return;
    }

    if (gameState === 'levelSelect') {
        const clickedLevel = levelSelect.handleClick(mouseX, mouseY);
        if (clickedLevel > 0 && clickedLevel <= levelSelect.unlockedLevel) {
            if (levelSelect.selectedLevel === clickedLevel) {
                initLevel(clickedLevel);
            }
        }
        return;
    }
}
