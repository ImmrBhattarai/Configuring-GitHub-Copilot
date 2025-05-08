class Ball {
    constructor(canvas, wheel) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.wheel = wheel;
        
        // Ball physics properties
        this.radius = 10;
        this.mass = 1;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.angularVelocity = 0;
        
        // Physics constants
        this.gravity = 0.0005;  // Gravitational acceleration
        this.friction = 0.995;  // Surface friction coefficient
        this.restitution = 0.6; // Bounciness (1 = perfect bounce, 0 = no bounce)
        this.airResistance = 0.999; // Air resistance coefficient
        this.rotationFactor = 0.08; // Increased from 0.02
        
        // Ball state
        this.isActive = false;
        this.deltaTime = 16; // Default delta time in ms
        this.isRolling = false;
        this.inPocket = false;
        this.pocketIndex = -1;
        this.initialSpeed = 1.2;  // Increased from 0.3 to make movement more visible
        
        // Ball appearance
        this.color = 'white';
        this.highlightColor = 'rgba(255, 255, 255, 0.8)';
        this.shadowColor = 'rgba(0, 0, 0, 0.5)';
        
        // Bowl shape properties (for simulating the bowl curvature)
        this.bowlDepth = 30; // How deep the bowl is
        this.bowlRadius = wheel.getOuterRadius() * 0.9;
        
        // Sound effects
        this.ballSound = document.getElementById('ballRollingSound');
        
        // Adding new properties to handle landing animation and final position
        this.landedPosition = { x: 0, y: 0 };
        this.finalPositionReached = false;
        this.settleTime = 0;
        this.maxSettleTime = 1000; // 1 second to settle in pocket

        // Add rotation visualization properties
        this.rotationAngle = 0;
        this.rotationSpeed = 0;
        this.maxRotationSpeed = 0.1;
        
        // Add texture to the ball for visible rotation
        this.hasTexture = true;
    }

    initialize() {
        // Start the ball in the middle of the wheel
        this.position = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.isActive = false;
        this.inPocket = false;
        this.pocketIndex = -1;
        this.finalPositionReached = false;
        this.settleTime = 0;
        
        // Add a wobble effect when starting
        this.wobblePhase = 0;
    }

    launch() {
        if (this.isActive) return;
        
        console.log("Ball launched");  // Debugging log to confirm launch
        
        // Start from center with more dynamic initial velocity
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate starting position - slightly offset from center for more realistic motion
        const startOffsetDistance = this.wheel.getInnerRadius() * 1.1;
        const startAngle = Math.random() * Math.PI * 2; // Random starting angle
        
        this.position = {
            x: centerX + Math.cos(startAngle) * startOffsetDistance,
            y: centerY + Math.sin(startAngle) * startOffsetDistance
        };
        
        // Initial velocity perpendicular to the radius vector (tangential)
        const perpAngle = startAngle + Math.PI/2;
        const initialSpeed = this.initialSpeed * (0.8 + Math.random() * 0.4); // Random variation in speed
        
        this.velocity = {
            x: Math.cos(perpAngle) * initialSpeed,
            y: Math.sin(perpAngle) * initialSpeed
        };
        
        // Add a stronger outward component to make the ball move toward the rim
        const outwardSpeed = initialSpeed * 0.5;  // Increased from 0.2
        this.velocity.x += Math.cos(startAngle) * outwardSpeed;
        this.velocity.y += Math.sin(startAngle) * outwardSpeed;
        
        this.isActive = true;
        this.isRolling = true;
        this.wobblePhase = 0;
        
        // Play ball rolling sound
        if (this.ballSound) {
            this.ballSound.currentTime = 0;
            this.ballSound.play().catch(e => console.log("Audio play failed:", e));
        }
        
        // Make sure ball has initial acceleration from wheel
        this.applyWheelForces();
        
        // Add an immediate impulse to ensure movement
        const wheelSpeed = this.wheel.getRotationSpeed();
        if (wheelSpeed > 0) {
            // Add a tangential impulse based on wheel direction
            this.velocity.x += -Math.sin(startAngle) * wheelSpeed * 5;
            this.velocity.y += Math.cos(startAngle) * wheelSpeed * 5;
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;
        
        this.deltaTime = deltaTime;
        
        // Update ball rotation based on movement
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        this.rotationSpeed = speed * 0.1; // Rotation speed based on ball speed
        this.rotationAngle += this.rotationSpeed * deltaTime;
        
        // Keep rotation angle within 0-2π range
        if (this.rotationAngle >= 2 * Math.PI) {
            this.rotationAngle -= 2 * Math.PI;
        }
        
        // If the ball has landed in a pocket, handle the settling animation
        if (this.inPocket) {
            this.handlePocketSettling(deltaTime);
            return;
        }
        
        // Apply wheel's rotation to affect the ball
        this.applyWheelForces();
        
        // Apply gravity towards the center (simulating bowl shape)
        this.applyBowlGravity();
        
        // Update velocity from acceleration
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        // Apply air resistance
        this.velocity.x *= this.airResistance;
        this.velocity.y *= this.airResistance;
        
        // Apply friction when rolling on the wheel
        this.applyFriction();
        
        // Update position from velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Check for collisions with wheel boundaries
        this.checkWheelCollisions();
        
        // Check if ball has settled in a pocket
        this.checkPocketLanding();
        
        // Reset acceleration
        this.acceleration = { x: 0, y: 0 };
    }

    applyWheelForces() {
        // Apply centrifugal force from the wheel rotation
        const wheelCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        const distanceX = this.position.x - wheelCenter.x;
        const distanceY = this.position.y - wheelCenter.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance > 0) {
            // Normalize the distance vector
            const normalizedX = distanceX / distance;
            const normalizedY = distanceY / distance;
            
            // Apply wheel rotation force perpendicular to the radial vector
            // This simulates the wheel pushing the ball tangentially
            const wheelSpeed = this.wheel.getRotationSpeed();
            const tangentialForceX = -normalizedY * wheelSpeed * this.rotationFactor;
            const tangentialForceY = normalizedX * wheelSpeed * this.rotationFactor;
            
            this.acceleration.x += tangentialForceX;
            this.acceleration.y += tangentialForceY;
        }
    }

    applyBowlGravity() {
        // Find vector from ball to center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const dx = this.position.x - centerX;
        const dy = this.position.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize the vector
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            // Calculate gravitational acceleration based on bowl depth and distance from center
            // This creates a force that increases as the ball moves away from the center (up the bowl)
            const distanceRatio = distance / this.bowlRadius;
            const gravitationalForce = this.gravity * distanceRatio * distanceRatio;
            
            // Apply gravitational acceleration towards center
            this.acceleration.x -= normalizedX * gravitationalForce * this.deltaTime;
            this.acceleration.y -= normalizedY * gravitationalForce * this.deltaTime;
        }
    }

    applyFriction() {
        // Apply friction to slow down the ball
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // If the ball is rolling very slowly, eventually stop it
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed < 0.001) {
            this.isRolling = false;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    checkWheelCollisions() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const dx = this.position.x - centerX;
        const dy = this.position.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check collision with outer wall
        const outerRadius = this.wheel.getOuterRadius() - this.radius;
        if (distance > outerRadius) {
            // Calculate the normalized normal vector at collision point
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Position correction to prevent sinking
            this.position.x = centerX + nx * outerRadius;
            this.position.y = centerY + ny * outerRadius;
            
            // Calculate the dot product of velocity and normal
            const dotProduct = this.velocity.x * nx + this.velocity.y * ny;
            
            // Apply reflection with restitution
            this.velocity.x -= (1 + this.restitution) * dotProduct * nx;
            this.velocity.y -= (1 + this.restitution) * dotProduct * ny;
            
            // Play collision sound at reduced volume
            if (Math.abs(dotProduct) > 0.01) {
                this.ballSound.volume = Math.min(0.5, Math.abs(dotProduct));
                this.ballSound.currentTime = 0;
                this.ballSound.play();
            }
        }
        
        // Check collision with inner wall
        const innerRadius = this.wheel.getInnerRadius() + this.radius;
        if (distance < innerRadius) {
            // Calculate the normalized normal vector at collision point
            const nx = -dx / distance; // Negative because force points outward
            const ny = -dy / distance;
            
            // Position correction to prevent sinking
            this.position.x = centerX + nx * -innerRadius;
            this.position.y = centerY + ny * -innerRadius;
            
            // Calculate the dot product of velocity and normal
            const dotProduct = this.velocity.x * nx + this.velocity.y * ny;
            
            // Apply reflection with restitution
            this.velocity.x -= (1 + this.restitution) * dotProduct * nx;
            this.velocity.y -= (1 + this.restitution) * dotProduct * ny;
            
            // Play collision sound at reduced volume
            if (Math.abs(dotProduct) > 0.01) {
                this.ballSound.volume = Math.min(0.5, Math.abs(dotProduct));
                this.ballSound.currentTime = 0;
                this.ballSound.play();
            }
        }
    }

    checkPocketLanding() {
        // Only check if the ball has nearly stopped and wheel has stopped spinning
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed < 0.01 && !this.inPocket && !this.wheel.isSpinning) {
            console.log("Ball landing in pocket");
            
            // Calculate the angle of the ball position relative to wheel center
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const dx = this.position.x - centerX;
            const dy = this.position.y - centerY;
            const angle = Math.atan2(dy, dx);
            
            // Normalize angle to [0, 2π)
            const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
            
            // Adjust for wheel rotation
            const adjustedAngle = (normalizedAngle - this.wheel.getAngle() + 2 * Math.PI) % (2 * Math.PI);
            
            // Find which pocket the ball is in
            const sectionAngle = (2 * Math.PI) / this.wheel.numbers.length;
            this.pocketIndex = Math.floor(adjustedAngle / sectionAngle);
            
            // Ensure index is within valid range
            if (this.pocketIndex >= this.wheel.numbers.length) {
                this.pocketIndex = 0;
            }
            
            // Calculate the exact center position of the pocket for landing animation
            // Use the center of the pocket, not just the angle the ball is at
            const pocketCenterAngle = (this.pocketIndex * sectionAngle) + (sectionAngle / 2) + this.wheel.getAngle();
            
            // Use a fixed radius for all pockets to ensure consistency
            const pocketRadius = (this.wheel.getOuterRadius() + this.wheel.getInnerRadius()) / 2;
            this.landedPosition = {
                x: centerX + Math.cos(pocketCenterAngle) * pocketRadius,
                y: centerY + Math.sin(pocketCenterAngle) * pocketRadius
            };
            
            this.inPocket = true;
            this.settleTime = 0;
            this.maxSettleTime = 800; // Shortened from 1000 to 800ms for snappier feedback
            
            // Play a soft landing sound
            if (this.ballSound) {
                this.ballSound.volume = 0.2;
                this.ballSound.currentTime = 0;
                this.ballSound.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // Don't update the UI yet - this will be done when the ball has fully settled
        }
    }
    
    handlePocketSettling(deltaTime) {
        // Increment settle time
        this.settleTime += deltaTime;
        
        // Gradually slow down the rotation when in pocket
        this.rotationSpeed *= 0.95;
        
        if (!this.finalPositionReached) {
            // Smoothly move the ball to the center of the pocket
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Calculate distance to final position
            const dx = this.landedPosition.x - this.position.x;
            const dy = this.landedPosition.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.5) {
                // Move ball toward final position with easing
                const progress = Math.min(1, this.settleTime / 500); // 500ms to reach final position
                const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
                
                this.position.x += dx * easeProgress * 0.1;
                this.position.y += dy * easeProgress * 0.1;
                
                // Add a slight wobble to simulate settling
                const wobble = Math.sin(this.settleTime / 50) * (1 - progress) * 0.5;
                this.position.x += wobble;
                this.position.y += wobble;
            } else {
                // Ball has reached final position
                this.position.x = this.landedPosition.x;
                this.position.y = this.landedPosition.y;
                this.finalPositionReached = true;
            }
        }
        
        // After max settle time, completely stop the ball
        if (this.settleTime >= this.maxSettleTime) {
            this.isActive = false;
            this.velocity = { x: 0, y: 0 };
            this.rotationSpeed = 0; // Ensure rotation stops completely
            
            // Only now show the result, when the ball has completely stopped
            if (this.pocketIndex >= 0 && this.pocketIndex < this.wheel.numbers.length) {
                document.getElementById('status').textContent = 'Ball landed on ' + this.wheel.numbers[this.pocketIndex];
                document.getElementById('lastNumber').textContent = this.wheel.numbers[this.pocketIndex];
                
                // Notify game that the result has been determined
                const resultEvent = new CustomEvent('rouletteResult', { 
                    detail: { 
                        number: this.wheel.numbers[this.pocketIndex],
                        index: this.pocketIndex
                    }
                });
                document.dispatchEvent(resultEvent);
            }
        }
    }

    reset() {
        this.initialize();
        this.inPocket = false;
        this.pocketIndex = -1;
        this.isRolling = false;
        this.finalPositionReached = false;
        this.settleTime = 0;
    }

    draw() {
        const ctx = this.context;
        
        // Draw ball shadow
        ctx.beginPath();
        ctx.arc(this.position.x + 3, this.position.y + 3, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.shadowColor;
        ctx.fill();
        
        // Save context for rotation
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotationAngle);
        
        // Draw the ball
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add texture to the ball to show rotation
        if (this.hasTexture) {
            // Draw texture lines to visualize rotation
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.7, 0);
            ctx.lineTo(this.radius * 0.7, 0);
            ctx.lineWidth = this.radius * 0.15;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.7);
            ctx.lineTo(0, this.radius * 0.7);
            ctx.lineWidth = this.radius * 0.15;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.stroke();
        }
        
        // Add highlight to give 3D effect
        ctx.beginPath();
        ctx.arc(-this.radius/3, -this.radius/3, this.radius/2, 0, Math.PI * 2);
        ctx.fillStyle = this.highlightColor;
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
}

export default Ball;