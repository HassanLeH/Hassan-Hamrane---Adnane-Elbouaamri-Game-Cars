/**
 * LevelSelect.js - Level Selection Menu with Track Thumbnails
 * Shows grid of levels, locked/unlocked status, track previews
 */

class LevelSelect {
    constructor() {
        this.levels = [];
        this.unlockedLevel = 1;  // Start with only level 1 unlocked
        this.selectedLevel = 1;
        this.hoveredLevel = -1;

        // Grid layout
        this.cols = 5;
        this.rows = 2;
        this.cardWidth = 160;
        this.cardHeight = 120;
        this.padding = 20;
        this.startX = 0;
        this.startY = 0;

        // Track preview buffers
        this.trackPreviews = [];

        // Load saved progress
        this.loadProgress();

        // Generate track previews
        this.generatePreviews();

        // Calculate grid position
        this.calculateLayout();
    }

    /**
     * Calculate centered grid layout
     */
    calculateLayout() {
        const totalWidth = this.cols * this.cardWidth + (this.cols - 1) * this.padding;
        const totalHeight = this.rows * this.cardHeight + (this.rows - 1) * this.padding;
        this.startX = (width - totalWidth) / 2;
        this.startY = (height - totalHeight) / 2 + 30;
    }

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('raceGame_unlockedLevel');
            if (saved) {
                this.unlockedLevel = parseInt(saved);
            }
        } catch (e) {
            this.unlockedLevel = 1;
        }
    }

    /**
     * Save progress
     */
    saveProgress() {
        try {
            localStorage.setItem('raceGame_unlockedLevel', this.unlockedLevel.toString());
        } catch (e) {
            // localStorage not available
        }
    }

    /**
     * Unlock next level
     */
    unlockLevel(level) {
        if (level > this.unlockedLevel) {
            this.unlockedLevel = level;
            this.saveProgress();
        }
    }

    /**
     * Generate small track preview images
     */
    generatePreviews() {
        this.trackPreviews = [];

        for (let i = 1; i <= 10; i++) {
            const preview = this.createTrackPreview(i);
            this.trackPreviews.push(preview);
        }
    }

    /**
     * Create a mini track preview for a level
     */
    createTrackPreview(level) {
        const pw = 140;
        const ph = 90;
        const pg = createGraphics(pw, ph);

        // Background
        pg.background(35, 80, 35);

        // Generate mini track path
        const cx = pw / 2;
        const cy = ph / 2;
        const rx = pw * 0.38;
        const ry = ph * 0.38;

        const points = [];
        const numPoints = 40;

        for (let i = 0; i < numPoints; i++) {
            const angle = map(i, 0, numPoints, 0, TWO_PI);
            let radiusX = rx;
            let radiusY = ry;

            // Add complexity based on level
            if (level >= 2 && angle > 0.5 && angle < 1.2) {
                radiusX *= 0.7;
            }
            if (level >= 3 && angle > 2.5 && angle < 3.5) {
                radiusX += sin(angle * 4) * 15;
            }
            if (level >= 4 && angle > 4.0 && angle < 5.0) {
                radiusX *= 0.6;
            }
            if (level >= 5) {
                radiusX += sin(angle * (level - 2)) * 10;
            }

            const x = cx + cos(angle) * radiusX;
            const y = cy + sin(angle) * radiusY;
            points.push({ x, y });
        }

        // Draw track
        pg.stroke(60, 60, 65);
        pg.strokeWeight(max(8, 14 - level));
        pg.noFill();
        pg.beginShape();
        for (let p of points) {
            pg.vertex(p.x, p.y);
        }
        pg.endShape(CLOSE);

        // Draw kerbs (simplified)
        pg.stroke(220, 50, 50);
        pg.strokeWeight(2);
        pg.beginShape();
        for (let p of points) {
            pg.vertex(p.x, p.y);
        }
        pg.endShape(CLOSE);

        // Start line
        if (points.length > 0) {
            pg.stroke(255);
            pg.strokeWeight(3);
            pg.line(points[0].x - 5, points[0].y - 8, points[0].x - 5, points[0].y + 8);
        }

        return pg;
    }

    /**
     * Get level info
     */
    getLevelInfo(level) {
        const names = [
            "Beginner Oval",
            "First Chicane",
            "S-Curve Challenge",
            "Hairpin Hell",
            "Technical Circuit",
            "Speed Demon",
            "Precision Track",
            "Expert Course",
            "Master Circuit",
            "Champion's Ring"
        ];

        const difficulties = [
            "Easy", "Easy", "Medium", "Medium", "Medium",
            "Hard", "Hard", "Hard", "Expert", "Expert"
        ];

        return {
            name: names[level - 1] || `Circuit ${level}`,
            difficulty: difficulties[level - 1] || "Expert",
            aiCount: min(4 + level, 10),
            laps: 2
        };
    }

    /**
     * Draw the level selection screen
     */
    show() {
        // Background with gradient
        for (let y = 0; y < height; y++) {
            const inter = map(y, 0, height, 0, 1);
            stroke(lerpColor(color(30, 35, 60), color(20, 25, 45), inter));
            line(0, y, width, y);
        }

        // Checkered pattern corners
        this.drawCheckeredCorners();

        // Title
        fill(255, 200, 50);
        textAlign(CENTER, TOP);
        textSize(42);
        textStyle(BOLD);
        text("SELECT TRACK", width / 2, 25);

        textStyle(NORMAL);
        fill(180, 180, 180);
        textSize(14);
        text("Complete a race to unlock the next track", width / 2, 75);

        // Draw level cards
        for (let i = 0; i < 10; i++) {
            const level = i + 1;
            const col = i % this.cols;
            const row = floor(i / this.cols);

            const x = this.startX + col * (this.cardWidth + this.padding);
            const y = this.startY + row * (this.cardHeight + this.padding);

            this.drawLevelCard(x, y, level);
        }

        // Instructions
        fill(150, 150, 150);
        textAlign(CENTER, BOTTOM);
        textSize(14);
        text("Click to select  •  SPACE to start  •  ESC to go back", width / 2, height - 20);

        // Selected level info panel
        this.drawInfoPanel();
    }

    /**
     * Draw decorative checkered corners
     */
    drawCheckeredCorners() {
        const size = 15;
        const count = 4;

        noStroke();
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                fill((i + j) % 2 === 0 ? color(60, 60, 60) : color(40, 40, 40));
                rect(i * size, j * size, size, size);
                rect(width - (i + 1) * size, j * size, size, size);
                rect(i * size, height - (j + 1) * size, size, size);
                rect(width - (i + 1) * size, height - (j + 1) * size, size, size);
            }
        }
    }

    /**
     * Draw a single level card
     */
    drawLevelCard(x, y, level) {
        const isUnlocked = level <= this.unlockedLevel;
        const isSelected = level === this.selectedLevel;
        const isHovered = level === this.hoveredLevel;

        push();
        translate(x, y);

        // Card shadow
        noStroke();
        fill(0, 0, 0, 80);
        rect(4, 4, this.cardWidth, this.cardHeight, 8);

        // Card background
        if (isSelected) {
            fill(80, 120, 180);
            stroke(255, 200, 50);
            strokeWeight(3);
        } else if (isHovered && isUnlocked) {
            fill(60, 80, 120);
            stroke(150, 150, 150);
            strokeWeight(2);
        } else {
            fill(50, 55, 70);
            stroke(70, 75, 90);
            strokeWeight(1);
        }
        rect(0, 0, this.cardWidth, this.cardHeight, 8);

        // Track preview
        if (this.trackPreviews[level - 1]) {
            image(this.trackPreviews[level - 1], 10, 8);
        }

        // Level number badge
        fill(isUnlocked ? color(255, 200, 50) : color(100, 100, 100));
        noStroke();
        ellipse(this.cardWidth - 18, 18, 28, 28);

        fill(isUnlocked ? 0 : 60);
        textAlign(CENTER, CENTER);
        textSize(14);
        textStyle(BOLD);
        text(level, this.cardWidth - 18, 17);

        // Level name
        fill(isUnlocked ? 255 : 120);
        textAlign(LEFT, BOTTOM);
        textSize(11);
        textStyle(NORMAL);
        const info = this.getLevelInfo(level);
        text(info.name, 8, this.cardHeight - 5);

        // Locked overlay
        if (!isUnlocked) {
            fill(0, 0, 0, 150);
            noStroke();
            rect(0, 0, this.cardWidth, this.cardHeight, 8);

            // Lock icon
            fill(180, 180, 180);
            textAlign(CENTER, CENTER);
            textSize(30);
            text("🔒", this.cardWidth / 2, this.cardHeight / 2);
        }

        pop();
    }

    /**
     * Draw info panel for selected level
     */
    drawInfoPanel() {
        const info = this.getLevelInfo(this.selectedLevel);
        const isUnlocked = this.selectedLevel <= this.unlockedLevel;

        // Panel on right side
        const px = width - 180;
        const py = this.startY;
        const pw = 160;
        const ph = 200;

        fill(40, 45, 60, 230);
        stroke(80, 85, 100);
        strokeWeight(2);
        rect(px, py, pw, ph, 10);

        fill(255, 200, 50);
        textAlign(CENTER, TOP);
        textSize(16);
        textStyle(BOLD);
        text(`Level ${this.selectedLevel}`, px + pw / 2, py + 12);

        textStyle(NORMAL);
        fill(255);
        textAlign(LEFT, TOP);
        textSize(12);

        let yOffset = py + 45;

        fill(200, 200, 200);
        text("Track:", px + 12, yOffset);
        fill(255);
        text(info.name, px + 12, yOffset + 15);

        yOffset += 40;
        fill(200, 200, 200);
        text("Difficulty:", px + 12, yOffset);

        // Difficulty color
        if (info.difficulty === "Easy") fill(100, 255, 100);
        else if (info.difficulty === "Medium") fill(255, 200, 50);
        else if (info.difficulty === "Hard") fill(255, 100, 50);
        else fill(255, 50, 50);
        text(info.difficulty, px + 12, yOffset + 15);

        yOffset += 40;
        fill(200, 200, 200);
        text("Opponents:", px + 12, yOffset);
        fill(255);
        text(`${info.aiCount} cars`, px + 12, yOffset + 15);

        yOffset += 40;
        fill(200, 200, 200);
        text("Laps:", px + 12, yOffset);
        fill(255);
        text(`${info.laps}`, px + 12, yOffset + 15);

        // Start button / locked message
        if (isUnlocked) {
            fill(50, 180, 80);
            noStroke();
            rect(px + 20, py + ph - 40, pw - 40, 30, 5);

            fill(255);
            textAlign(CENTER, CENTER);
            textSize(14);
            text("SPACE to Start", px + pw / 2, py + ph - 25);
        } else {
            fill(150, 150, 150);
            textAlign(CENTER, CENTER);
            textSize(11);
            text(`Complete Level ${this.selectedLevel - 1}`, px + pw / 2, py + ph - 25);
            text("to unlock", px + pw / 2, py + ph - 10);
        }
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(mx, my) {
        this.hoveredLevel = -1;

        for (let i = 0; i < 10; i++) {
            const col = i % this.cols;
            const row = floor(i / this.cols);
            const x = this.startX + col * (this.cardWidth + this.padding);
            const y = this.startY + row * (this.cardHeight + this.padding);

            if (mx >= x && mx <= x + this.cardWidth &&
                my >= y && my <= y + this.cardHeight) {
                this.hoveredLevel = i + 1;
                break;
            }
        }
    }

    /**
     * Handle mouse click - returns selected level if valid, -1 otherwise
     */
    handleClick(mx, my) {
        for (let i = 0; i < 10; i++) {
            const col = i % this.cols;
            const row = floor(i / this.cols);
            const x = this.startX + col * (this.cardWidth + this.padding);
            const y = this.startY + row * (this.cardHeight + this.padding);

            if (mx >= x && mx <= x + this.cardWidth &&
                my >= y && my <= y + this.cardHeight) {
                const level = i + 1;
                this.selectedLevel = level;
                return level;
            }
        }
        return -1;
    }

    /**
     * Check if selected level can be started
     */
    canStartSelected() {
        return this.selectedLevel <= this.unlockedLevel;
    }

    /**
     * Get selected level
     */
    getSelectedLevel() {
        return this.selectedLevel;
    }

    /**
     * Reset progress (for testing)
     */
    resetProgress() {
        this.unlockedLevel = 1;
        this.saveProgress();
    }
}
