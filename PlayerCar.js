/**
 * PlayerCar.js - Player-controlled racing car with NITRO!
 * Features: Nitro boost, visual effects, premium visuals
 */

class PlayerCar extends Vehicule {
    constructor(x, y, track) {
        super(x, y);

        this.track = track;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = 65;  // Increased for wider tracks

        this.maxspeed = 6;
        this.nitroMaxspeed = 10;  // Speed when using nitro
        this.maxforce = 0.35;
        this.r = 12;

        this.acceleration_power = 0.18;
        this.brake_power = 0.12;
        this.turn_speed = 0.065;
        this.friction = 0.97;
        this.drift_factor = 0.90;

        this.angle = 0;
        this.laps = 0;
        this.checkpointsReached = 0;
        this.lastCheckpoint = 0;
        this.finished = false;

        // Autopilot mode
        this.autoMode = false;

        // Nitro system
        this.nitroFuel = 100;           // Current nitro fuel (0-100)
        this.nitroMaxFuel = 100;        // Maximum nitro fuel
        this.nitroActive = false;       // Is nitro currently active?
        this.nitroDrainRate = 1.5;      // Fuel consumed per frame when active
        this.nitroRechargeRate = 0.3;   // Fuel regained per frame when not active
        this.nitroBoostPower = 0.35;    // Extra acceleration during nitro
        this.nitroParticles = [];       // Visual effect particles

        this.chassisWidth = 30;
        this.chassisHeight = 15;

        // Obstacle effects
        this.onOil = false;              // Currently on oil slick
        this.oilTimer = 0;               // Duration of oil effect
        this.slowdownTimer = 0;          // Duration of cone slowdown

        if (track && track.waypoints.length > 1) {
            const dir = p5.Vector.sub(track.waypoints[1], track.waypoints[0]);
            this.angle = dir.heading();
        }
    }

    handleInput() {
        if (this.finished) return;

        // Normal acceleration
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
            const force = p5.Vector.fromAngle(this.angle);
            force.mult(this.acceleration_power);
            this.velocity.add(force);
        }

