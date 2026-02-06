/**
 * Track.js - Premium Racing Track with Pre-rendered Graphics
 * Optimized: Uses offscreen buffer to eliminate lag
 * Style: Inspired by top-down racing games
 */

class Track {
    constructor(level = 1) {
        this.level = level;
        this.waypoints = [];
        this.trackWidth = this.getTrackWidth();
        this.kerbWidth = 10;
        this.innerEdge = [];
        this.outerEdge = [];

        // Pre-rendered graphics buffer for performance
        this.trackBuffer = null;
        this.needsRedraw = true;

        this.generateCircuit();
    }

    getTrackWidth() {
        return max(70, 110 - this.level * 8);
    }

    /**
     * Generate smooth circuit using bezier-like interpolation
     */
    generateCircuit() {
        const centerX = width / 2;
        const centerY = height / 2;
        const numPoints = 80;

        const baseRadiusX = width * 0.40;
        const baseRadiusY = height * 0.40;

        // Generate control points based on level
        const controlPoints = this.getControlPoints(this.level);

        for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const angle = t * TWO_PI;

            let rx = baseRadiusX;
            let ry = baseRadiusY;

            // Apply level-based deformations
            for (let cp of controlPoints) {
                const influence = this.smoothInfluence(angle, cp.angle, cp.spread);
                rx += cp.dx * influence;
                ry += cp.dy * influence;
            }

            const x = centerX + cos(angle) * rx;
            const y = centerY + sin(angle) * ry;

            this.waypoints.push(createVector(x, y));
        }

