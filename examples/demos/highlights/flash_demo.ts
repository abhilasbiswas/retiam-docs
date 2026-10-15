// =========================================================================
// File: examples/demos/highlights/flash_demo.ts
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
import { Flash } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class FlashDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Radial Flash Lines", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const orb = new Circle(1.2);
        orb.paint.fill = new Color(0.95, 0.8, 0.2, 1.0);
        orb.paint.strokeWidth = 0;

        const orbLabel = new Text("TARGET", { fontSize: 0.4, anchor: CENTER });
        orbLabel.paint.fill = new Color(0.1, 0.1, 0.15, 1.0);
        orbLabel.move([0, 0, 0.05]);

        const targetGroup = new VGroup(orb, orbLabel);
        targetGroup.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new GrowFromCenter(targetGroup, { duration: 600 }),
        ]);

        await this.wait(400);

        // 1. Flash rays on target group
        await this.play(
            new Flash(targetGroup, {
                color: new Color(1.0, 0.85, 0.1, 1.0),
                numLines: 16,
                flashRadius: 1.5,
                lineLength: 1.0,
                duration: 900,
            })
        );

        await this.wait(500);

        // 2. Flash rays on custom coordinate point
        await this.play(
            new Flash([0, -2.5, 0], {
                color: new Color(0.3, 0.85, 1.0, 1.0),
                numLines: 10,
                flashRadius: 0.8,
                lineLength: 0.9,
                duration: 800,
            })
        );

        await this.wait(1500);
    }
}
