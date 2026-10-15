import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Box, Color, OrbitCameraController, Scene, Sphere, Vec3 } from "retiam";
import { Physics3D } from "retiam/physics";

export default class PhysicsShowcaseScene extends Scene {
    private physics!: Physics3D;

    public async run() {
        // 1. Setup Camera
        this.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 15, 40]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 5, 0) });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Rigid-body dynamics", "A live simulation of contact and momentum");

        // 2. Initialize Physics3D (automatically steps with render loop and scales with timeScale)
        this.physics = new Physics3D(this, {
            backend: 'rapier',
            gravity: [0, -20, 0], // Slightly heavier gravity for snappier falls
        });

        // 3. Create the Environment
        this.createGround();
        this.createBoxWall();

        // 4. Wait a moment, then fire the wrecking ball!
        await this.wait(1000);
        this.fireProjectile();

        // 5. Add a cinematic slow-mo effect right as the ball hits
        await this.wait(400);
    }

    private createGround() {
        const ground = new Box(50, 1, 50, {
            materialColor: new Color(0.12, 0.18, 0.27, 1.0),
        });
        ground.transform.position = new Vec3(0, -0.5, 0);
        this.physics.add(ground, 'static');
    }

    private createBoxWall() {
        const rows = 6;
        const boxSize = 2;
        const halfSize = boxSize / 2;

        for (let y = 0; y < rows; y++) {
            const boxesInRow = rows - y;
            const startX = -((boxesInRow - 1) * boxSize) / 2;

            for (let x = 0; x < boxesInRow; x++) {
                // Generate a nice gradient color from bottom to top
                const r = 1.0 - (y / rows);
                const b = 0.5 + (x / rows) * 0.5;

                const box = new Box(boxSize, boxSize, boxSize, {
                    materialColor: new Color(r, 0.2, b, 1),
                });

                const px = startX + x * boxSize;
                const py = halfSize + y * boxSize;
                const pz = 0;

                box.transform.position = new Vec3(px, py, pz);

                this.physics.add(box, {
                    type: 'dynamic',
                    mass: 2,
                    linearDamping: 0.1,
                    angularDamping: 0.1,
                });
            }
        }
    }

    private fireProjectile() {
        const radius = 2.5;

        const ball = new Sphere(radius, {
            widthSegments: 64,
            heightSegments: 20,
            materialColor: new Color(1.0, 0.8, 0.1, 1.0), // Gold
            roughness: 0.2,
            metallic: 0.8, // Shiny metal
            transmission: 0.0,
        });
        ball.transform.position = new Vec3(0, 6, 25);

        // Add to scene & physics with initial linear velocity
        this.physics.add(ball, {
            type: 'dynamic',
            mass: 50, // Heavy wrecking ball
            velocity: [0, 2, -50],
        });
    }
}
