// =========================================================================
// File: examples/demos/highlights/underline_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    GrowFromCenter,
    FadeIn,
    CENTER,
} from "retiam";
import { Underline } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class UnderlineDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const heading = new Text("Straight & Wavy Underlines", { fontSize: 0.72, anchor: CENTER});
        heading.paint.fill = Color.WHITE;
        heading.move([0, 4.3, 0]);

        const text1 = new Text("Important Keynote Phrase", { fontSize: 0.7 , anchor: CENTER});
        text1.paint.fill = new Color(0.9, 0.95, 1.0, 1.0);
        text1.move([0, 1.2, 0]);

        const text2 = new Text("Syntax Warning / Squiggle", { fontSize: 0.7 , anchor: CENTER});
        text2.paint.fill = new Color(1.0, 0.8, 0.3, 1.0);
        text2.move([0, -2.5, 0]);

        await this.play([
            new GrowFromCenter(heading, { duration: 500 }),
            new FadeIn(text1, { duration: 600 }),
            new FadeIn(text2, { duration: 600 }),
        ]);

        await this.wait(400);

        // 1. Straight underline (persisting)
        await this.play(
            new Underline(text1, {
                style: "straight",
                color: new Color(0.2, 0.8, 1.0, 1.0),
                strokeWidth: 0.08,
                offset: 0.15,
                persist: true,
                duration: 900,
            })
        );

        await this.wait(400);

        // 2. Wavy squiggly underline (persisting)
        await this.play(
            new Underline(text2, {
                style: "wavy",
                waves: 5,
                color: new Color(1.0, 0.3, 0.35, 1.0),
                strokeWidth: 0.07,
                offset: 0.18,
                persist: true,
                duration: 900,
            })
        );

        await this.wait(1500);
    }
}
