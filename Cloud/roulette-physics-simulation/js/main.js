import Wheel from './wheel.js';
import Ball from './ball.js';
import Physics from './physics.js';

class RouletteGame {
    constructor() {
        // Setup canvas
        this.canvas = document.getElementById('rouletteCanvas');
        this.context = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.resizeCanvas();
        
        // Initialize components
        this.physics = new Physics();
        this.wheel = new Wheel(this.canvas);
        this.ball = new Ball(this.canvas, this.wheel);
        
        // Game state
        this.isRunning = false;
        this.lastTimestamp = 0;
        this.gameState = 'idle'; // idle, spinning, finished
        this.animationFrame = null;
        
        // Visual effects
        this.spotlightAngle = 0;
        this.casinoLights = [];
        this.initCasinoLights();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initial setup
        this.initialize();
    }
    
    resizeCanvas() {
        // Make the canvas a square that fits within the viewport
        const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.7);
        this.canvas.width = size;
        this.canvas.height = size;
    }
    
    initCasinoLights() {
        // Create decorative lights around the wheel
        const numLights = 24;
        const radius = this.canvas.width * 0.48;
        
        for (let i = 0; i < numLights; i++) {
            const angle = (i / numLights) * Math.PI * 2;
            this.casinoLights.push({
                x: this.canvas.width / 2 + radius * Math.cos(angle),
                y: this.canvas.height / 2 + radius * Math.sin(angle),
                color: i % 2 === 0 ? '#FFCC00' : '#FFFFFF',
                size: 5 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2,
                blinkSpeed: 0.003 + Math.random() * 0.002
            });
        }
    }
    
    initialize() {
        this.wheel.initialize();
        this.ball.initialize();
        this.draw();
        
        this.isRunning = true;
        this.gameState = 'idle';
        
        // Start game loop
        this.animationFrame = window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    setupEventListeners() {
        // Spin button
        document.getElementById('spinButton').addEventListener('click', () => {
            this.startSpin();
        });
        
        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.wheel.initialize();
            this.ball.initialize();
            this.initCasinoLights();
            this.draw();
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Space') {
                // Spacebar to spin
                this.startSpin();
            } else if (e.key === 'r' || e.key === 'R') {
                // 'R' to reset
                this.resetGame();
            }
        });
        
        // Listen for ball landing result
        document.addEventListener('rouletteResult', () => {
            console.log("Result event received - enabling spin button");
            this.gameState = 'finished';
            document.getElementById('spinButton').disabled = false;
            
            // Reset the canvas transformation when the game is finished
            this.canvas.style.transform = '';
            
            // Flash the result
            this.flashResult();
        });
    }
    
    startSpin() {
        if (this.gameState === 'idle') {
            console.log("Starting spin"); // Debugging log
            
            // Update game state
            this.gameState = 'spinning';
            
            // Add a visual flair - slight tilt to the canvas during spin
            this.canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
            
            // Start the wheel spinning
            this.wheel.spin();
            
            // Add a delay before launching the ball (reduced from 1000ms to 800ms)
            setTimeout(() => {
                if (this.gameState === 'spinning') {
                    console.log("Launching ball after delay");
                    this.ball.launch();
                }
            }, 800);
            
            // Update UI
            document.getElementById('spinButton').disabled = true;
        }
    }
    
    resetGame() {
        // Reset components
        this.wheel.reset();
        this.ball.reset();
        
        // Reset visual effects
        this.canvas.style.transform = '';
        
        // Update game state
        this.gameState = 'idle';
        
        // Update UI
        document.getElementById('spinButton').disabled = false;
        document.getElementById('status').textContent = 'Ready to spin';
        document.getElementById('lastNumber').textContent = '-';
    }
    
    update(deltaTime) {
        // Update wheel physics
        this.wheel.update(deltaTime);
        
        // Update ball physics
        this.ball.update(deltaTime);
        
        // Update decorative effects
        this.updateVisualEffects(deltaTime);
        
        // Check if the game has finished
        if (this.gameState === 'spinning' && !this.wheel.isSpinning && !this.ball.isActive) {
            this.gameState = 'finished';
            document.getElementById('spinButton').disabled = false;
            
            // Reset the canvas transformation when the game is finished
            this.canvas.style.transform = '';
            
            // Flash the result
            this.flashResult();
        }
    }
    
    updateVisualEffects(deltaTime) {
        // Rotate spotlight
        this.spotlightAngle += 0.001 * deltaTime;
        if (this.spotlightAngle >= Math.PI * 2) {
            this.spotlightAngle -= Math.PI * 2;
        }
        
        // Animate lights
        for (const light of this.casinoLights) {
            light.phase += light.blinkSpeed * deltaTime;
            if (light.phase >= Math.PI * 2) {
                light.phase -= Math.PI * 2;
            }
        }
    }
    
    flashResult() {
        const lastNumber = document.getElementById('lastNumber');
        const originalColor = lastNumber.style.color;
        let flashCount = 0;
        
        const flash = () => {
            if (flashCount >= 6) {
                lastNumber.style.color = originalColor;
                return;
            }
            
            lastNumber.style.color = flashCount % 2 === 0 ? '#FFFFFF' : '#FFCC00';
            flashCount++;
            setTimeout(flash, 200);
        };
        
        flash();
    }
    
    drawLights() {
        const ctx = this.context;
        
        // Draw decorative lights around wheel
        for (const light of this.casinoLights) {
            const brightness = (Math.sin(light.phase) + 1) / 2; // Value between 0 and 1
            
            // Draw glow
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.size * 3
            );
            gradient.addColorStop(0, light.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.globalAlpha = brightness * 0.5;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw light
            ctx.globalAlpha = brightness;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.size, 0, Math.PI * 2);
            ctx.fillStyle = light.color;
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
    
    draw() {
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw decorative effects
        this.drawLights();
        
        // Draw wheel
        this.wheel.draw();
        
        // Draw ball
        this.ball.draw();
        
        // Draw spotlight effect when the wheel is spinning
        if (this.gameState === 'spinning' || this.gameState === 'finished') {
            this.drawSpotlight();
        }
    }
    
    drawSpotlight() {
        const ctx = this.context;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width * 0.5;
        
        // Create spotlight gradient
        const spotX = centerX + Math.cos(this.spotlightAngle) * radius * 0.5;
        const spotY = centerY + Math.sin(this.spotlightAngle) * radius * 0.5;
        
        const gradient = ctx.createRadialGradient(
            spotX, spotY, 0,
            spotX, spotY, radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        
        // Apply spotlight
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(spotX, spotY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
    
    gameLoop(timestamp) {
        // Calculate delta time (in milliseconds)
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        
        // Use a fixed time step for physics to ensure smoother animation
        const targetFrameRate = 60; // Target 60 FPS
        const targetDeltaTime = 1000 / targetFrameRate; // ~16.67ms per frame
        
        // Calculate actual delta time
        let deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Cap delta time to prevent large jumps
        if (deltaTime > 100) {
            deltaTime = targetDeltaTime;
        }
        
        // For super smooth animation, we can use smaller physics steps
        const physicsSteps = Math.ceil(deltaTime / targetDeltaTime);
        const stepDeltaTime = deltaTime / physicsSteps;
        
        // Run multiple smaller physics steps for smoother simulation
        for (let i = 0; i < physicsSteps; i++) {
            this.update(stepDeltaTime);
        }
        
        // Draw the scene
        this.draw();
        
        // Use requestAnimationFrame with a high priority
        if (this.isRunning) {
            this.animationFrame = window.requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
    
    cleanup() {
        // Cancel animation frame if the game is destroyed
        if (this.animationFrame) {
            window.cancelAnimationFrame(this.animationFrame);
        }
        
        // Stop any running audio
        const ballSound = document.getElementById('ballRollingSound');
        const wheelSound = document.getElementById('wheelSpinningSound');
        
        if (ballSound) ballSound.pause();
        if (wheelSound) wheelSound.pause();
    }
}

// Create and start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new RouletteGame();
    
    // Create placeholder audio files if needed
    const checkAndCreateAudio = (id, src) => {
        const audio = document.getElementById(id);
        if (!audio) {
            console.warn(`Creating placeholder audio element for ${id}`);
            const newAudio = document.createElement('audio');
            newAudio.id = id;
            newAudio.src = src;
            newAudio.preload = 'auto';
            document.body.appendChild(newAudio);
        }
    };
    
    checkAndCreateAudio('ballRollingSound', 'assets/sounds/ball-rolling.mp3');
    checkAndCreateAudio('wheelSpinningSound', 'assets/sounds/wheel-spinning.mp3');
    
    // Handle page unload to clean up resources
    window.addEventListener('beforeunload', () => {
        game.cleanup();
    });
});