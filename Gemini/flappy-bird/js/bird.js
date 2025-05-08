// Constants for the bird
const BIRD_SIZE = 20; // Size of the bird (radius for a circle, or side for a square)
const FLAP_STRENGTH = -5; // The upward velocity applied when flapping
const GRAVITY = 0.25; // Downward acceleration

class Bird {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Initial position and velocity
        this.x = 50; // Fixed horizontal position
        this.y = canvas.height / 2; // Start in the middle of the screen
        this.velocity = 0; // Initial vertical velocity
        this.rotation = 0; // Initial rotation

        // For wing animation
        this.wingAngle = 0;
        this.flapAnimationTime = 0;
        this.FLAP_ANIMATION_DURATION = 15; // frames for flap animation
    }

    // Update bird's state
    update() {
        // Apply gravity
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Update rotation based on velocity
        this.rotation = Math.atan2(this.velocity, 10);

        // Prevent bird from going above the top of the screen
        if (this.y - BIRD_SIZE / 2 < 0) { // Adjusted for oval shape
            this.y = BIRD_SIZE / 2;
            this.velocity = 0;
        }

        // Wing animation
        if (this.flapAnimationTime > 0) {
            this.flapAnimationTime--;
            // Wing moves up during flap animation
            this.wingAngle = -(Math.PI / 4) * (this.flapAnimationTime / this.FLAP_ANIMATION_DURATION);
        } else {
            // Wing rests slightly down or follows fall
            this.wingAngle = Math.PI / 6 + Math.sin(Date.now() / 200) * 0.1; // Gentle idle movement
        }
    }

    // Draw the bird on the canvas
    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);

        // Body (Oval)
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, BIRD_SIZE / 1.5, BIRD_SIZE / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing (Animated Triangle/Shape)
        this.ctx.fillStyle = 'orange';
        this.ctx.save();
        this.ctx.translate(-BIRD_SIZE / 10, 0); // Wing pivot point relative to bird center
        this.ctx.rotate(this.wingAngle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, -BIRD_SIZE / 8); // Top of wing at pivot
        this.ctx.lineTo(BIRD_SIZE / 2.5, 0); // Tip of wing
        this.ctx.lineTo(0, BIRD_SIZE / 8);  // Bottom of wing at pivot
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Eye
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(BIRD_SIZE / 3, -BIRD_SIZE / 6, BIRD_SIZE / 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.moveTo(BIRD_SIZE / 1.5 - BIRD_SIZE / 8, -BIRD_SIZE / 12);
        this.ctx.lineTo(BIRD_SIZE / 1.5 + BIRD_SIZE / 6, 0);
        this.ctx.lineTo(BIRD_SIZE / 1.5 - BIRD_SIZE / 8, BIRD_SIZE / 12);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    // Make the bird flap
    flap() {
        this.velocity = FLAP_STRENGTH;
        this.flapAnimationTime = this.FLAP_ANIMATION_DURATION;
        // if (flapSound) flapSound.play(); // Example sound hook
    }

    // Autopilot logic for preview mode
    autopilotUpdate(pipes, canvas, groundHeight, pipeGapHeight) {
        if (!pipes.length) {
            // If no pipes, try to stay in the middle if falling
            if (this.y > canvas.height / 2 && this.velocity >= 0) {
                this.flap();
            }
            return;
        }

        let nextPipePair = [];
        for (let p of pipes) {
            if (p.x + p.width > this.x) {
                if (!nextPipePair.find(np => np.x === p.x)) {
                    const pair = pipes.filter(op => op.x === p.x);
                    if (pair.length === 2) { // Ensure it's a pair
                        nextPipePair.push(...pair);
                        break; // Found the closest pair
                    }
                }
            }
        }
        
        const nextBottomPipe = nextPipePair.find(p => !p.isTopPipe);

        if (nextBottomPipe) {
            const pipeTopY = nextBottomPipe.y; // Bottom pipe's top edge
            const gapCenterY = pipeTopY - pipeGapHeight / 2;

            // Target slightly above the center of the gap to be safe
            const targetY = gapCenterY - BIRD_SIZE / 2;

            // If bird is below the target Y and falling, or too close to the top of the bottom pipe
            if (this.y > targetY && this.velocity > -FLAP_STRENGTH/3) { // flap if falling or not rising fast enough
                this.flap();
            }
        } else {
            // If no pipes ahead (e.g., very start or end of a clear section), try to stay in middle
            if (this.y > canvas.height / 2 && this.velocity >= 0) {
                 this.flap();
            }
        }

        // Emergency flap to avoid ground
        if (this.y + BIRD_SIZE / 2 > canvas.height - groundHeight - BIRD_SIZE && this.velocity > 0) {
            this.flap();
        }
    }

    collidesWithGround() {
        return this.y + BIRD_SIZE / 2 > this.canvas.height - groundHeight;
    }
}