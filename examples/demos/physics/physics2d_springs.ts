import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_springs.ts
// 2D Spring & Elastic Constraint Simulation
// Demonstrating the generic Spring entity with coils, bungees, trampoline, and multi-spring chains
// Powered by Rapier2D & Planck.js spring dynamics in Retiam
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Rect,
    Circle,
    VectorEntity,
    Spring
} from "retiam";
import { Physics2D } from "retiam/physics";

export default class Physics2DSpringsScene extends Scene {
    private physics!: Physics2D;
    private dynamicObjects: VectorEntity[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // Position camera to frame the full spring playground
        this.camera.position.set([0, 0, 32]);
        frameStage(this, 57, 45);
        demoCaption(this, "Springs and oscillation", "Elastic constraints transfer energy between bodies");

        // 1. Initialize 2D Physics engine ('rapier' or 'planck')
        const physics = new Physics2D(this, {
            backend: "planck",
            gravity: [0, -9.8]
        });
        this.physics = physics;

        // 2. Static Boundaries
        const floor = new Rect(40, 0.4);
        floor.transform.position = new Vec3(0, -14, 0);
        floor.paint.fill = new Color(0.2, 0.25, 0.32, 1.0);
        physics.add(floor, "static");

        // Top structural mounting beam
        const ceilingBeam = new Rect(36, 0.5);
        ceilingBeam.transform.position = new Vec3(0, 13.5, 0);
        ceilingBeam.paint.fill = new Color(0.25, 0.30, 0.38, 1.0);
        physics.add(ceilingBeam, "static");

        // =====================================================================
        // SECTION A: Suspended Elastic Trampoline / Bouncing Bed
        // =====================================================================
        const trampolineLeftAnchor = new Rect(0.6, 0.6);
        trampolineLeftAnchor.transform.position = new Vec3(-9.0, 3.0, 0);
        trampolineLeftAnchor.paint.fill = new Color(0.4, 0.45, 0.55, 1.0);
        physics.add(trampolineLeftAnchor, "static");

        const trampolineRightAnchor = new Rect(0.6, 0.6);
        trampolineRightAnchor.transform.position = new Vec3(9.0, 3.0, 0);
        trampolineRightAnchor.paint.fill = new Color(0.4, 0.45, 0.55, 1.0);
        physics.add(trampolineRightAnchor, "static");

        // Flexible trampoline platform
        const platform = new Rect(13.0, 0.6);
        platform.transform.position = new Vec3(0, -1.0, 0);
        platform.paint.fill = new Color(0.15, 0.68, 0.88, 1.0); // Vibrant teal
        physics.add(platform, {
            motion: "dynamic",
            density: 4.2,
            friction: 0.6,
            restitution: 0.5,
            fixedRotation: false,
            ccd: true
        });

        // Left diagonal coiled spring
        physics.addSpring(trampolineLeftAnchor, platform, {
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: -6.0, y: 0 },
            length: 5.0,
            frequencyHz: 1.0,
            dampingRatio: 0.15,
            coils: 10,
            radius: 0.35,
            stroke: new Color(0.15, 0.68, 0.88, 1.0),
            strokeWidth: 0.08
        });

