import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/features/move_vs_moveto_demo.ts
//
// Simple demo: both rects try to place their LEFT edge at x=0.
// Stacked vertically so you can see which LEFT edge aligns with
// the yellow target line and which one doesn't.
// =========================================================================

import {
    Scene, Color, Text, Rect, Circle, Vec3,
    CameraController, LEFT, Line,
    RIGHT,
    UP,
    DR,
    UL,
} from "retiam";

export default class MoveVsMoveToScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 120]);
        new CameraController(this, this.camera);
        frameStage(this, 92, 110);
        demoCaption(this, "Anchor alignment", "Three rectangles align against the same reference");

        // ── Vertical target line at x = 0 ──
        const targetLine = new Line(
            [[0, -40], [0, 40]],
            { stroke: new Color(1, 0.9, 0.2, 1), strokeWidth: 0.15 }
        );
        this.add(targetLine);


        const r1 = new Rect(10, 5, {
            fill: new Color(1, 0.4, 0.45, 0.5),
            stroke: new Color(1, 0.4, 0.45, 1),
            strokeWidth: 0.15,
        });
        r1.scale(2);
        r1.move([0, 10, 0], RIGHT);
        this.add(r1);

        const r2 = new Rect(10, 5, {
            fill: new Color(0.3, 0.85, 0.55, 0.5),
            stroke: new Color(0.3, 0.85, 0.55, 1),
            strokeWidth: 0.15,
        });
        r2.scale(2);
        // r2.snapTo(r1, DR, UL, [0, 0])
        this.add(r2);

        const r3 = new Rect(10, 5, {
            fill: new Color(0.3, 0.0, 0.85, 0.5),
            stroke: new Color(0.3, 0, 0.85, 1),
            strokeWidth: 0.15,
        });
        r3.scale(2);
        this.add(r3);

        this.play([r2.animate.snapTo(r1, DR, UL, [0, 0]), r3.animate.snapTo(r2, DR, UL, [0, 0])]);

    }
}