        // Braking
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
            const force = p5.Vector.fromAngle(this.angle);
            force.mult(-this.brake_power);
            this.velocity.add(force);
        }

        // Steering
        const speed = this.velocity.mag();
        if (speed > 0.5) {
            if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
                this.angle -= this.turn_speed * min(speed / 3, 1);
            }
            if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
                this.angle += this.turn_speed * min(speed / 3, 1);
            }
        }

        // NITRO (SHIFT or N key)
        this.nitroActive = (keyIsDown(SHIFT) || keyIsDown(78)) && this.nitroFuel > 0;
    }

    /**
     * Autopilot mode - car drives itself following the track
     */
    handleAutoPilot() {
        if (!this.track || this.track.waypoints.length === 0) return;

        // Get next waypoint to target
        const expectedNext = (this.lastCheckpoint + 1) % this.track.waypoints.length;
        const target = this.track.waypoints[expectedNext];

        // Calculate steering towards waypoint
        const desired = p5.Vector.sub(target, this.position);
        const distance = desired.mag();
        desired.normalize();

        // Arrival behavior - slow down when close
        let speed = this.maxspeed;
        if (distance < 100) {
            speed = map(distance, 0, 100, 2, this.maxspeed);
        }
        desired.mult(speed);

        // Calculate steering force
        const steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);

        // Apply steering
        this.velocity.add(steer);

        // Update angle based on velocity
        if (this.velocity.mag() > 0.5) {
            this.angle = this.velocity.heading();
        }

        // Obstacle avoidance
        if (this.track.getObstacleAvoidanceForce) {
            const obstacleForce = this.track.getObstacleAvoidanceForce(this.position, this.velocity, 60);
            obstacleForce.mult(2.0);
            this.velocity.add(obstacleForce);
        }

        // Boundary avoidance
        const boundaryForce = this.track.getTrackBoundaryForce(this.position, this.velocity);
        boundaryForce.mult(1.5);
        this.velocity.add(boundaryForce);

        // Auto nitro when straight line and going fast
        if (this.velocity.mag() > 4 && this.nitroFuel > 30) {
            this.nitroActive = true;
        } else {
            this.nitroActive = false;
        }
    }

    updateNitro() {
        if (this.nitroActive && this.nitroFuel > 0) {
            // Apply nitro boost
            const boost = p5.Vector.fromAngle(this.angle);
            boost.mult(this.nitroBoostPower);
            this.velocity.add(boost);

            // Drain fuel
            this.nitroFuel -= this.nitroDrainRate;
            this.nitroFuel = max(0, this.nitroFuel);

            // Create exhaust particles
            this.createNitroParticles();
        } else {
            // Recharge nitro when not using
            this.nitroFuel += this.nitroRechargeRate;
            this.nitroFuel = min(this.nitroMaxFuel, this.nitroFuel);
        }

        // Update particles
        this.updateNitroParticles();
    }

    createNitroParticles() {
        // Create 2-3 particles per frame when nitro is active
        for (let i = 0; i < 3; i++) {
            const backOffset = p5.Vector.fromAngle(this.angle + PI);
            backOffset.mult(this.chassisWidth / 2 + 5);

            const particle = {
                x: this.position.x + backOffset.x + random(-5, 5),
                y: this.position.y + backOffset.y + random(-5, 5),
                vx: backOffset.x * 0.3 + random(-1, 1),
                vy: backOffset.y * 0.3 + random(-1, 1),
                life: 1.0,
                size: random(8, 15),
                color: random() > 0.5 ? 'blue' : 'cyan'
            };
            this.nitroParticles.push(particle);
        }
    }

    updateNitroParticles() {
        for (let i = this.nitroParticles.length - 1; i >= 0; i--) {
            const p = this.nitroParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.08;
            p.size *= 0.92;

            if (p.life <= 0 || p.size < 1) {
                this.nitroParticles.splice(i, 1);
            }
        }
    }

    drawNitroParticles() {
        noStroke();
        for (let p of this.nitroParticles) {
            const alpha = p.life * 200;

            if (p.color === 'blue') {
                fill(50, 150, 255, alpha);
            } else {
                fill(100, 255, 255, alpha);
            }
            ellipse(p.x, p.y, p.size, p.size);

            // Inner glow
            if (p.color === 'blue') {
                fill(150, 200, 255, alpha * 0.8);
            } else {
                fill(200, 255, 255, alpha * 0.8);
            }
            ellipse(p.x, p.y, p.size * 0.5, p.size * 0.5);
        }
    }

    update() {
        if (this.finished) return;

        // Use autopilot or manual control
        if (this.autoMode) {
            this.handleAutoPilot();
        } else {
            this.handleInput();
        }
        this.updateNitro();

        this.velocity.mult(this.friction);

        const facingDir = p5.Vector.fromAngle(this.angle);
        const forwardSpeed = this.velocity.dot(facingDir);
        const forwardVel = p5.Vector.mult(facingDir, forwardSpeed);
        this.velocity.lerp(forwardVel, 1 - this.drift_factor);

        // Limit speed (higher when nitro active)
        const currentMaxSpeed = this.nitroActive ? this.nitroMaxspeed : this.maxspeed;
        this.velocity.limit(currentMaxSpeed);

        this.position.add(this.velocity);

        this.handleBoundary();
        this.handleObstacles();
        this.checkWaypoints();
        this.edges();
    }

    /**
     * Handle collision with obstacles
     */
    handleObstacles() {
        if (!this.track) return;

        const collision = this.track.checkObstacleCollision(this.position);

        if (collision.hit) {
            switch (collision.type) {
                case 'cone':
                    // Cone: slow down and slight bounce
                    this.velocity.mult(0.7);
                    this.slowdownTimer = 30;
                    break;

                case 'barrier':
                    // Barrier: strong bounce back
                    const bounceDir = p5.Vector.sub(this.position, collision.obstacle.position);
                    bounceDir.normalize();
                    bounceDir.mult(3);
                    this.velocity.add(bounceDir);
                    this.velocity.mult(0.5);
                    break;

                case 'oil':
                    // Oil: reduce grip (sliding effect)
                    this.onOil = true;
                    this.oilTimer = 60;
                    break;
            }
        }

        // Apply oil sliding effect
        if (this.oilTimer > 0) {
            this.oilTimer--;
            this.drift_factor = 0.98;  // More sliding
            if (this.oilTimer <= 0) {
                this.drift_factor = 0.90;  // Reset to normal
                this.onOil = false;
            }
        }

        // Apply cone slowdown
        if (this.slowdownTimer > 0) {
            this.slowdownTimer--;
            this.velocity.mult(0.98);
        }
    }

    handleBoundary() {
        if (!this.track) return;
        const boundaryForce = this.track.getTrackBoundaryForce(this.position, this.velocity);
        if (boundaryForce.mag() > 0) {
            this.velocity.mult(0.85);
            boundaryForce.mult(2);
            this.velocity.add(boundaryForce);
        }
    }

    checkWaypoints() {
        if (!this.track) return;

        const expectedNext = (this.lastCheckpoint + 1) % this.track.waypoints.length;
        const dist = p5.Vector.dist(this.position, this.track.waypoints[expectedNext]);

        if (dist < this.waypointReachDistance) {
            this.lastCheckpoint = expectedNext;
            this.checkpointsReached++;

            // Lap completion: reached waypoint 0 after going through most of the track
            if (expectedNext === 0 && this.checkpointsReached >= this.track.waypoints.length * 0.8) {
                this.laps++;
                this.checkpointsReached = 0;
            }
        }
    }

    getLapProgress() {
        if (!this.track) return 0;
        return (this.lastCheckpoint / this.track.waypoints.length) * 100;
    }

    getNitroPercent() {
        return (this.nitroFuel / this.nitroMaxFuel) * 100;
    }

    show() {
        // Draw nitro particles BEFORE the car (behind it)
        this.drawNitroParticles();

        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle);

        // Draw exhaust flames when nitro active
        if (this.nitroActive && this.nitroFuel > 0) {
            this.drawNitroFlames();
        }

        // Shadow
        noStroke();
        fill(0, 0, 0, 80);
        rectMode(CENTER);
        rect(4, 4, this.chassisWidth, this.chassisHeight, 4);

        // Wheels
        this.drawWheels();

        // Body - Gold/Yellow F1 style (glows when nitro active)
        if (this.nitroActive) {
            // Glowing effect
            fill(100, 200, 255, 50);
            noStroke();
            ellipse(0, 0, this.chassisWidth + 20, this.chassisHeight + 20);
        }

        // Main chassis
        if (this.nitroActive) {
            fill(100, 220, 255);  // Blue tint when nitro
            stroke(50, 150, 200);
        } else {
            fill(255, 200, 40);
            stroke(200, 150, 20);
        }
        strokeWeight(2);
        rect(0, 0, this.chassisWidth, this.chassisHeight, 4);

        // Cockpit area
        fill(30, 30, 30);
        noStroke();
        rect(2, 0, 8, 7, 2);

        // Racing stripes
        fill(20, 20, 20);
        rect(0, -5, this.chassisWidth - 8, 2);
        rect(0, 5, this.chassisWidth - 8, 2);

        // Front wing
        fill(this.nitroActive ? color(50, 180, 255) : color(255, 180, 30));
        stroke(this.nitroActive ? color(30, 120, 180) : color(200, 140, 20));
        strokeWeight(1);
        rect(this.chassisWidth / 2 - 2, 0, 6, this.chassisHeight + 6, 1);

        // Rear wing
        fill(30, 30, 30);
        rect(-this.chassisWidth / 2 + 1, 0, 5, this.chassisHeight + 4, 1);

        // Helmet
        fill(255, 50, 50);
        noStroke();
        ellipse(0, 0, 6, 6);

        // Front lights
        fill(255, 255, 200);
        ellipse(this.chassisWidth / 2 - 3, -4, 3, 3);
        ellipse(this.chassisWidth / 2 - 3, 4, 3, 3);

        // Tail lights (brighter when nitro)
        fill(this.nitroActive ? color(100, 200, 255) : color(255, 50, 50));
        rect(-this.chassisWidth / 2 + 3, -4, 3, 2, 1);
        rect(-this.chassisWidth / 2 + 3, 4, 3, 2, 1);

        pop();
    }

    drawNitroFlames() {
        // Draw flame effect behind the car
        noStroke();
        const flameLength = 15 + random(10);

        // Outer flame (blue)
        fill(50, 150, 255, 200);
        beginShape();
        vertex(-this.chassisWidth / 2 - 2, -5);
        vertex(-this.chassisWidth / 2 - flameLength, 0);
        vertex(-this.chassisWidth / 2 - 2, 5);
        endShape(CLOSE);

        // Middle flame (cyan)
        fill(100, 220, 255, 220);
        beginShape();
        vertex(-this.chassisWidth / 2 - 2, -3);
        vertex(-this.chassisWidth / 2 - flameLength * 0.7, 0);
        vertex(-this.chassisWidth / 2 - 2, 3);
        endShape(CLOSE);

        // Inner flame (white)
        fill(200, 240, 255, 250);
        beginShape();
        vertex(-this.chassisWidth / 2 - 2, -1.5);
        vertex(-this.chassisWidth / 2 - flameLength * 0.4, 0);
        vertex(-this.chassisWidth / 2 - 2, 1.5);
        endShape(CLOSE);
    }

    drawWheels() {
        rectMode(CENTER);
        const wheelOffsetX = this.chassisWidth / 2 - 3;
        const wheelOffsetY = this.chassisHeight / 2 + 3;

        // Tires
        fill(25, 25, 25);
        stroke(50, 50, 50);
        strokeWeight(1);

        // Front wheels with steering
        let frontAngle = 0;
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) frontAngle = -0.25;
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) frontAngle = 0.25;

        push();
        translate(wheelOffsetX, -wheelOffsetY);
        rotate(frontAngle);
        rect(0, 0, 8, 6, 2);
        pop();

        push();
        translate(wheelOffsetX, wheelOffsetY);
        rotate(frontAngle);
        rect(0, 0, 8, 6, 2);
        pop();

        // Rear wheels (wider)
        rect(-wheelOffsetX, -wheelOffsetY, 10, 7, 2);
        rect(-wheelOffsetX, wheelOffsetY, 10, 7, 2);
    }

    reset(startPos, track) {
        this.position = startPos.copy();
        this.velocity = createVector(0, 0);
        this.track = track;
        this.laps = 0;
        this.checkpointsReached = 0;
        this.lastCheckpoint = 0;
        this.finished = false;
        this.nitroFuel = this.nitroMaxFuel;
        this.nitroActive = false;
        this.nitroParticles = [];

        if (track && track.waypoints.length > 1) {
            const dir = p5.Vector.sub(track.waypoints[1], track.waypoints[0]);
            this.angle = dir.heading();
        }
    }
}
