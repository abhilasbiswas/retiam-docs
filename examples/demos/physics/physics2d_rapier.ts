import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_rapier.ts
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Circle,
    Rect,
    OrbitCameraController
} from "retiam";
import { Physics2D } from "retiam/physics";

export default class Rapier2DScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;
        this.camera.position.set([0, 0, 18]);
        frameStage(this, 26, 25);
        demoCaption(this, "Bouncing marbles", "High-speed contacts with continuous collision detection");

        // 1. Initialize High-Density 2D Physics powered by Rapier2D WASM
        const physics = new Physics2D(this, {
            backend: 'rapier',
            gravity: [0, -9.8]
        });

        // 2. Static Boundaries
        const floor = new Rect(20, 0.5);
        floor.transform.position = new Vec3(0, -6, 0);
        floor.paint.fill = new Color(0.2, 0.25, 0.35, 1.0);
        physics.add(floor, 'static');

        const leftWall = new Rect(0.5, 14);
        leftWall.transform.position = new Vec3(-9.5, 0, 0);
        physics.add(leftWall, 'static');

        const rightWall = new Rect(0.5, 14);
        rightWall.transform.position = new Vec3(9.5, 0, 0);
        physics.add(rightWall, 'static');

        // 3. Falling high-speed bouncing marbles
        const colors = [
            new Color(0.95, 0.25, 0.45, 1.0),
            new Color(0.2, 0.75, 1.0, 1.0),
            new Color(1.0, 0.8, 0.1, 1.0),
            new Color(0.3, 0.9, 0.5, 1.0)
        ];

        for (let i = 0; i < 40; i++) {
            const r = 0.3 + Math.random() * 0.25;
            const ball = new Circle(r);
            ball.paint.fill = colors[i % colors.length];
            ball.transform.position = new Vec3(
                (Math.random() - 0.5) * 14,
                2 + i * 0.4,
                0
            );

            physics.add(ball, {
                motion: 'dynamic',
                restitution: 0.75,
                friction: 0.1,
                ccd: true
            });
        }
    }
}
