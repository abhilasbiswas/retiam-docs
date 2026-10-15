import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/physics2d_mouse_drag.ts
// Interactive Mouse Dragging & Tossing Physics Sandbox
// Grab, fling, and manipulate dynamic rigid bodies in real time
// Powered by Retiam 2D Physics (supports Planck & Rapier)
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Rect,
    Circle,
    Poly,
    VectorEntity
} from "retiam";
import { Physics2D } from "retiam/physics";

export default class Physics2DMouseDragScene extends Scene {
    private physics!: Physics2D;
    private dynamicObjects: VectorEntity[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // Position camera to frame the physics playground
        this.camera.position.set([0, 0, 36]);
        frameStage(this, 53, 43);
        demoCaption(this, "Grab, drag and toss", "Click for a ball · right-click for a polygon");

        // 1. Initialize 2D Physics engine ('planck' or 'rapier')
        const physics = new Physics2D(this, {
            backend: "rapier",
            gravity: [0, -9.8]
        });
        this.physics = physics;

        // 2. Enable Interactive Pointer Grabbing & Tossing
        physics.enableMouseDrag({
            frequencyHz: 5.0,
            dampingRatio: 0.7,
            maxForce: 1500
        });

        // 3. Static Boundary Enclosure
        const floor = new Rect(42, 0.6);
        floor.transform.position = new Vec3(0, -15, 0);
        floor.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(floor, "static");

        const leftWall = new Rect(0.6, 32);
        leftWall.transform.position = new Vec3(-20, 1, 0);
        leftWall.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(leftWall, "static");

        const rightWall = new Rect(0.6, 32);
        rightWall.transform.position = new Vec3(20, 1, 0);
        rightWall.paint.fill = new Color(0.18, 0.22, 0.30, 1.0);
        physics.add(rightWall, "static");

        // Angled deflector ramps
        const leftRamp = new Rect(12, 0.4);
        leftRamp.transform.position = new Vec3(-12, -4, 0);
        leftRamp.transform.setRotationZ(-0.35);
        leftRamp.paint.fill = new Color(0.24, 0.28, 0.38, 1.0);
        physics.add(leftRamp, "static");

        const rightRamp = new Rect(12, 0.4);
        rightRamp.transform.position = new Vec3(12, -4, 0);
        rightRamp.transform.setRotationZ(0.35);
        rightRamp.paint.fill = new Color(0.24, 0.28, 0.38, 1.0);
        physics.add(rightRamp, "static");

        // 4. Center Seesaw Obstacle
        const pivotPin = new Circle(0.4);
        pivotPin.transform.position = new Vec3(0, -9.5, 0);
        pivotPin.paint.fill = new Color(0.5, 0.55, 0.65, 1.0);
        physics.add(pivotPin, "static");

        const seesawPlank = new Rect(16, 0.5);
        seesawPlank.transform.position = new Vec3(0, -9.5, 0);
        seesawPlank.paint.fill = new Color(0.12, 0.72, 0.88, 1.0); // Vibrant cyan
        physics.add(seesawPlank, {
            motion: "dynamic",
            density: 2.0,
            friction: 0.4
        });
        physics.addRevoluteJoint(pivotPin, seesawPlank, {
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 }
        });

        // 5. Stacked Crates (ready to be grabbed and thrown)
        const crateColors = [
            new Color(0.96, 0.32, 0.24, 1.0), // Coral Red
            new Color(0.98, 0.60, 0.10, 1.0), // Amber
            new Color(0.22, 0.78, 0.45, 1.0), // Emerald
            new Color(0.58, 0.35, 0.88, 1.0), // Purple
            new Color(0.92, 0.20, 0.56, 1.0)  // Magenta
        ];

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3 - row; col++) {
                const box = new Rect(1.6, 1.6);
                const x = (col - (3 - row - 1) / 2) * 1.8;
                const y = -14.0 + 0.8 + row * 1.7;
                box.transform.position = new Vec3(x, y, 0);
                box.paint.fill = crateColors[(row + col) % crateColors.length];
                box.paint.stroke = new Color(1, 1, 1, 0.3);
                box.paint.strokeWidth = 0.04;
                physics.add(box, {
                    motion: "dynamic",
                    density: 1.5,
                    friction: 0.5,
                    restitution: 0.2,
                    ccd: true
                });
                this.dynamicObjects.push(box);
            }
        }

        // 6. Suspended Bouncy Pendulum
        const pendulumAnchor = new Rect(0.8, 0.8);
        pendulumAnchor.transform.position = new Vec3(-10, 12, 0);
        pendulumAnchor.paint.fill = new Color(0.4, 0.45, 0.55, 1.0);
        physics.add(pendulumAnchor, "static");

        const pendulumBob = new Circle(1.5);
        pendulumBob.transform.position = new Vec3(-5, 6, 0);
        pendulumBob.paint.fill = new Color(0.98, 0.82, 0.18, 1.0); // Golden yellow
        physics.add(pendulumBob, {
            motion: "dynamic",
            density: 3.5,
            restitution: 0.7,
            ccd: true
        });
        this.dynamicObjects.push(pendulumBob);

        physics.addSpring(pendulumAnchor, pendulumBob, {
            length: 8.0,
            frequencyHz: 2.0,
            dampingRatio: 0.05,
            coils: 10,
            radius: 0.35,
            stroke: new Color(0.98, 0.82, 0.18, 1.0),
            strokeWidth: 0.08
        });

        // 7. Right-Click or Click to spawn new grab-ready objects
        this.setEvent("click", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            const isRightClick = (event as PointerEvent).button === 2;
            if (isRightClick) {
                // Spawn polygon
                const poly = Poly.regular(Math.floor(Math.random() * 4) + 5, 1.4);
                poly.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                poly.paint.fill = crateColors[Math.floor(Math.random() * crateColors.length)];
                physics.add(poly, { motion: "dynamic", density: 2.0, restitution: 0.5, friction: 0.3, ccd: true });
                this.dynamicObjects.push(poly);
            } else {
                // Spawn bouncing ball
                const r = 0.8 + Math.random() * 0.6;
                const marble = new Circle(r);
                marble.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
                marble.paint.fill = crateColors[Math.floor(Math.random() * crateColors.length)];
                physics.add(marble, { motion: "dynamic", density: 2.5, restitution: 0.75, friction: 0.2, ccd: true });
                this.dynamicObjects.push(marble);
            }
        });

        // Clean up objects that fall far below the boundary
        this.always(() => {
            for (let i = this.dynamicObjects.length - 1; i >= 0; i--) {
                const obj = this.dynamicObjects[i];
                if (obj.transform.position.y < -30) {
                    physics.remove(obj, true);
                    this.dynamicObjects.splice(i, 1);
                }
            }
        });
    }
}
