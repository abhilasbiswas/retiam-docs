// =========================================================================
// File: examples/demos/highlights/sparkle_burst_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Circle,
    VGroup,
    GrowFromCenter,
    FadeIn,
    CENTER,
} from "retiam";
import { SparkleBurst } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class SparkleBurstDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Celebration: Sparkle Burst", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const badge = new Circle(1.5);
        badge.paint.fill = new Color(0.95, 0.75, 0.15, 1.0); // Gold Coin / Medal
        badge.paint.strokeWidth = 0;

        const starText = new Text("*LEVEL UP", { fontSize: 0.52 , anchor: CENTER});
        starText.paint.fill = new Color(0.1, 0.1, 0.15, 1.0);
        starText.move([0, 0, 0.05]);

        const medalGroup = new VGroup(badge, starText);
        medalGroup.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new GrowFromCenter(medalGroup, { duration: 700 }),
        ]);

        await this.wait(300);

        // Burst 1
        await this.play(
            new SparkleBurst(medalGroup, {
                count: 5,
                sparkleSize: 0.35,
                color: new Color(1.0, 1.0, 0.4, 1.0),
                duration: 900,
            })
        );

        await this.wait(400);

        // Burst 2
        await this.play(
            new SparkleBurst(medalGroup, {
                count: 4,
                sparkleSize: 0.28,
                color: new Color(0.3, 1.0, 0.7, 1.0),
                duration: 800,
            })
        );

        await this.wait(1500);
    }
}
