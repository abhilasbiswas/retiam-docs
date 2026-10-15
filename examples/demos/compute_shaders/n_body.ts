import { Circle, Vec3, Scene, CameraController, Builder, Path, Color, TracePath } from "retiam";
import { demoBackground } from "../../shared/presentation";

// Simple interface to keep track of our physics properties
interface BodyData {
    entity: Circle;
    velocity: Vec3;
    mass: number;
    radius: number;
}

export default class NBodyScene extends Scene {
    private bodies: BodyData[] = [];

    // Physics constants
    private readonly GRAVITY = 100.0;
    private readonly SOFTENING = 3.0; // Prevents infinite forces when bodies overlap
    private readonly NUM_BODIES = 4; // Lowered slightly so trails don't overwhelm the screen

    // Bounding Box dimensions
    private readonly BOX_WIDTH = 120;
    private readonly BOX_HEIGHT = 90;

    public async run() {
        this.bodies = [];

        // this.skip(10000)
        // 1. Setup Camera
        this.camera.position.set([0, 0, 110]);
        new CameraController(this, this.camera);

        // Deepen the background to near-black navy to make neon colors pop!
        this.clearColor(demoBackground());

        // 2. THE BOUNDING BOX
        const boxBuilder = new Builder();
        boxBuilder.rect(-this.BOX_WIDTH / 2, -this.BOX_HEIGHT / 2, this.BOX_WIDTH, this.BOX_HEIGHT);

        const boundingBox = new Path(boxBuilder.toString());
        boundingBox.paint.fill = Color.NONE;
        boundingBox.paint.stroke = new Color(1.0, 1.0, 1.0, 0.15); // Subtle boundary
        boundingBox.paint.strokeWidth = 0.5;
        this.add(boundingBox);

        // A curated palette of highly vibrant, cyberpunk/neon colors
        const vibrantColors = [
            new Color(1.0, 0.1, 0.5, 1.0), // Neon Pink
            new Color(0.0, 0.8, 1.0, 1.0), // Electric Cyan
            new Color(1.0, 0.9, 0.0, 1.0), // Bright Yellow
            new Color(0.3, 1.0, 0.3, 1.0), // Lime Green
            new Color(0.7, 0.2, 1.0, 1.0), // Vivid Purple
            new Color(1.0, 0.4, 0.0, 1.0)  // Neon Orange
        ];

        // 3. SPAWN N-BODIES AND TRACE LINES
        for (let i = 0; i < this.NUM_BODIES; i++) {
            // Randomize mass (heavier bodies are larger)
            const mass = 1 + Math.random() * 2.0;
            const radius = Math.sqrt(mass);

            const circle = new Circle(radius);

            // Select a vibrant color from the palette, wrapping around if NUM_BODIES > palette size
            const color = vibrantColors[i % vibrantColors.length];

            circle.paint.fill = color;
            circle.paint.strokeWidth = 0; // No stroke for clean look

            // Randomize starting position within the box
            const startX = (Math.random() - 0.5) * (this.BOX_WIDTH - radius * 2);
            const startY = (Math.random() - 0.5) * (this.BOX_HEIGHT - radius * 2);
            circle.transform.position = new Vec3(startX, startY, 0);

            this.add(circle);

            // --- ADD TRACE LINE ---
            const trail = new TracePath({
                target: circle,
                maxAge: 2000,       // Trail lasts 2.0 seconds before dissolving
                minDistance: 0.5,   // Drop an anchor point every 0.5 units of movement
                smoothing: 2,       // Apply Chaikin smoothing to the trail corners
                fadeLength: 0.9,    // Fade out over the last 90% of the trail
            });

            // Match the trail color to the body, but bump the alpha to 0.6 for a stronger glow
            trail.paint.stroke = new Color(color.r, color.g, color.b, 0.3);
            trail.paint.strokeWidth = radius * 1.2;
            this.add(trail);

            // Random initial velocity (swirling effect)
            const vx = (Math.random() - 0.5) * 15;
            const vy = (Math.random() - 0.5) * 15;

            this.bodies.push({
                entity: circle,
                velocity: new Vec3(vx, vy, 0),
                mass: mass,
                radius: radius
            });
        }

        // 4. THE PHYSICS UPDATE LOOP
        this.always(() => {
            // Convert scene delta time (ms) to seconds, capped to prevent explosions if tab lags
            const dt = Math.min(this.dt * 0.1, 0.1);

            // Step A: Calculate Gravity Forces O(N^2)
            for (let i = 0; i < this.NUM_BODIES; i++) {
                const b1 = this.bodies[i];
                let fx = 0;
                let fy = 0;

                for (let j = 0; j < this.NUM_BODIES; j++) {
                    if (i === j) continue;

                    const b2 = this.bodies[j];
                    const pos1 = b1.entity.transform.position;
                    const pos2 = b2.entity.transform.position;

                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distSq = dx * dx + dy * dy + this.SOFTENING;
                    const dist = Math.sqrt(distSq);

                    // F = G * (m1 * m2) / r^2
                    const force = (this.GRAVITY * b1.mass * b2.mass) / distSq;

                    fx += force * (dx / dist);
                    fy += force * (dy / dist);
                }

                // Apply Acceleration (a = F/m), updating velocity
                b1.velocity.x += (fx / b1.mass) * dt;
                b1.velocity.y += (fy / b1.mass) * dt;
            }

            // Step B: Integration & Bounding Box Collision
            for (let i = 0; i < this.NUM_BODIES; i++) {
                const b = this.bodies[i];
                const pos = b.entity.transform.position;

                pos.x += b.velocity.x * dt;
                pos.y += b.velocity.y * dt;

                // Box Collision limits
                const halfW = (this.BOX_WIDTH / 2) - b.radius;
                const halfH = (this.BOX_HEIGHT / 2) - b.radius;
                const bounciness = 0.9; // Lose 10% energy on wall hit

                if (pos.x < -halfW) {
                    pos.x = -halfW;
                    b.velocity.x *= -bounciness;
                } else if (pos.x > halfW) {
                    pos.x = halfW;
                    b.velocity.x *= -bounciness;
                }

                if (pos.y < -halfH) {
                    pos.y = -halfH;
                    b.velocity.y *= -bounciness;
                } else if (pos.y > halfH) {
                    pos.y = halfH;
                    b.velocity.y *= -bounciness;
                }

                // Push new transform to the WebGPU state
                b.entity.transform.position = pos;
            }

            // Mark scene as dirty so the GPU re-renders the updated positions
            this.invalidate();
        });
    }
}