        this.calculateEdges();
        this.needsRedraw = true;
    }

    /**
     * Get control points for track shape based on level
     */
    getControlPoints(level) {
        const points = [];

        if (level >= 1) {
            // Basic oval variations
            points.push({ angle: 0, dx: 25, dy: 0, spread: 0.6 });
            points.push({ angle: PI, dx: -25, dy: 0, spread: 0.6 });
        }

        if (level >= 2) {
            // Add chicane
            points.push({ angle: 0.8, dx: -60, dy: -30, spread: 0.35 });
        }

        if (level >= 3) {
            // Add S-curve
            points.push({ angle: 2.5, dx: 40, dy: 50, spread: 0.4 });
            points.push({ angle: 3.2, dx: -40, dy: -40, spread: 0.35 });
        }

        if (level >= 4) {
            // Hairpin
            points.push({ angle: 4.5, dx: -70, dy: 20, spread: 0.25 });
        }

        if (level >= 5) {
            // More gentle curves for level 5
            points.push({ angle: 5.5, dx: 40, dy: -35, spread: 0.3 });
            points.push({ angle: 1.5, dx: -30, dy: 30, spread: 0.25 });
        }

        if (level >= 6) {
            // Extra chicane
            points.push({ angle: 3.8, dx: 50, dy: -30, spread: 0.25 });
        }

        if (level >= 7) {
            // Double apex
            points.push({ angle: 0.3, dx: -40, dy: 20, spread: 0.2 });
        }

        if (level >= 8) {
            // Technical section
            points.push({ angle: 5.0, dx: -35, dy: -25, spread: 0.2 });
        }

        if (level >= 9) {
            // Extra corner
            points.push({ angle: 1.0, dx: 30, dy: 35, spread: 0.2 });
        }

        if (level >= 10) {
            // Final challenge
            points.push({ angle: 4.0, dx: 25, dy: -20, spread: 0.18 });
            points.push({ angle: 2.0, dx: -25, dy: 20, spread: 0.18 });
        }

        return points;
    }

    smoothInfluence(angle, targetAngle, spread) {
        let diff = abs(angle - targetAngle);
        if (diff > PI) diff = TWO_PI - diff;
        if (diff > spread * PI) return 0;
        return cos((diff / (spread * PI)) * HALF_PI);
    }

    calculateEdges() {
        this.innerEdge = [];
        this.outerEdge = [];

        for (let i = 0; i < this.waypoints.length; i++) {
            const current = this.waypoints[i];
            const next = this.waypoints[(i + 1) % this.waypoints.length];
            const prev = this.waypoints[(i - 1 + this.waypoints.length) % this.waypoints.length];

            const forward = p5.Vector.sub(next, prev);
            forward.normalize();
            const perp = createVector(-forward.y, forward.x);

            const halfWidth = this.trackWidth / 2;
            this.innerEdge.push(p5.Vector.add(current, p5.Vector.mult(perp, halfWidth)));
            this.outerEdge.push(p5.Vector.sub(current, p5.Vector.mult(perp, halfWidth)));
        }
    }

    getClosestWaypointIndex(pos) {
        let closestDist = Infinity;
        let closestIndex = 0;

        for (let i = 0; i < this.waypoints.length; i++) {
            const d = p5.Vector.dist(pos, this.waypoints[i]);
            if (d < closestDist) {
                closestDist = d;
                closestIndex = i;
            }
        }
        return closestIndex;
    }

    getTrackBoundaryForce(position, velocity) {
        const closestIdx = this.getClosestWaypointIndex(position);
        const trackCenter = this.waypoints[closestIdx];
        const distFromCenter = p5.Vector.dist(position, trackCenter);
        const maxDist = this.trackWidth / 2 - 15;

        if (distFromCenter > maxDist) {
            let steer = p5.Vector.sub(trackCenter, position);
            steer.normalize();
            steer.mult(map(distFromCenter - maxDist, 0, 25, 0.3, 1.0));
            return steer;
        }
        return createVector(0, 0);
    }

    /**
     * Pre-render track to buffer for performance
     */
    prerenderTrack() {
        this.trackBuffer = createGraphics(width, height);
        const g = this.trackBuffer;

        // === GRASS BACKGROUND ===
        // Solid color gradient (much faster than per-line)
        g.background(35, 90, 35);

        // Simple grass pattern (optimized)
        g.noStroke();
        for (let i = 0; i < 150; i++) {
            g.fill(30 + random(20), 70 + random(40), 30 + random(20), 120);
            g.ellipse(random(width), random(height), random(8, 20), random(8, 20));
        }

        // === TRACK SHADOW ===
        g.stroke(0, 0, 0, 60);
        g.strokeWeight(this.trackWidth + 20);
        g.noFill();
        g.beginShape();
        for (let p of this.waypoints) {
            g.vertex(p.x + 4, p.y + 4);
        }
        g.endShape(CLOSE);

        // === OUTER KERB ===
        this.drawKerbToBuffer(g, this.outerEdge, 12);

        // === INNER KERB ===
        this.drawKerbToBuffer(g, this.innerEdge, 12);

        // === ASPHALT ===
        g.fill(50, 52, 55);
        g.noStroke();
        g.beginShape();
        for (let p of this.outerEdge) g.vertex(p.x, p.y);
        g.beginContour();
        for (let i = this.innerEdge.length - 1; i >= 0; i--) {
            g.vertex(this.innerEdge[i].x, this.innerEdge[i].y);
        }
        g.endContour();
        g.endShape(CLOSE);

        // Asphalt texture (minimal for performance)
        g.noStroke();
        for (let i = 0; i < 200; i++) {
            const idx = floor(random(this.waypoints.length));
            const wp = this.waypoints[idx];
            const ox = random(-this.trackWidth / 2 + 10, this.trackWidth / 2 - 10);
            const oy = random(-this.trackWidth / 2 + 10, this.trackWidth / 2 - 10);
            g.fill(45 + random(15), 47 + random(15), 50 + random(15));
            g.ellipse(wp.x + ox, wp.y + oy, random(2, 4), random(2, 4));
        }

        // === RACING LINE (dashed white) ===
        g.stroke(255, 255, 220, 180);
        g.strokeWeight(3);
        let dist = 0;
        for (let i = 0; i < this.waypoints.length; i++) {
            const curr = this.waypoints[i];
            const next = this.waypoints[(i + 1) % this.waypoints.length];
            if (floor(dist / 25) % 2 === 0) {
                g.line(curr.x, curr.y, next.x, next.y);
            }
            dist += p5.Vector.dist(curr, next);
        }

        // === START/FINISH ===
        this.drawStartFinishToBuffer(g);

        // === LEVEL BADGE ===
        g.fill(0, 0, 0, 180);
        g.noStroke();
        g.ellipse(width / 2, height / 2, 70, 70);
        g.fill(255);
        g.textAlign(CENTER, CENTER);
        g.textSize(14);
        g.text("LEVEL", width / 2, height / 2 - 12);
        g.textSize(28);
        g.textStyle(BOLD);
        g.text(this.level, width / 2, height / 2 + 10);
        g.textStyle(NORMAL);

        this.needsRedraw = false;
    }

    /**
     * Draw kerb pattern to buffer
     */
    drawKerbToBuffer(g, edgePoints, kerbWidth) {
        g.strokeWeight(kerbWidth);
        let dist = 0;
        const segLen = 20;

        for (let i = 0; i < edgePoints.length; i++) {
            const curr = edgePoints[i];
            const next = edgePoints[(i + 1) % edgePoints.length];

            const segIdx = floor(dist / segLen);
            g.stroke(segIdx % 2 === 0 ? color(220, 45, 45) : color(255, 255, 255));
            g.line(curr.x, curr.y, next.x, next.y);

            dist += p5.Vector.dist(curr, next);
        }
    }

    /**
     * Draw checkered start line
     */
    drawStartFinishToBuffer(g) {
        if (this.waypoints.length < 2) return;

        const start = this.waypoints[0];
        const next = this.waypoints[1];
        const dir = p5.Vector.sub(next, start);
        dir.normalize();
        const perp = createVector(-dir.y, dir.x);

        const hw = this.trackWidth / 2 - 5;
        const numSq = 10;
        const sqSize = (this.trackWidth - 10) / numSq;

        g.push();
        g.translate(start.x, start.y);
        g.rotate(perp.heading());
        g.noStroke();

        for (let row = 0; row < 2; row++) {
            for (let i = 0; i < numSq; i++) {
                g.fill((i + row) % 2 === 0 ? 255 : 20);
                g.rect(-hw + i * sqSize, -sqSize + row * sqSize, sqSize, sqSize);
            }
        }
        g.pop();
    }

    /**
     * Show track - uses pre-rendered buffer
     */
    show() {
        if (this.needsRedraw || !this.trackBuffer) {
            this.prerenderTrack();
        }
        image(this.trackBuffer, 0, 0);
    }

    /**
     * Debug overlay
     */
    showDebug() {
        // Waypoints
        fill(255, 255, 0);
        noStroke();
        for (let i = 0; i < this.waypoints.length; i += 4) {
            const wp = this.waypoints[i];
            ellipse(wp.x, wp.y, 5, 5);
        }

        // Track center line
        stroke(0, 255, 255, 100);
        strokeWeight(1);
        noFill();
        beginShape();
        for (let wp of this.waypoints) {
            vertex(wp.x, wp.y);
        }
        endShape(CLOSE);
    }
}
