import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_seesaw.ts
// Classic Box2D / Rapier2D Seesaw (Teeter-Totter) Benchmark
// Demonstrating Revolute Joint constraints, leverage, and momentum transfer
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Rect,
    Circle,
    VectorEntity
} from "retiam";
import { Physics2D } from "retiam/physics";

export default class Physics2DSeesawScene extends Scene {
    private physics!: Physics2D;
    private dynamicObjects: VectorEntity[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // Position camera to frame the entire tower, seesaw, and ground comfortably
        this.camera.position.set([0, 0, 52]);
        frameStage(this, 50, 65, 15);
        demoCaption(this, "Leverage and momentum", "Click for a block · right-click for a heavy ball");

        // 1. Initialize 2D Physics (supports 'rapier' or 'planck')
        const physics = new Physics2D(this, {
            backend: 'rapier',
            gravity: [0, -9.8]
        });
        this.physics = physics;

        // 2. Static Ground Line
        const ground = new Rect(40, 0.12);
        ground.transform.position = new Vec3(0, -9.0, 0);
        ground.paint.fill = new Color(0.85, 0.85, 0.85, 1.0);
        physics.add(ground, "static");

        // 3. Mechanical Stops & Supports (Outlined Rectangles)
        // Left Rest Stand (mechanical stop underneath the left arm)
        const leftStand = new Rect(0.9, 3.0);
        leftStand.transform.position = new Vec3(-6.2, -7.5, 0);
        leftStand.paint.fill = new Color(1, 1, 1, 0.0);
        leftStand.paint.stroke = new Color(0.82, 0.82, 0.82, 1.0);
        leftStand.paint.strokeWidth = 0.08;
        physics.add(leftStand, "static");

        // Center Fulcrum Stand (pivot post)
        const fulcrumStand = new Rect(0.9, 4.5);
        fulcrumStand.transform.position = new Vec3(0.6, -6.75, 0);
        fulcrumStand.paint.fill = new Color(1, 1, 1, 0.0);
        fulcrumStand.paint.stroke = new Color(0.82, 0.82, 0.82, 1.0);
        fulcrumStand.paint.strokeWidth = 0.08;
        physics.add(fulcrumStand, "static");

        // Visual Hinge Pin Circle at pivot center
        const pivotHinge = new Circle(0.16);
        pivotHinge.transform.position = new Vec3(0.6, -4.5, 0.1);
        pivotHinge.paint.fill = new Color(1, 1, 1, 0.0);
        pivotHinge.paint.stroke = new Color(0.75, 0.75, 0.75, 1.0);
        pivotHinge.paint.strokeWidth = 0.06;
        this.add(pivotHinge);

        // 4. Seesaw Plank
        const plank = new Rect(17.5, 1.1);
        plank.transform.position = new Vec3(0.6, -4.5, 0);
        // Initially tilted down to the right touching the ground/ball
        plank.transform.setRotationZ(-0.24);
        plank.paint.fill = new Color(0.96, 0.80, 0.30, 1.0); // Golden yellow
        physics.add(plank, {
            motion: "dynamic",
            density: 1.5,
            restitution: 0.1,
            friction: 0.6,
            ccd: true
        });

        // Revolute Joint linking fulcrumStand and plank at the pivot anchor
        physics.addRevoluteJoint(fulcrumStand, plank, {
            worldAnchor: { x: 0.6, y: -4.5 },
            collideConnected: false
        });

        // 5. Large Heavy Ball on the Right Side
        const ball = new Circle(2.4);
        ball.transform.position = new Vec3(8.2, 40.6, 0);
        ball.paint.fill = new Color(0.96, 0.35, 0.22, 1.0); // Coral red-orange
        physics.add(ball, {
            motion: "dynamic",
            density: 8.0, // Heavy mass holding down the right end
            restitution: 0.3,
            friction: 0.7,
            ccd: true
        });
        this.dynamicObjects.push(ball);

        // 6. Falling Tower of 6 Tumbling Blocks (matching the screenshot)
        const blockData = [
            // Bottom to top:
            { x: -3.8, y: 1.0, rot: 0.05, color: new Color(0.95, 0.58, 0.22, 1.0) },  // Warm orange (bottom)
            { x: -3.3, y: 2.8, rot: -0.32, color: new Color(0.92, 0.35, 0.22, 1.0) }, // Coral red-orange
            { x: -4.6, y: 4.5, rot: 0.25, color: new Color(0.95, 0.58, 0.22, 1.0) },  // Warm orange
            { x: -5.1, y: 6.2, rot: 0.28, color: new Color(0.92, 0.35, 0.22, 1.0) },  // Coral red-orange
            { x: -5.8, y: 7.9, rot: 0.30, color: new Color(0.96, 0.78, 0.28, 1.0) },  // Golden yellow
            { x: -6.4, y: 9.6, rot: 0.32, color: new Color(0.08, 0.25, 0.46, 1.0) }   // Navy blue (top)
        ];

        for (const data of blockData) {
            const block = new Rect(1.5, 1.5);
            block.transform.position = new Vec3(data.x, data.y, 0);
            block.transform.setRotationZ(data.rot);
            block.paint.fill = data.color;
            physics.add(block, {
                motion: "dynamic",
                density: 3.0, // Kinetic energy of the falling stack triggers the catapult
                restitution: 0.1,
                friction: 0.5,
                ccd: true
            });
            this.dynamicObjects.push(block);
        }

        // 7. Mouse Interactivity: Click to drop additional blocks or heavy balls
        this.setEvent("click", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            const isRightClick = (event as PointerEvent).button === 2;
            if (isRightClick) {
                // Spawn a heavy ball
                const spawnBall = new Circle(1.2);
                spawnBall.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                spawnBall.paint.fill = new Color(0.96, 0.35, 0.22, 1.0);
                physics.add(spawnBall, { motion: "dynamic", density: 4.0, restitution: 0.4, friction: 0.5 });
                this.dynamicObjects.push(spawnBall);
            } else {
                // Spawn a colored block
                const spawnBlock = new Rect(1.4, 1.4);
                spawnBlock.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                spawnBlock.transform.setRotationZ(Math.random() * Math.PI);
                const colors = [
                    new Color(0.08, 0.25, 0.46, 1.0),
                    new Color(0.96, 0.78, 0.28, 1.0),
                    new Color(0.92, 0.35, 0.22, 1.0),
                    new Color(0.95, 0.58, 0.22, 1.0)
                ];
                spawnBlock.paint.fill = colors[Math.floor(Math.random() * colors.length)];
                physics.add(spawnBlock, { motion: "dynamic", density: 2.5, restitution: 0.2, friction: 0.5 });
                this.dynamicObjects.push(spawnBlock);
            }
        });

        // 8. Automatic Boundary Cleanup
        const cleanupThresholdY = -35;
        this.always(() => {
            for (let i = this.dynamicObjects.length - 1; i >= 0; i--) {
                const obj = this.dynamicObjects[i];
                if (obj.transform.position.y < cleanupThresholdY) {
                    physics.remove(obj, true);
                    this.dynamicObjects.splice(i, 1);
                }
            }
        });
    }
}
