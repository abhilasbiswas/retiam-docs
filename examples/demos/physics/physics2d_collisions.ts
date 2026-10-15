import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_collisions.ts
// Collision Events & Contact Listeners Showcase
// Demonstrating impact detection, reactive bumpers, and sensor triggers
// Powered by Retiam 2D Physics (supports Planck & Rapier)
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Rect,
    Circle,
    VectorEntity
} from "retiam";
import { Physics2D, Collision2DEvent } from "retiam/physics";

export default class Physics2DCollisionsScene extends Scene {
    private physics!: Physics2D;
    private dynamicBalls: Circle[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // Position camera to frame the pinball / bumper field
        this.camera.position.set([0, 0, 38]);
        frameStage(this, 46, 44);
        demoCaption(this, "Collision events", "Drag or drop a ball into the reactive bumpers");

        // 1. Initialize 2D Physics engine ('planck' or 'rapier')
        const physics = new Physics2D(this, {
            backend: "rapier",
            gravity: [0, -9.8]
        });
        this.physics = physics;

        // Optional mouse grabbing so user can fling balls into bumpers
        physics.enableMouseDrag({ frequencyHz: 6.0, dampingRatio: 0.6 });

        // 2. Static Boundaries
        const floor = new Rect(36, 0.6);
        floor.transform.position = new Vec3(0, -16, 0);
        floor.paint.fill = new Color(0.15, 0.18, 0.25, 1.0);
        physics.add(floor, "static");

        const leftWall = new Rect(0.6, 32);
        leftWall.transform.position = new Vec3(-18, 0, 0);
        leftWall.paint.fill = new Color(0.15, 0.18, 0.25, 1.0);
        physics.add(leftWall, "static");

        const rightWall = new Rect(0.6, 32);
        rightWall.transform.position = new Vec3(18, 0, 0);
        rightWall.paint.fill = new Color(0.15, 0.18, 0.25, 1.0);
        physics.add(rightWall, "static");

        // Funnel guides
        const funnelLeft = new Rect(14, 0.4);
        funnelLeft.transform.position = new Vec3(-11, 8, 0);
        funnelLeft.transform.setRotationZ(-0.4);
        funnelLeft.paint.fill = new Color(0.25, 0.30, 0.40, 1.0);
        physics.add(funnelLeft, "static");

        const funnelRight = new Rect(14, 0.4);
        funnelRight.transform.position = new Vec3(11, 8, 0);
        funnelRight.transform.setRotationZ(0.4);
        funnelRight.paint.fill = new Color(0.25, 0.30, 0.40, 1.0);
        physics.add(funnelRight, "static");

        // 3. Reactive Pinball Bumpers (Interactive Obstacles)
        const bumperColors = [
            new Color(0.00, 0.85, 0.95, 1.0), // Neon Cyan
            new Color(0.95, 0.20, 0.70, 1.0), // Neon Pink
            new Color(0.98, 0.80, 0.15, 1.0), // Neon Gold
            new Color(0.20, 0.88, 0.45, 1.0)  // Neon Green
        ];

        const bumperPositions = [
            { x: 0, y: 3, radius: 1.8, colorIdx: 0 },
            { x: -7, y: -2, radius: 1.5, colorIdx: 1 },
            { x: 7, y: -2, radius: 1.5, colorIdx: 1 },
            { x: 0, y: -7, radius: 2.0, colorIdx: 2 },
            { x: -10, y: -10, radius: 1.4, colorIdx: 3 },
            { x: 10, y: -10, radius: 1.4, colorIdx: 3 }
        ];

        const bumpers: Circle[] = [];

        for (const info of bumperPositions) {
            const bumper = new Circle(info.radius);
            bumper.transform.position = new Vec3(info.x, info.y, 0);
            const baseColor = bumperColors[info.colorIdx];
            bumper.paint.fill = new Color(baseColor.r * 0.3, baseColor.g * 0.3, baseColor.b * 0.3, 1.0);
            bumper.paint.stroke = baseColor;
            bumper.paint.strokeWidth = 0.08;

            const bComp = physics.add(bumper, {
                motion: "static",
                restitution: 1.2, // High bounciness bumper!
                friction: 0.1
            });

            // Entity-level collision listener: Flash bumper brightly on impact
            let flashTimer: any = null;
            bComp.onCollisionStart((_other, _event) => {
                bumper.paint.fill = baseColor;
                bumper.paint.stroke = new Color(1, 1, 1, 1);
                bumper.paint.strokeWidth = 0.20;

                if (flashTimer) clearTimeout(flashTimer);
                flashTimer = setTimeout(() => {
                    bumper.paint.fill = new Color(baseColor.r * 0.3, baseColor.g * 0.3, baseColor.b * 0.3, 1.0);
                    bumper.paint.stroke = baseColor;
                    bumper.paint.strokeWidth = 0.08;
                }, 180);
            });

            bumpers.push(bumper);
        }

        // 4. Global Collision Listener: Color-shift balls upon hitting any obstacle
        physics.on("collisionStart", (event: Collision2DEvent) => {
            const isBumperA = bumpers.includes(event.entityA as Circle);
            const isBumperB = bumpers.includes(event.entityB as Circle);

            if (isBumperA || isBumperB) {
                const ball = (isBumperA ? event.entityB : event.entityA) as VectorEntity;
                if (ball && ball.paint) {
                    // Randomize ball color on bumper strike
                    const randomColor = bumperColors[Math.floor(Math.random() * bumperColors.length)];
                    ball.paint.fill = randomColor;
                    ball.paint.stroke = new Color(1, 1, 1, 0.8);
                    ball.paint.strokeWidth = 0.08;
                }
            }
        });

        // 5. Spawning Balls Function
        const spawnBall = (x: number, y: number) => {
            const ball = new Circle(1.0 + Math.random() * 0.4);
            ball.transform.position = new Vec3(x, y, 0);
            ball.paint.fill = new Color(0.95, 0.95, 0.95, 1.0);
            physics.add(ball, {
                motion: "dynamic",
                density: 2.5,
                restitution: 0.85,
                friction: 0.2,
                ccd: true
            });
            this.dynamicBalls.push(ball);
        };

        // Spawn initial cluster of balls above the funnel
        for (let i = 0; i < 5; i++) {
            spawnBall((i - 2) * 2.5, 14 + i * 1.2);
        }

        // 6. Interactive Click to spawn more balls
        this.setEvent("click", (worldPos: Vec3) => {
            spawnBall(worldPos.x, worldPos.y);
        });

        // Periodic recycling of balls that reach bottom
        this.always(() => {
            for (let i = this.dynamicBalls.length - 1; i >= 0; i--) {
                const b = this.dynamicBalls[i];
                if (b.transform.position.y < -15.5) {
                    const comp = physics.getBody(b);
                    if (comp) {
                        // Respawn ball back at the top
                        b.transform.position.set([(Math.random() - 0.5) * 6, 15, 0]);
                        comp.setVelocity([ (Math.random() - 0.5) * 4, -2 ]);
                    }
                }
            }
        });
    }
}
