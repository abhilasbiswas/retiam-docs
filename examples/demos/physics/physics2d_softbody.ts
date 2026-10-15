import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_softbody.ts
// 2D Soft Body & Deformable Jelly Simulation
// Demonstrating spring-lattice deformable jelly polygons and pinned cloth
// Powered by Retiam 2D Physics (supports Planck & Rapier)
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Vec2,
    Rect,
    Circle,
    Poly
} from "retiam";
import { Physics2D } from "retiam/physics";

export default class Physics2DSoftBodyScene extends Scene {
    private physics!: Physics2D;

    public async run() {
        this.disablePlayer();
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // Position camera to frame the soft body playground comfortably
        this.camera.position.set([0, 0, 34]);
        frameStage(this, 54, 46);
        demoCaption(this, "Soft-body constraints", "Flexible shapes interact with rigid obstacles");

        // 1. Initialize 2D Physics engine ('rapier' or 'planck')
        const physics = new Physics2D(this, {
            backend: "rapier",
            gravity: [0, -9.8]
        });
        this.physics = physics;

        // Enable interactive pointer dragging so users can grab and stretch the jelly!
        physics.enableMouseDrag({ frequencyHz: 6.0, dampingRatio: 0.6 });

        // 2. Static Boundaries
        const floor = new Rect(36, 0.8);
        floor.transform.position = new Vec3(0, -13, 0);
        floor.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(floor, "static");

        const leftWall = new Rect(0.6, 28);
        leftWall.transform.position = new Vec3(-18, 0.5, 0);
        leftWall.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(leftWall, "static");

        const rightWall = new Rect(0.6, 28);
        rightWall.transform.position = new Vec3(18, 0.5, 0);
        rightWall.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(rightWall, "static");

        // Obstacle Pegs
        const peg1 = new Circle(1.2);
        peg1.transform.position = new Vec3(-6, -0.5, 0);
        peg1.paint.fill = new Color(0.35, 0.40, 0.50, 1.0);
        physics.add(peg1, "static");

        const peg2 = new Circle(1.2);
        peg2.transform.position = new Vec3(6, -0.5, 0);
        peg2.paint.fill = new Color(0.35, 0.40, 0.50, 1.0);
        physics.add(peg2, "static");

        const centralWedge = new Rect(8, 0.6);
        centralWedge.transform.position = new Vec3(0, -6.5, 0);
        centralWedge.transform.setRotationZ(0.2);
        centralWedge.paint.fill = new Color(0.35, 0.40, 0.50, 1.0);
        physics.add(centralWedge, "static");

        // =====================================================================
        // SECTION A: Free-Falling Squishy Jelly Blobs
        // =====================================================================
        // Left Squishy Jelly Blob (Cyan 8-sided Poly)
        const jelly = Poly.regular(8, 2.0);
        jelly.transform.position = new Vec3(-7, 12, 0);
        jelly.paint.fill = new Color(0.12, 0.78, 0.88, 0.85); // Vibrant translucent cyan jelly
        jelly.paint.stroke = new Color(0.40, 0.95, 1.00, 1.0);
        jelly.paint.strokeWidth = 0.08;

        physics.addSoftBody(jelly, {
            shape: 'radial',
            frequencyHz: 6.5,
            dampingRatio: 0.15,
            friction: 0.4,
            restitution: 0.6
        });

        // Right Bouncy Jelly Blob (Coral Red 6-sided Poly)
        const jelly2 = Poly.regular(6, 1.7);
        jelly2.transform.position = new Vec3(7, 12, 0);
        jelly2.paint.fill = new Color(0.96, 0.35, 0.22, 0.85); // Translucent coral red
        jelly2.paint.stroke = new Color(1.0, 0.65, 0.55, 1.0);
        jelly2.paint.strokeWidth = 0.08;

        physics.addSoftBody(jelly2, {
            shape: 'radial',
            frequencyHz: 8.0,
            dampingRatio: 0.20,
            friction: 0.3,
            restitution: 0.7
        });

        // =====================================================================
        // SECTION B: Suspended Pinned Cloth / Curtain (pinned along top edge)
        // =====================================================================
        const curtainW = 6;
        const curtainH = 4.5;
        const curtain = new Poly([
            new Vec2(-curtainW / 2, curtainH / 2),
            new Vec2(curtainW / 2, curtainH / 2),
            new Vec2(curtainW / 2, -curtainH / 2),
            new Vec2(-curtainW / 2, -curtainH / 2)
        ], { isClosed: true });
        curtain.transform.position = new Vec3(0, 4.75, 0);
        curtain.paint.fill = new Color(0.60, 0.35, 0.85, 0.80); // Purple cloth
        curtain.paint.stroke = new Color(0.85, 0.65, 1.00, 1.0);
        curtain.paint.strokeWidth = 0.06;

        physics.addSoftBody(curtain, {
            shape: 'grid',
            columns: 5,
            rows: 4,
            frequencyHz: 4.5,
            dampingRatio: 0.25,
            pinned: 'top-edge', // Top particles are locked to act as curtain rod
            friction: 0.3
        });

        // Top structural rod mounting (visual beam anchoring the pinned top edge)
        const rod = new Rect(7.2, 0.4);
        rod.transform.position = new Vec3(0, 7.0, 0);
        rod.paint.fill = new Color(0.35, 0.40, 0.50, 1.0);
        this.add(rod);

        // =====================================================================
        // SECTION C: Click to Spawn Soft Body Jellies
        // =====================================================================
        const colors = [
            new Color(0.12, 0.78, 0.88, 0.85),
            new Color(0.96, 0.35, 0.22, 0.85),
            new Color(0.20, 0.88, 0.45, 0.85),
            new Color(0.98, 0.80, 0.15, 0.85),
            new Color(0.92, 0.25, 0.65, 0.85)
        ];

        this.setEvent("click", (worldPos: Vec3) => {
            const sides = Math.floor(Math.random() * 3) + 6;
            const newJelly = Poly.regular(sides, 1.4 + Math.random() * 0.5);
            newJelly.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
            const col = colors[Math.floor(Math.random() * colors.length)];
            newJelly.paint.fill = col;
            newJelly.paint.stroke = new Color(1, 1, 1, 0.8);
            newJelly.paint.strokeWidth = 0.06;

            physics.addSoftBody(newJelly, {
                shape: 'radial',
                frequencyHz: 6.0 + Math.random() * 3.0,
                dampingRatio: 0.18,
                friction: 0.3,
                restitution: 0.5
            });
        });
    }
}
