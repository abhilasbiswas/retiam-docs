import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: src/demo_mouse_trace.ts
// =========================================================================

import { CameraController, Circle, Color, Math3D, Model, Scene, TracePath, Vec3 } from "retiam";

export default class MouseTraceScene extends Scene {
    public async run() {
        // 1. Setup Camera and Scene
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 160, 110);
        demoCaption(this, "A spatial pointer trail", "Move the pointer to draw a fading path");
        this.clearColor(Color.fromHex("#080c14"));


        let circle = new Circle(10, { fill: Color.fromHex("#17273c"), stroke: Color.fromHex("#334155"), strokeWidth: 0.3 });
        circle.transform.move([10, 30, 0])
        this.add(circle);
        circle.always(() => {
            circle.radius = 15 + Math.sin(this.time * 0.005) * 10;
        });
        // 2. State for the mouse position in 3D world space
        let targetPos = new Vec3(0, 0, 0);

        let cursorOrb = new Model(Math3D.createSphere(1.5));
        cursorOrb.material.color = Color.BLACK;
        cursorOrb.material.emColor = new Color(0.0, 0.8, 1.0, 1.0); // Neon Blue Glow
        cursorOrb.material.emStrength = 2.0;
        cursorOrb.isPickable = false; // Don't let raycaster hit the cursor itself
        this.add(cursorOrb);

        // 4. Create the TracePath and bind it to the targetPos using targetFunc
        let mouseTrail = new TracePath({
            targetFunc: () => targetPos,
            maxAge: 800,           // Trail fully dissipates after 800ms
            fadeLength: 0.8,       // 80% of the tail will smooth taper into nothingness
            minDistance: 0.5,      // Drop anchor every 0.5 units
            smoothing: 4          // Level 3 Chaikin spline (super smooth curves!)
        });

        // Set opacity below 1.0 so we can test that the Stencil prevents self-overlap!
        mouseTrail.paint.stroke = new Color(0.0, 0.8, 1.0, 0.6);
        mouseTrail.paint.strokeWidth = 3.5;
        mouseTrail.isPickable = false; // Ignore trail in raycasting
        this.add(mouseTrail);

        // 5. Setup Mouse Event Listener using new Scene setEvent
        this.setEvent('mousemove', (position: Vec3) => {
            // Update the target vector
            targetPos.set(position.x, position.y, position.z);

            // Update the visual orb's actual transform
            cursorOrb.transform.position = targetPos;

            // Wake up the renderer so it draws the new frame immediately
            this.invalidate();
        });

        // Optional: Click to clear the trail
        this.setEvent('pointerdown', () => {
            mouseTrail.clear();
        });

    }
}
