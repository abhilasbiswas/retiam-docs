// =========================================================================
// File: examples/demos/highlights/marker_sweep_demo.ts
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
import { MarkerSweep } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class MarkerSweepDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Marker Sweep (Highlighter Pen)", { fontSize: 0.72, anchor: CENTER });
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const line1 = new Text("import { MarkerSweep } from 'retiam/highlights';", {
            fontSize: 0.42,
            anchor: CENTER
        });
        line1.paint.fill = new Color(0.9, 0.95, 1.0, 1.0);
        line1.move([0, 1.0, 0]);

        const line2 = new Text("Highlight the important part", {
            fontSize: 0.6,
            anchor: CENTER
        });
        line2.paint.fill = new Color(1.0, 0.9, 0.4, 1.0);
        line2.move([0, -2.0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(line1, { duration: 600 }),
            new FadeIn(line2, { duration: 600 }),
        ]);

        await this.wait(400);

        // 1. Transient yellow marker sweep on code line
        await this.play(
            new MarkerSweep(line1, {
                color: new Color(1.0, 0.9, 0.1, 1.0),
                opacity: 0.38,
                padding: [0.3, 0.15],
                duration: 900,
            })
        );

        await this.wait(400);

        // 2. Persistent fluorescent pink marker sweep on emphasis phrase
        await this.play(
            new MarkerSweep(line2, {
                color: new Color(1.0, 0.25, 0.6, 1.0),
                opacity: 0.35,
                padding: [0.3, 0.15],
                persist: true,
                duration: 1000,
            })
        );

        await this.wait(1500);
    }
}
