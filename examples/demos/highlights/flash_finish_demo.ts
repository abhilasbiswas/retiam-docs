// =========================================================================
// File: examples/demos/highlights/flash_finish_demo.ts
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
import { FlashFinish } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class FlashFinishDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Impact Snap: Flash Finish", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const card = new Rect(5.5, 3.0, { cornerRadius: 0.18 });
        card.paint.fill = new Color(0.08, 0.3, 0.35, 1.0);
        card.paint.strokeWidth = 0;

        const label = new Text("MISSION COMPLETE", { fontSize: 0.5 , anchor: CENTER});
        label.paint.fill = Color.WHITE;
        label.move([0, 0, 0.05]);

        const cardGroup = new VGroup(card, label);
        cardGroup.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(cardGroup, { duration: 600 }),
        ]);

        await this.wait(300);

        // Flash Impact 1 (Pure white)
        await this.play(
            new FlashFinish(cardGroup, {
                color: new Color(1.0, 1.0, 1.0, 1.0),
                intensity: 1.0,
                duration: 250,
            })
        );

        await this.wait(500);

        // Flash Impact 2 (Electric green accent)
        await this.play(
            new FlashFinish(cardGroup, {
                color: new Color(0.4, 1.0, 0.7, 1.0),
                intensity: 1.2,
                duration: 280,
            })
        );

        await this.wait(1500);
    }
}
