// =========================================================================
// File: examples/demos/highlights/backdrop_fade_demo.ts
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
import { BackdropFade } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class BackdropFadeDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Backdrop Fade (Card / Pill)", { fontSize: 0.72, anchor: CENTER });
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const cardText = new Text("FEATURE CARD CONTAINER", { fontSize: 0.6, anchor: CENTER });
        cardText.paint.fill = Color.WHITE;
        cardText.move([0, 0.5, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new FadeIn(cardText, { duration: 600 }),
        ]);

        await this.wait(400);

        // Fades in a stylish rounded plate behind the card text
        await this.play(
            new BackdropFade(cardText, {
                color: new Color(0.18, 0.28, 0.5, 1.0),
                opacity: 0.45,
                padding: [0.6, 0.4],
                cornerRadius: 0.2,
                persist: true,
                duration: 900,
            })
        );

        await this.wait(1500);
    }
}
