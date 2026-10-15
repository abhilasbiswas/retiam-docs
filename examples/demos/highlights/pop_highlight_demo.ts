// =========================================================================
// File: examples/demos/highlights/pop_highlight_demo.ts
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
import { PopHighlight } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class PopHighlightDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Elastic Motion: Pop Highlight", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const btnBg = new Rect(4.2, 2.0, { cornerRadius: 0.15 });
        btnBg.paint.fill = new Color(0.08, 0.22, 0.35, 1.0);
        btnBg.paint.strokeWidth = 0;

        const btnLabel = new Text("CLICK ME", { fontSize: 0.5 , anchor: CENTER});
        btnLabel.paint.fill = Color.WHITE;
        btnLabel.move([0, 0, 0.05]);

        const button = new VGroup(btnBg, btnLabel);
        button.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(button, { duration: 600 }),
        ]);

        await this.wait(400);

        // Pop 1: Standard 1.22x punch
        await this.play(
            new PopHighlight(button, {
                scaleFactor: 1.22,
                duration: 550,
            })
        );

        await this.wait(500);

        // Pop 2: Energetic 1.35x punch
        await this.play(
            new PopHighlight(button, {
                scaleFactor: 1.35,
                duration: 600,
            })
        );

        await this.wait(1500);
    }
}
