// =========================================================================
// File: examples/demos/highlights/blink_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Rect,
    VGroup,
    GrowFromCenter,
    FadeIn,
    CENTER,
} from "retiam";
import { Blink } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class BlinkDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Opacity Blink Animation", { fontSize: 0.72, anchor: CENTER });
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const box = new Rect(5.0, 2.5, { cornerRadius: 0.15 });
        box.paint.fill = new Color(0.35, 0.22, 0.08, 1.0);
        box.paint.strokeWidth = 0;

        const label = new Text("RECORDING", { fontSize: 0.52, anchor: CENTER });
        label.paint.fill = Color.WHITE;
        label.move([0, 0, 0.05]);

        const badge = new VGroup(box, label);
        badge.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(badge, { duration: 600 }),
        ]);

        await this.wait(400);

        // Blink badge 3 times over 1800ms
        await this.play(
            new Blink(badge, {
                blinks: 3,
                duration: 1800,
            })
        );

        await this.wait(1500);
    }
}
