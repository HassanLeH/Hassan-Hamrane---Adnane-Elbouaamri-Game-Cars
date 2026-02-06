/**
 * LeaderCar.js - The lead car that follows the track
 * Premium visual style with detailed rendering
 */

class LeaderCar extends Vehicule {
    constructor(x, y, track) {
        super(x, y);

        this.track = track;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = 35;

        // Leader car properties - faster
        this.maxspeed = 5.5;
        this.maxforce = 0.28;
        this.r = 12;

        // Visual properties
        this.chassisWidth = 26;
        this.chassisHeight = 13;
    }

    /**
     * Update car position and follow track
     */
    update() {
        this.followPath();
        this.avoidBoundary();
        super.update();
        this.edges();
    }

    /**
     * Follow track waypoints
     */
    followPath() {
        if (!this.track || this.track.waypoints.length === 0) return;

        const target = this.track.waypoints[this.currentWaypointIndex];
        const distance = p5.Vector.dist(this.position, target);

        if (distance < this.waypointReachDistance) {
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.track.waypoints.length;
        }

        const steerForce = this.seek(this.track.waypoints[this.currentWaypointIndex]);
        this.applyForce(steerForce);
    }

    /**
     * Stay on track
     */
    avoidBoundary() {
        if (!this.track) return;
        const boundaryForce = this.track.getTrackBoundaryForce(this.position, this.velocity);
        boundaryForce.mult(1.2);
        this.applyForce(boundaryForce);
    }

    /**
     * Draw premium leader car - bright red F1 style
     */
    show() {
        push();
        translate(this.position.x, this.position.y);

        if (this.velocity.mag() > 0.1) {
            rotate(this.velocity.heading());
        }

        // Motion blur trail effect
        this.drawTrail();

        // Shadow
        noStroke();
        fill(0, 0, 0, 70);
        rect(4, 4, this.chassisWidth, this.chassisHeight, 4);

        // Wheels
        this.drawWheels();

        // Main body - Ferrari red gradient effect
        this.drawBody();

        // Details
        this.drawDetails();

        pop();
    }

    /**
     * Draw motion trail
     */
    drawTrail() {
        if (this.velocity.mag() > 2) {
            noStroke();
            for (let i = 3; i > 0; i--) {
                fill(220, 50, 50, 30 - i * 8);
                const offset = -i * 8;
                rect(offset, 0, this.chassisWidth * 0.8, this.chassisHeight * 0.8, 3);
            }
        }
    }

    /**
     * Draw car body with gradient effect
     */
    drawBody() {
        rectMode(CENTER);

        // Dark red base
        fill(180, 20, 20);
        stroke(120, 10, 10);
        strokeWeight(2);
        rect(0, 0, this.chassisWidth, this.chassisHeight, 5);

        // Bright red overlay
        noStroke();
        fill(230, 40, 40);
        rect(0, -1, this.chassisWidth - 4, this.chassisHeight / 2, 3);

        // Top highlight
        fill(255, 100, 100, 100);
        rect(0, -3, this.chassisWidth - 8, 3, 2);
    }

    /**
     * Draw car details
     */
    drawDetails() {
        rectMode(CENTER);
        noStroke();

        // White racing stripe
        fill(255, 255, 255);
        rect(0, 0, this.chassisWidth - 6, 2);

        // Gold accent lines
        fill(255, 200, 50);
        rect(0, -5, this.chassisWidth - 10, 1);
        rect(0, 5, this.chassisWidth - 10, 1);

        // Windshield
        fill(60, 120, 200, 200);
        stroke(40, 80, 150);
        strokeWeight(1);
        rect(4, 0, 6, this.chassisHeight - 5, 2);

        // Cockpit
        noStroke();
        fill(30, 30, 30);
        ellipse(2, 0, 4, 5);

        // Number "1"
        fill(255, 255, 255);
        ellipse(-4, 0, 9, 9);
        fill(220, 30, 30);
        textSize(7);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text("1", -4, 0);
        textStyle(NORMAL);

        // Front wing
        fill(200, 30, 30);
        rect(this.chassisWidth / 2 + 1, 0, 4, this.chassisHeight + 4, 1);

        // Front lights
        fill(255, 255, 200);
        ellipse(this.chassisWidth / 2 - 1, -4, 3, 3);
        ellipse(this.chassisWidth / 2 - 1, 4, 3, 3);

        // Rear spoiler
        fill(50, 50, 50);
        rect(-this.chassisWidth / 2 + 1, 0, 4, this.chassisHeight + 4, 1);

        // Exhaust flames (when fast)
        if (this.velocity.mag() > 3) {
            fill(255, 150, 50, 150);
            ellipse(-this.chassisWidth / 2 - 3, -2, 6, 3);
            ellipse(-this.chassisWidth / 2 - 3, 2, 6, 3);
            fill(255, 255, 100, 100);
            ellipse(-this.chassisWidth / 2 - 2, -2, 3, 2);
            ellipse(-this.chassisWidth / 2 - 2, 2, 3, 2);
        }
    }

    /**
     * Draw detailed wheels
     */
    drawWheels() {
        rectMode(CENTER);
        const wheelOffsetX = this.chassisWidth / 2 - 3;
        const wheelOffsetY = this.chassisHeight / 2 + 2;

        // Shadows
        fill(0, 0, 0, 50);
        noStroke();
        rect(wheelOffsetX + 2, -wheelOffsetY + 2, 8, 5, 2);
        rect(wheelOffsetX + 2, wheelOffsetY + 2, 8, 5, 2);
        rect(-wheelOffsetX + 2, -wheelOffsetY + 2, 8, 5, 2);
        rect(-wheelOffsetX + 2, wheelOffsetY + 2, 8, 5, 2);

        // Tires
        fill(20, 20, 20);
        stroke(50, 50, 50);
        strokeWeight(1);
        rect(wheelOffsetX, -wheelOffsetY, 8, 5, 2);
        rect(wheelOffsetX, wheelOffsetY, 8, 5, 2);
        rect(-wheelOffsetX, -wheelOffsetY, 8, 5, 2);
        rect(-wheelOffsetX, wheelOffsetY, 8, 5, 2);

        // Red wheel hubs
        fill(180, 30, 30);
        noStroke();
        ellipse(wheelOffsetX, -wheelOffsetY, 3, 3);
        ellipse(wheelOffsetX, wheelOffsetY, 3, 3);
        ellipse(-wheelOffsetX, -wheelOffsetY, 3, 3);
        ellipse(-wheelOffsetX, wheelOffsetY, 3, 3);
    }

    /**
     * Get lap progress
     */
    getLapProgress() {
        return this.currentWaypointIndex / this.track.waypoints.length;
    }
}