        // Right diagonal coiled spring
        physics.addSpring(trampolineRightAnchor, platform, {
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 6.0, y: 0 },
            length: 5.0,
            frequencyHz: 1.0,
            dampingRatio: 0.15,
            coils: 10,
            radius: 0.35,
            stroke: new Color(0.15, 0.68, 0.88, 1.0),
            strokeWidth: 0.08
        });

        // =====================================================================
        // SECTION B: Suspended Spring Bungees & Harmonic Pendulums
        // =====================================================================

        // 1. Soft, High-Bounce Bungee (Left)
        const bob1 = new Circle(1.2);
        bob1.transform.position = new Vec3(-12.0, 4.0, 0);
        bob1.paint.fill = new Color(0.96, 0.35, 0.22, 1.0); // Coral red
        physics.add(bob1, { motion: "dynamic", density: 1.5, restitution: 0.4, friction: 0.3, ccd: true });
        this.dynamicObjects.push(bob1);

        const anchor1 = new Rect(0.5, 0.5);
        anchor1.transform.position = new Vec3(-12.0, 13.5, 0);
        anchor1.paint.fill = new Color(0.6, 0.6, 0.7, 1.0);
        physics.add(anchor1, "static");

        physics.addSpring(anchor1, bob1, {
            length: 6.5,
            frequencyHz: 2.2,
            dampingRatio: 0.04,
            coils: 12,
            radius: 0.4,
            stroke: new Color(0.96, 0.35, 0.22, 1.0),
            strokeWidth: 0.08
        });

        // 2. Medium Damped Spring (Right)
        const bob2 = new Circle(1.3);
        bob2.transform.position = new Vec3(12.0, 4.0, 0);
        bob2.paint.fill = new Color(0.98, 0.75, 0.15, 1.0); // Amber yellow
        physics.add(bob2, { motion: "dynamic", density: 2.5, restitution: 0.3, friction: 0.4, ccd: true });
        this.dynamicObjects.push(bob2);

        const anchor2 = new Rect(0.5, 0.5);
        anchor2.transform.position = new Vec3(12.0, 13.5, 0);
        anchor2.paint.fill = new Color(0.6, 0.6, 0.7, 1.0);
        physics.add(anchor2, "static");

        physics.addSpring(anchor2, bob2, {
            length: 6.5,
            frequencyHz: 4.2,
            dampingRatio: 0.15,
            coils: 14,
            radius: 0.35,
            stroke: new Color(0.98, 0.75, 0.15, 1.0),
            strokeWidth: 0.08
        });

        // 3. Double-Spring Chain (Center-Top: Anchor -> Link1 -> Link2)
        const chainAnchor = new Rect(0.5, 0.5);
        chainAnchor.transform.position = new Vec3(0, 13.5, 0);
        chainAnchor.paint.fill = new Color(0.6, 0.6, 0.7, 1.0);
        physics.add(chainAnchor, "static");

        const link1 = new Circle(0.9);
        link1.transform.position = new Vec3(0, 9.5, 0);
        link1.paint.fill = new Color(0.60, 0.35, 0.85, 1.0); // Purple
        physics.add(link1, { motion: "dynamic", density: 1.8, restitution: 0.3, ccd: true });
        this.dynamicObjects.push(link1);

        const link2 = new Circle(1.0);
        link2.transform.position = new Vec3(1.5, 5.5, 0);
        link2.paint.fill = new Color(0.20, 0.80, 0.40, 1.0); // Emerald green
        physics.add(link2, { motion: "dynamic", density: 2.0, restitution: 0.3, ccd: true });
        this.dynamicObjects.push(link2);

        // First link in chain (zigzag coil)
        physics.addSpring(chainAnchor, link1, {
            length: 3.5,
            frequencyHz: 4.5,
            dampingRatio: 0.08,
            coils: 8,
            radius: 0.3,
            stroke: new Color(0.60, 0.35, 0.85, 1.0),
            strokeWidth: 0.08
        });

        // Second link in chain (exhibits chaotic double-pendulum bouncing)
        physics.addSpring(link1, link2, {
            length: 3.5,
            frequencyHz: 3.5,
            dampingRatio: 0.06,
            coils: 8,
            radius: 0.3,
            stroke: new Color(0.20, 0.80, 0.40, 1.0),
            strokeWidth: 0.08
        });

        // =====================================================================
        // SECTION C: Initial Bouncing Ball Dropping onto Trampoline
        // =====================================================================
        const starterBall = new Circle(1.6);
        starterBall.transform.position = new Vec3(0, 10.0, 0);
        starterBall.paint.fill = new Color(0.95, 0.26, 0.45, 1.0); // Hot pink
        physics.add(starterBall, {
            motion: "dynamic",
            density: 3.0,
            restitution: 0.8, // Super elastic
            friction: 0.2,
            ccd: true
        });
        this.dynamicObjects.push(starterBall);

        // =====================================================================
        // SECTION D: Mouse Interactivity (Click to spawn balls and boxes)
        // =====================================================================
        const colors = [
            new Color(0.95, 0.26, 0.21, 1.0),
            new Color(0.98, 0.55, 0.00, 1.0),
            new Color(1.00, 0.84, 0.00, 1.0),
            new Color(0.30, 0.75, 0.35, 1.0),
            new Color(0.00, 0.72, 0.83, 1.0),
            new Color(0.13, 0.59, 0.95, 1.0),
            new Color(0.61, 0.35, 0.71, 1.0)
        ];

        this.setEvent("click", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            const isRightClick = (event as PointerEvent).button === 2;
            if (isRightClick) {
                // Spawn a bouncing crate
                const box = new Rect(1.4, 1.4);
                box.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                box.transform.setRotationZ(Math.random() * Math.PI);
                box.paint.fill = colors[Math.floor(Math.random() * colors.length)];
                physics.add(box, { motion: "dynamic", density: 2.0, restitution: 0.6, friction: 0.3, ccd: true });
                this.dynamicObjects.push(box);
            } else {
                // Spawn a bouncing marble
                const r = 0.8 + Math.random() * 0.6;
                const marble = new Circle(r);
                marble.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                marble.paint.fill = colors[Math.floor(Math.random() * colors.length)];
                physics.add(marble, { motion: "dynamic", density: 2.5, restitution: 0.85, friction: 0.1, ccd: true });
                this.dynamicObjects.push(marble);
            }
        });

        // Cleanup off-screen falling objects
        const cleanupThresholdY = -25;
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
