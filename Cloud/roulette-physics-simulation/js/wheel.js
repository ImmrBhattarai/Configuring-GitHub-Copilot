class Wheel {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.outerRadius = Math.min(canvas.width, canvas.height) * 0.45;
        this.innerRadius = this.outerRadius * 0.8;
        this.pocketRadius = this.outerRadius * 0.85;
        this.angle = 0;
        this.rotationSpeed = 0;
        this.maxRotationSpeed = 0.1;
        this.deceleration = 0.000017; // Reduced from 0.0001 to make wheel spin longer (approx. 6 seconds)
        this.spinDuration = 6000; // 6 seconds in milliseconds
        this.spinStartTime = 0;
        this.isSpinning = false;
        this.finalAngle = 0;
        
        // European roulette numbers (0-36)
        this.numbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];
        
        // Colors for each pocket (0 is green, others alternate between red and black)
        this.colors = ['#00994C'];
        for (let i = 1; i < this.numbers.length; i++) {
            // Red numbers: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
            const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
            this.colors.push(redNumbers.includes(this.numbers[i]) ? '#CC0000' : '#000000');
        }
        
        this.sectionAngle = (2 * Math.PI) / this.numbers.length;
        
        // Metal dividers between pockets
        this.dividerWidth = 2;
        this.dividerColor = '#C0C0C0';
        
        // Wheel decorative elements
        this.rimColor = '#8B4513';
        this.rimWidth = this.outerRadius * 0.08;

        // Add properties for improved number labels
        this.numberLabelBgRadius = this.pocketRadius * 0.9;
        this.numberLabelRadius = this.pocketRadius * 0.75;
        this.diamondSize = this.outerRadius * 0.04;
    }

    initialize() {
        // Nothing special needed for initialization
    }

    draw() {
        const ctx = this.context;
        ctx.save();
        
        // Translate to wheel center
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        
        // Draw outer rim
        ctx.beginPath();
        ctx.arc(0, 0, this.outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = this.rimColor;
        ctx.fill();
        
        // Draw wheel face
        ctx.beginPath();
        ctx.arc(0, 0, this.outerRadius - this.rimWidth, 0, 2 * Math.PI);
        ctx.fillStyle = '#046931';
        ctx.fill();
        
        // Draw pockets
        for (let i = 0; i < this.numbers.length; i++) {
            const startAngle = i * this.sectionAngle;
            const endAngle = (i + 1) * this.sectionAngle;
            
            // Draw colored pocket section
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.pocketRadius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[i];
            ctx.fill();
            
            // Draw the metal dividers
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.outerRadius * Math.cos(startAngle), this.outerRadius * Math.sin(startAngle));
            ctx.lineWidth = this.dividerWidth;
            ctx.strokeStyle = this.dividerColor;
            ctx.stroke();

            // Add a circular background for number text
            const textAngle = startAngle + (this.sectionAngle / 2);
            const bgCenterX = this.numberLabelBgRadius * Math.cos(textAngle);
            const bgCenterY = this.numberLabelBgRadius * Math.sin(textAngle);
            
            // Create a contrasting colored background for the number
            ctx.beginPath();
            ctx.arc(bgCenterX, bgCenterY, this.outerRadius * 0.05, 0, 2 * Math.PI);
            // Use inverse color of the pocket for better contrast
            ctx.fillStyle = this.colors[i] === '#CC0000' ? '#FFFFFF' : 
                            this.colors[i] === '#000000' ? '#FFFFFF' : '#000000';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Position and rotate the number text
            ctx.save();
            const textRadius = this.numberLabelRadius;
            const textX = textRadius * Math.cos(textAngle);
            const textY = textRadius * Math.sin(textAngle);
            
            ctx.translate(textX, textY);
            ctx.fillStyle = this.colors[i] === '#CC0000' ? '#CC0000' : 
                           this.colors[i] === '#000000' ? '#000000' : '#046931';
            ctx.font = `bold ${Math.floor(this.outerRadius * 0.05)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.numbers[i].toString(), 0, 0);
            ctx.restore();
            
            // Add decorative diamonds near the inner rim for visual appeal
            if (i % 2 === 0) {
                ctx.save();
                const diamondAngle = startAngle + (this.sectionAngle / 2);
                const diamondX = (this.innerRadius + this.diamondSize) * Math.cos(diamondAngle);
                const diamondY = (this.innerRadius + this.diamondSize) * Math.sin(diamondAngle);
                
                ctx.translate(diamondX, diamondY);
                ctx.rotate(diamondAngle + Math.PI/4);
                ctx.fillStyle = '#FFCC00';
                ctx.fillRect(-this.diamondSize/2, -this.diamondSize/2, this.diamondSize, this.diamondSize);
                ctx.restore();
            }
        }
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(0, 0, this.innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#4b0082';
        ctx.fill();
        
        // Draw decorative center with more detail
        ctx.beginPath();
        ctx.arc(0, 0, this.innerRadius * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        
        // Add a gold emblem in the center
        ctx.beginPath();
        ctx.arc(0, 0, this.innerRadius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFCC00';
        ctx.fill();
        
        // Add a decorative pattern in the center
        ctx.beginPath();
        const centerSize = this.innerRadius * 0.3;
        for (let i = 0; i < 8; i++) {
            const pointAngle = (i / 8) * 2 * Math.PI;
            const x = centerSize * Math.cos(pointAngle);
            const y = centerSize * Math.sin(pointAngle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        
        ctx.restore();
    }

    update(deltaTime) {
        if (this.isSpinning) {
            this.angle += this.rotationSpeed;
            
            // Calculate elapsed time since spinning started
            const currentTime = performance.now();
            const elapsedTime = currentTime - this.spinStartTime;
            
            // For the first 4 seconds, maintain a steady or slightly decreasing speed
            if (elapsedTime < 4000) {
                // Slight decrease over time for realism
                this.rotationSpeed = this.maxRotationSpeed * (1 - (elapsedTime / 12000));
            } else {
                // In the last 2 seconds, decelerate more rapidly to a stop
                const remainingTime = this.spinDuration - elapsedTime;
                if (remainingTime > 0) {
                    // Non-linear deceleration for smooth stopping
                    const decelerationFactor = (remainingTime / 2000) * (remainingTime / 2000);
                    this.rotationSpeed = this.maxRotationSpeed * 0.7 * decelerationFactor;
                } else {
                    // Stop the wheel when time is up
                    this.rotationSpeed = 0;
                    this.isSpinning = false;
                    this.determineWinningNumber();
                }
            }
            
            // Keep angle within 0-2π range
            if (this.angle >= 2 * Math.PI) {
                this.angle -= 2 * Math.PI;
            }
        }
    }

    spin() {
        if (!this.isSpinning) {
            // Random spin speed
            this.rotationSpeed = this.maxRotationSpeed * (0.7 + Math.random() * 0.3);
            this.isSpinning = true;
            this.spinStartTime = performance.now();
            
            // Update status
            document.getElementById('status').textContent = 'Wheel is spinning...';
            
            // Play wheel sound
            const wheelSound = document.getElementById('wheelSpinningSound');
            if (wheelSound) {
                wheelSound.currentTime = 0;
                wheelSound.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    }

    getWinningPocketIndex() {
        // Calculate the position opposite to the fixed point (top of wheel)
        // We need a negative angle because the wheel rotates clockwise in our coordinate system
        const normalizedAngle = -this.angle % (2 * Math.PI);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
        
        // Find the pocket index that contains this angle
        let index = Math.floor(positiveAngle / this.sectionAngle);
        
        // Adjust the index to account for the direction of rotation
        index = (this.numbers.length - index) % this.numbers.length;
        
        return index;
    }

    determineWinningNumber() {
        const index = this.getWinningPocketIndex();
        const winningNumber = this.numbers[index];
        
        // Update the UI
        document.getElementById('lastNumber').textContent = winningNumber;
        document.getElementById('status').textContent = 'Ball landed on ' + winningNumber;
        
        return winningNumber;
    }

    reset() {
        this.angle = 0;
        this.rotationSpeed = 0;
        this.isSpinning = false;
        document.getElementById('status').textContent = 'Ready to spin';
        document.getElementById('lastNumber').textContent = '-';
    }
    
    getInnerRadius() {
        return this.innerRadius;
    }
    
    getOuterRadius() {
        return this.outerRadius;
    }
    
    getRotationSpeed() {
        return this.rotationSpeed;
    }
    
    getAngle() {
        return this.angle;
    }
}

export default Wheel;