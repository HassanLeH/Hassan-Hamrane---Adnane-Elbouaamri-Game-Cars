/**
 * Vehicule.js - Base physics class (IMMUTABLE CORE)
 * Contains only physics logic: position, velocity, acceleration
 * No rendering code - subclasses handle their own display
 */

class Vehicule {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        
        // Physical properties
        this.r = 10;           // Collision radius
        this.maxforce = 0.2;   // Maximum steering force
        this.maxspeed = 4;     // Maximum speed
    }
    
    /**
     * Apply a force to the vehicle (F = ma, assuming m = 1)
     * @param {p5.Vector} force - Force vector to apply
     */
    applyForce(force) {
        this.acceleration.add(force);
    }
    
    /**
     * Update physics using Euler integration
     * Called every frame to update position based on velocity
     */
    update() {
        // Euler integration
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        
        // Reset acceleration each frame
        this.acceleration.mult(0);
    }
    
    /**
     * Handle edge behavior - bounce off screen edges
     * Can be overridden for wrap-around behavior
     */
    edges() {
        const margin = this.r;
        
        // Bounce off left/right edges
        if (this.position.x < margin) {
            this.position.x = margin;
            this.velocity.x *= -0.5;
        } else if (this.position.x > width - margin) {
            this.position.x = width - margin;
            this.velocity.x *= -0.5;
        }
        
        // Bounce off top/bottom edges
        if (this.position.y < margin) {
            this.position.y = margin;
            this.velocity.y *= -0.5;
        } else if (this.position.y > height - margin) {
            this.position.y = height - margin;
            this.velocity.y *= -0.5;
        }
    }
    
    /**
     * Seek steering behavior - steer towards a target
     * @param {p5.Vector} target - Target position to seek
     * @returns {p5.Vector} Steering force
     */
    seek(target) {
        // Desired velocity points towards target at max speed
        let desired = p5.Vector.sub(target, this.position);
        desired.setMag(this.maxspeed);
        
        // Steering = desired - current velocity
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);
        
        return steer;
    }
    
    /**
     * Arrive steering behavior - slow down when approaching target
     * @param {p5.Vector} target - Target position
     * @param {number} slowRadius - Distance at which to start slowing down
     * @returns {p5.Vector} Steering force
     */
    arrive(target, slowRadius = 100) {
        let desired = p5.Vector.sub(target, this.position);
        let distance = desired.mag();
        
        // Map speed based on distance when within slow radius
        let speed = this.maxspeed;
        if (distance < slowRadius) {
            speed = map(distance, 0, slowRadius, 0, this.maxspeed);
        }
        
        desired.setMag(speed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);
        
        return steer;
    }
}
