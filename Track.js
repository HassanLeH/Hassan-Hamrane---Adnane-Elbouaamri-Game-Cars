/**
 * Track.js - Premium Racing Track with Obstacles
 * Features: Wider tracks, cones, barriers, oil slicks
 */

class Track {
    constructor(level = 1) {
        this.level = level;
        this.waypoints = [];
        this.trackWidth = this.getTrackWidth();
        this.kerbWidth = 12;
        this.innerEdge = [];
        this.outerEdge = [];

        // Obstacle system
        this.obstacles = [];

        // Pre-rendered graphics buffer for performance
        this.trackBuffer = null;
        this.needsRedraw = true;

        this.generateCircuit();
        this.generateObstacles();
    }

    /**
     * Track width - wider tracks that get narrower with level
     */
    getTrackWidth() {
        // Base: 160px, minimum: 100px
        return max(100, 160 - this.level * 6);
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

    /**
     * Generate obstacles based on level difficulty
     * Types: cone, barrier, oil
     */
    generateObstacles() {
        this.obstacles = [];

        if (this.waypoints.length < 10) return;

        const totalWaypoints = this.waypoints.length;

        // Number of obstacles increases with level
        const numCones = min(this.level + 2, 12);
        const numBarriers = this.level >= 4 ? min(this.level - 2, 6) : 0;
        const numOilSlicks = this.level >= 7 ? min(this.level - 5, 4) : 0;

        // Generate cones (on track edges)
        for (let i = 0; i < numCones; i++) {
            const waypointIdx = floor(random(5, totalWaypoints - 5));
            const wp = this.waypoints[waypointIdx];

            // Get perpendicular direction
            const next = this.waypoints[(waypointIdx + 1) % totalWaypoints];
            const prev = this.waypoints[(waypointIdx - 1 + totalWaypoints) % totalWaypoints];
            const forward = p5.Vector.sub(next, prev);
            forward.normalize();
            const perp = createVector(-forward.y, forward.x);

            // Place cone on left or right side
            const side = random() > 0.5 ? 1 : -1;
            const offset = (this.trackWidth / 2 - 20) * side;
            const position = p5.Vector.add(wp, p5.Vector.mult(perp, offset));

            this.obstacles.push({
                type: 'cone',
                position: position,
                radius: 12,
                waypointIndex: waypointIdx,
                color: color(255, 140, 0)  // Orange
            });
        }

        // Generate barriers (on track, require avoidance)
        for (let i = 0; i < numBarriers; i++) {
            const waypointIdx = floor(random(10, totalWaypoints - 10));
            const wp = this.waypoints[waypointIdx];

            const next = this.waypoints[(waypointIdx + 1) % totalWaypoints];
            const prev = this.waypoints[(waypointIdx - 1 + totalWaypoints) % totalWaypoints];
            const forward = p5.Vector.sub(next, prev);
            forward.normalize();
            const perp = createVector(-forward.y, forward.x);

            // Barrier slightly off-center
            const offset = random(-this.trackWidth / 4, this.trackWidth / 4);
            const position = p5.Vector.add(wp, p5.Vector.mult(perp, offset));

            this.obstacles.push({
                type: 'barrier',
                position: position,
                radius: 25,
                width: 40,
                height: 15,
                angle: forward.heading(),
                waypointIndex: waypointIdx,
                color: color(200, 50, 50)  // Red
            });
        }

        // Generate oil slicks (cause sliding)
        for (let i = 0; i < numOilSlicks; i++) {
            const waypointIdx = floor(random(15, totalWaypoints - 15));
            const wp = this.waypoints[waypointIdx];

            const next = this.waypoints[(waypointIdx + 1) % totalWaypoints];
            const prev = this.waypoints[(waypointIdx - 1 + totalWaypoints) % totalWaypoints];
            const forward = p5.Vector.sub(next, prev);
            forward.normalize();
            const perp = createVector(-forward.y, forward.x);

            const offset = random(-this.trackWidth / 3, this.trackWidth / 3);
            const position = p5.Vector.add(wp, p5.Vector.mult(perp, offset));

            this.obstacles.push({
                type: 'oil',
                position: position,
                radius: 30,
                waypointIndex: waypointIdx,
                color: color(30, 30, 40, 180)  // Dark oil
            });
        }
    }

    /**
     * Check if position collides with any obstacle
     * Returns: { hit: boolean, type: string, obstacle: object }
     */
    checkObstacleCollision(position) {
        for (let obs of this.obstacles) {
            const dist = p5.Vector.dist(position, obs.position);
            if (dist < obs.radius) {
                return { hit: true, type: obs.type, obstacle: obs };
            }
        }
        return { hit: false, type: null, obstacle: null };
    }

    /**
     * Get avoidance force for AI
     */
    getObstacleAvoidanceForce(position, velocity, lookAhead = 60) {
        let avoidForce = createVector(0, 0);

        for (let obs of this.obstacles) {
            const toObs = p5.Vector.sub(obs.position, position);
            const dist = toObs.mag();

            // Only consider obstacles ahead and within range
            if (dist < lookAhead + obs.radius) {
                const dotProduct = p5.Vector.dot(velocity.copy().normalize(), toObs.copy().normalize());

                // Obstacle is ahead
                if (dotProduct > 0.3) {
                    // Steer away from obstacle
                    const perpForce = createVector(-toObs.y, toObs.x);
                    perpForce.normalize();
                    perpForce.mult(map(dist, 0, lookAhead, 1.5, 0.3));
                    avoidForce.add(perpForce);
                }
            }
        }

        return avoidForce;
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

        // === OBSTACLES ===
        this.drawObstaclesToBuffer(g);

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
     * Draw obstacles to buffer
     */
    drawObstaclesToBuffer(g) {
        for (let obs of this.obstacles) {
            g.push();
            g.translate(obs.position.x, obs.position.y);

            if (obs.type === 'cone') {
                // Orange cone with white stripe
                g.noStroke();
                g.fill(255, 140, 0);
                g.beginShape();
                g.vertex(0, -12);
                g.vertex(-8, 8);
                g.vertex(8, 8);
                g.endShape(CLOSE);
                // White stripe
                g.fill(255);
                g.rect(-5, 0, 10, 3);
                // Base
                g.fill(40);
                g.rect(-10, 6, 20, 4);
            }
            else if (obs.type === 'barrier') {
                // Red/white barrier block
                g.rotate(obs.angle);
                g.noStroke();
                // Shadow
                g.fill(0, 0, 0, 80);
                g.rect(-obs.width / 2 + 2, -obs.height / 2 + 2, obs.width, obs.height, 3);
                // Red stripes
                for (let i = 0; i < 4; i++) {
                    g.fill(i % 2 === 0 ? color(220, 50, 50) : color(255, 255, 255));
                    g.rect(-obs.width / 2 + i * 10, -obs.height / 2, 10, obs.height);
                }
                g.stroke(100);
                g.strokeWeight(1);
                g.noFill();
                g.rect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 3);
            }
            else if (obs.type === 'oil') {
                // Dark oil slick with iridescent effect
                g.noStroke();
                // Main oil puddle
                g.fill(25, 25, 35, 180);
                g.ellipse(0, 0, obs.radius * 2, obs.radius * 1.5);
                // Rainbow sheen
                g.fill(80, 60, 120, 60);
                g.ellipse(-5, -3, obs.radius * 1.2, obs.radius * 0.8);
                g.fill(60, 100, 80, 50);
                g.ellipse(8, 5, obs.radius * 0.8, obs.radius * 0.6);
            }

            g.pop();
        }
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
