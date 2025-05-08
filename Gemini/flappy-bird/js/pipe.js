// Constants for pipes
const PIPE_WIDTH = 50;
const PIPE_GAP_HEIGHT = 150; // The vertical gap between upper and lower pipes
const PIPE_SPEED = 2; // Horizontal speed of pipes
const PIPE_GENERATION_INTERVAL = 1500; // Milliseconds between generating new pipes (approx)

class Pipe {
    constructor(canvas, isTopPipe, height, xPosition) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isTopPipe = isTopPipe; // Boolean: true for top pipe, false for bottom pipe
        this.x = xPosition;
        this.width = PIPE_WIDTH;
        this.passed = false; // To track if the bird has passed this pipe for scoring

        if (isTopPipe) {
            this.y = 0; // Top pipe starts from the top
            this.height = height;
        } else {
            this.height = height;
            this.y = canvas.height - this.height; // Bottom pipe starts from where its height allows
        }
    }

    // Update pipe's horizontal position
    update() {
        this.x -= PIPE_SPEED;
    }

    // Draw the pipe on the canvas
    draw() {
        // Main pipe color
        this.ctx.fillStyle = '#2E8B57'; // SeaGreen, a bit darker
        this.ctx.fillRect(this.x, this.y, this.width, this.height);

        // Add a darker gradient for a 3D effect (shadow on one side)
        const shadowGradient = this.ctx.createLinearGradient(this.x, this.y, this.x + this.width * 0.4, this.y);
        shadowGradient.addColorStop(0, 'rgba(0,0,0,0.4)'); // Darker edge
        shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');   // Fading to transparent
        this.ctx.fillStyle = shadowGradient;
        this.ctx.fillRect(this.x, this.y, this.width * 0.4, this.height);

        // Add a lighter gradient for highlight on the other side
        const highlightGradient = this.ctx.createLinearGradient(this.x + this.width * 0.6, this.y, this.x + this.width, this.y);
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0)');    // Transparent
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0.25)'); // Lighter edge
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(this.x + this.width * 0.6, this.y, this.width * 0.4, this.height);

        // Pipe cap/ring to make it look more like a pipe
        const capHeight = 15;
        const capColor = '#228B22'; // ForestGreen, slightly different shade for cap
        const capShadowColor = 'rgba(0,0,0,0.2)';
        const capHighlightColor = 'rgba(255,255,255,0.1)';

        if (this.isTopPipe) {
            // Main cap
            this.ctx.fillStyle = capColor;
            this.ctx.fillRect(this.x - 5, this.y + this.height - capHeight, this.width + 10, capHeight);
            // Inner shadow for cap
            this.ctx.fillStyle = capShadowColor;
            this.ctx.fillRect(this.x - 5, this.y + this.height - capHeight, this.width + 10, capHeight / 2);
        } else {
            // Main cap
            this.ctx.fillStyle = capColor;
            this.ctx.fillRect(this.x - 5, this.y, this.width + 10, capHeight);
            // Inner highlight for cap (as if light is coming from top)
            this.ctx.fillStyle = capHighlightColor;
            this.ctx.fillRect(this.x - 5, this.y + capHeight / 2, this.width + 10, capHeight / 2);
        }

        // Add some "grease" or "rust" spots (optional detail)
        this.ctx.fillStyle = 'rgba(50, 30, 20, 0.15)'; // Brownish, semi-transparent spots for rust/grease
        for (let i = 0; i < 8; i++) { // Add a few spots
            const spotX = this.x + Math.random() * (this.width - 6) + 3;
            const spotY = this.y + Math.random() * (this.height - 6) + 3;
            const spotWidth = Math.random() * 4 + 2;
            const spotHeight = Math.random() * 4 + 2;
            if (Math.random() > 0.5) {
                 this.ctx.fillRect(spotX, spotY, spotWidth, spotHeight);
            } else {
                this.ctx.beginPath();
                this.ctx.ellipse(spotX, spotY, spotWidth / 2, spotHeight / 2, Math.random() * Math.PI * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    // Check if the pipe is off-screen to the left
    isOffScreen() {
        return this.x + this.width < 0;
    }

    // Collision detection with the bird
    collidesWith(bird) {
        const birdLeft = bird.x - BIRD_SIZE / 2;
        const birdRight = bird.x + BIRD_SIZE / 2;
        const birdTop = bird.y - BIRD_SIZE / 2;
        const birdBottom = bird.y + BIRD_SIZE / 2;

        const pipeLeft = this.x;
        const pipeRight = this.x + this.width;
        const pipeTop = this.y;
        const pipeBottom = this.y + this.height;

        // Check for collision
        if (birdRight > pipeLeft && birdLeft < pipeRight &&
            birdBottom > pipeTop && birdTop < pipeBottom) {
            return true; // Collision detected
        }
        return false; // No collision
    }
}