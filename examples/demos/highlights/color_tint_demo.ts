// =========================================================================
// File: examples/demos/highlights/color_tint_demo.ts
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
import { ColorTint } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class ColorTintDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Intrinsic Color Tint", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const card = new Rect(4.8, 2.8, { cornerRadius: 0.15 });
        card.paint.fill = new Color(0.08, 0.22, 0.35, 1.0);
        card.paint.stroke = new Color(0.4, 0.6, 0.9, 1.0);
        card.paint.strokeWidth = 0.04;

        const label = new Text("DATA BLOCK", { fontSize: 0.5 , anchor: CENTER});
        label.paint.fill = Color.WHITE;
        label.move([0, 0, 0.05]);

        const block = new VGroup(card, label);
        block.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(block, { duration: 600 }),
        ]);

        await this.wait(400);

        // 1. Temporary Golden Accent Tint (tints and restores)
        await this.play(
            new ColorTint(block, {
                color: new Color(1.0, 0.8, 0.1, 1.0),
                holdDuration: 300,
                duration: 900,
            })
        );

        await this.wait(500);

        // 2. Persistent Emerald Accent Tint
        await this.play(
            new ColorTint(block, {
                color: new Color(0.2, 0.85, 0.5, 1.0),
                persist: true,
                duration: 800,
            })
        );

        await this.wait(1500);
    }
}
