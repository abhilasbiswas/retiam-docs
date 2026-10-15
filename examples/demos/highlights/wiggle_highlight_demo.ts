// =========================================================================
// File: examples/demos/highlights/wiggle_highlight_demo.ts
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
import { WiggleHighlight } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class WiggleHighlightDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Alert / Shake: Wiggle Highlight", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const alertBox = new Rect(4.6, 2.4, { cornerRadius: 0.15 });
        alertBox.paint.fill = new Color(0.35, 0.22, 0.08, 1.0);
        alertBox.paint.strokeWidth = 0;

        const alertLabel = new Text("INVALID INPUT!", { fontSize: 0.52 , anchor: CENTER});
        alertLabel.paint.fill = Color.WHITE;
        alertLabel.move([0, 0, 0.05]);

        const alertCard = new VGroup(alertBox, alertLabel);
        alertCard.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(alertCard, { duration: 600 }),
        ]);

        await this.wait(400);

        // Wiggle alert shake 1
        await this.play(
            new WiggleHighlight(alertCard, {
                angle: 0.14,
                wiggles: 3,
                duration: 600,
            })
        );

        await this.wait(500);

        // Wiggle alert shake 2 (subtler)
        await this.play(
            new WiggleHighlight(alertCard, {
                angle: 0.08,
                wiggles: 4,
                duration: 500,
            })
        );

        await this.wait(1500);
    }
}
