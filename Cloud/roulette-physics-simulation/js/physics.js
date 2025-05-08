class Physics {
    constructor() {
        // Physics constants
        this.gravity = 9.81; // m/s^2
        this.airDensity = 1.225; // kg/m^3
        this.dragCoefficient = 0.47; // For a sphere
    }

    // Calculate the gravitational force (F = mg)
    calculateGravity(mass) {
        return mass * this.gravity;
    }

    // Calculate drag force: F_drag = 0.5 * ρ * v^2 * C_d * A
    calculateDragForce(velocity, crossSectionalArea, mass) {
        const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y;
        const speed = Math.sqrt(speedSquared);
        
        if (speed === 0) return { x: 0, y: 0 };
        
        const dragMagnitude = 0.5 * this.airDensity * speedSquared * this.dragCoefficient * crossSectionalArea;
        
        // Normalize velocity and multiply by drag force magnitude
        return {
            x: -(velocity.x / speed) * dragMagnitude,
            y: -(velocity.y / speed) * dragMagnitude
        };
    }

    // Calculate the centrifugal force: F = m * v^2 / r
    calculateCentrifugalForce(mass, tangentialVelocity, radius) {
        if (radius === 0) return 0;
        return mass * (tangentialVelocity * tangentialVelocity) / radius;
    }

    // Calculate angular momentum: L = I * ω
    calculateAngularMomentum(momentOfInertia, angularVelocity) {
        return momentOfInertia * angularVelocity;
    }

    // Calculate moment of inertia for a sphere: I = (2/5) * m * r^2
    calculateMomentOfInertia(mass, radius) {
        return (2/5) * mass * radius * radius;
    }

    // Calculate collision response between a circle and a line segment
    resolveCollision(position, velocity, normal, restitution) {
        // Calculate the dot product of velocity and normal
        const dotProduct = velocity.x * normal.x + velocity.y * normal.y;
        
        // Only reflect if objects are moving toward each other
        if (dotProduct < 0) {
            // Apply reflection with restitution
            return {
                x: velocity.x - (1 + restitution) * dotProduct * normal.x,
                y: velocity.y - (1 + restitution) * dotProduct * normal.y
            };
        }
        
        return velocity;
    }

    // Distance between two points
    calculateDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate angular velocity from linear velocity and radius: ω = v/r
    linearToAngularVelocity(linearVelocity, radius) {
        if (radius === 0) return 0;
        return linearVelocity / radius;
    }

    // Calculate linear velocity from angular velocity and radius: v = ω * r
    angularToLinearVelocity(angularVelocity, radius) {
        return angularVelocity * radius;
    }
}

export default Physics;