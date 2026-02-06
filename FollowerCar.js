/**
 * FollowerCar.js - AI opponent cars with lap tracking
 * Now tracks laps and checkpoints for race competition
 */

class FollowerCar extends Vehicule {
    constructor(x, y, track) {
        super(x, y);

        this.track = track;
        this.currentWaypointIndex = 0;
        this.waypointReachDistance = 55;

        this.maxspeed = 4.0;
        this.maxforce = 0.24;
        this.r = 10;

        this.pathWeight = 1.5;
        this.separationWeight = 2.5;
        this.boundaryWeight = 2.0;
        this.desiredSeparation = 50;

        // Race tracking
        this.laps = 0;
        this.checkpointsReached = 0;
        this.lastCheckpoint = 0;
        this.finished = false;
        this.finishTime = 0;

        this.carColor = this.generateCarColor();
        this.chassisWidth = 26;
        this.chassisHeight = 13;
        this.numberDisplay = floor(random(2, 99));
    }

    generateCarColor() {
        const colors = [
            color(30, 100, 220),   // Blue
            color(220, 60, 60),    // Red
            color(30, 180, 100),   // Green
            color(180, 60, 200),   // Purple
            color(230, 130, 30),   // Orange
            color(30, 180, 180),   // Cyan
        ];
        return random(colors);
    }

    applyBehaviors(vehicles, targetCar) {
        if (this.finished) return;

        const pathForce = this.followPath();
        pathForce.mult(this.pathWeight);

        const separationForce = this.separate(vehicles);
        separationForce.mult(this.separationWeight);

        const playerAvoid = this.avoidCar(targetCar);
        playerAvoid.mult(2.0);

        const boundaryForce = this.avoidBoundary();
        boundaryForce.mult(this.boundaryWeight);

        this.applyForce(pathForce);
        this.applyForce(separationForce);
        this.applyForce(playerAvoid);
        this.applyForce(boundaryForce);
    }

    followPath() {
        if (!this.track) return createVector(0, 0);

        const target = this.track.waypoints[this.currentWaypointIndex];
        const distance = p5.Vector.dist(this.position, target);

        if (distance < this.waypointReachDistance) {
            const oldIndex = this.currentWaypointIndex;
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.track.waypoints.length;
            this.lastCheckpoint = this.currentWaypointIndex;
            this.checkpointsReached++;

            // Lap completion: arrived at waypoint 0 from the end of the track
            // Only count if we've actually gone through most of the track
            if (this.currentWaypointIndex === 0 && this.checkpointsReached >= this.track.waypoints.length * 0.8) {
                this.laps++;
                this.checkpointsReached = 0;
            }
        }

        return this.seek(this.track.waypoints[this.currentWaypointIndex]);
    }

    avoidBoundary() {
        if (!this.track) return createVector(0, 0);
        return this.track.getTrackBoundaryForce(this.position, this.velocity);
    }

    avoidCar(car) {
        const distance = p5.Vector.dist(this.position, car.position);
        if (distance > 0 && distance < this.desiredSeparation) {
            let diff = p5.Vector.sub(this.position, car.position);
            diff.normalize();
            diff.div(distance);
            return diff;
        }
        return createVector(0, 0);
    }

    separate(vehicles) {
        let steer = createVector(0, 0);
        let count = 0;

        for (let other of vehicles) {
            if (other === this) continue;
            const distance = p5.Vector.dist(this.position, other.position);

            if (distance > 0 && distance < this.desiredSeparation) {
                let diff = p5.Vector.sub(this.position, other.position);
                diff.normalize();
                diff.div(distance);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) steer.div(count);
        if (steer.mag() > 0) {
            steer.setMag(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce * 2);
        }
        return steer;
    }

    update() {
        if (this.finished) return;
        super.update();
        this.edges();
    }

    /**
     * Get race progress (laps * waypoints + current checkpoint)
     */
    getRaceProgress() {
        if (!this.track) return 0;
        return this.laps * this.track.waypoints.length + this.lastCheckpoint;
    }

    /**
     * Reset for new race
     */
    reset(spawnPos, waypointIndex, track) {
        this.position = spawnPos.copy();
        this.velocity = createVector(0, 0);
        this.track = track;
        this.currentWaypointIndex = waypointIndex;
        this.lastCheckpoint = waypointIndex;
        this.laps = 0;
        this.checkpointsReached = 0;
        this.finished = false;

        const nextIdx = (waypointIndex + 1) % track.waypoints.length;
        const dir = p5.Vector.sub(track.waypoints[nextIdx], spawnPos);
        dir.normalize();
        dir.mult(2);
        this.velocity = dir;
    }

    show() {
        push();
        translate(this.position.x, this.position.y);

        if (this.velocity.mag() > 0.1) {
            rotate(this.velocity.heading());
        }

        // Shadow
        noStroke();
        fill(0, 0, 0, 60);
        rectMode(CENTER);
        rect(3, 3, this.chassisWidth, this.chassisHeight, 3);

        // Wheels
        fill(25, 25, 25);
        stroke(40, 40, 40);
        strokeWeight(1);
        const wx = this.chassisWidth / 2 - 3;
        const wy = this.chassisHeight / 2 + 2;
        rect(wx, -wy, 7, 5, 2);
        rect(wx, wy, 7, 5, 2);
        rect(-wx, -wy, 8, 6, 2);
        rect(-wx, wy, 8, 6, 2);

        // Body
        fill(this.carColor);
        stroke(red(this.carColor) * 0.6, green(this.carColor) * 0.6, blue(this.carColor) * 0.6);
        strokeWeight(1.5);
        rect(0, 0, this.chassisWidth, this.chassisHeight, 4);

        // Cockpit
        fill(30, 30, 30);
        noStroke();
        rect(2, 0, 6, 6, 2);

        // Stripes
        fill(255, 255, 255, 200);
        rect(0, -4, this.chassisWidth - 8, 2);
        rect(0, 4, this.chassisWidth - 8, 2);

        // Wings
        fill(red(this.carColor) * 0.8, green(this.carColor) * 0.8, blue(this.carColor) * 0.8);
        rect(this.chassisWidth / 2 - 2, 0, 5, this.chassisHeight + 4, 1);
        fill(40, 40, 40);
        rect(-this.chassisWidth / 2 + 1, 0, 4, this.chassisHeight + 2, 1);

        // Number
        fill(255);
        ellipse(-4, 0, 9, 9);
        fill(0);
        textSize(6);
        textAlign(CENTER, CENTER);
        text(this.numberDisplay % 10, -4, 0);

        pop();
    }
}
