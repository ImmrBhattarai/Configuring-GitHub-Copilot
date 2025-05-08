# Roulette Wheel Physics Simulation

A realistic physics-based simulation of a casino roulette wheel using HTML5 Canvas, CSS, and JavaScript.

## Features

- Realistic roulette wheel with European layout (0-36)
- Physically accurate ball movement with proper collision detection
- Simulation of centrifugal forces, friction, and gravity
- Realistic wheel deceleration
- Sound effects for immersion
- Responsive design that works on different screen sizes

## Physics Principles

This simulation implements several physics principles to create a realistic roulette wheel:

### 1. Momentum and Inertia

The wheel has angular momentum based on its rotational speed, and it gradually slows down due to friction. The ball has linear momentum based on its velocity and mass.

### 2. Centrifugal Force

When the ball moves around the wheel, it experiences a centrifugal force pushing it outward, calculated as:

```
F = m * v² / r
```

Where:
- m = mass of the ball
- v = tangential velocity
- r = radius of the ball's path

### 3. Friction

Surface friction affects both the wheel's rotation and the ball's movement. It's calculated using a friction coefficient that gradually reduces velocity:

```
v' = v * friction_coefficient
```

### 4. Air Resistance

The ball experiences air resistance proportional to the square of its velocity:

```
F_drag = 0.5 * ρ * v² * C_d * A
```

Where:
- ρ = air density (approximately 1.225 kg/m³)
- v = velocity
- C_d = drag coefficient (approximately 0.47 for a sphere)
- A = cross-sectional area of the ball

### 5. Collision Detection and Response

The simulation uses elastic collisions with restitution to model the ball bouncing off the walls of the wheel:

```
v' = v - (1 + e)(v·n)n
```

Where:
- v' = velocity after collision
- v = velocity before collision
- e = coefficient of restitution
- n = normal vector at the collision point

## How to Use

1. Open the `index.html` file in a modern web browser
2. Click the "Spin Roulette" button to start the simulation
3. Watch the wheel spin and the ball move around the wheel
4. The result will be displayed once the ball settles in a pocket
5. Click the "Reset" button to prepare for another spin

## Technical Implementation

The simulation is built using:

- **HTML5 Canvas** for rendering the wheel and ball
- **JavaScript** for physics calculations and animation
- **CSS** for styling and layout
- **RequestAnimationFrame API** for smooth animation

The code is organized into several modules:

- `main.js`: Game loop and initialization
- `wheel.js`: Wheel rendering and physics
- `ball.js`: Ball rendering and physics
- `physics.js`: Physics calculations and utilities

## License

This project is open source and available for educational purposes.