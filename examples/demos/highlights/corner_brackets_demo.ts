// =========================================================================
// File: examples/demos/highlights/corner_brackets_demo.ts
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
import { CornerBrackets } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class CornerBracketsDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Corner Brackets (HUD Framing)", { fontSize: 0.72, anchor: CENTER });
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        // Create target HUD card
        const hudCard = new Rect(7.0, 4.0, { cornerRadius: 0.1 });
        hudCard.paint.fill = new Color(0.1, 0.16, 0.25, 0.8);
        hudCard.paint.stroke = new Color(0.2, 0.4, 0.6, 0.5);
        hudCard.paint.strokeWidth = 0.03;

        const targetHeader = new Text("TARGET ACQUIRED", { fontSize: 0.5, anchor: CENTER });
        targetHeader.paint.fill = new Color(0.2, 0.9, 1.0, 1.0);
        targetHeader.move([0, 1.0, 0.05]);

        const targetData = new Text("COORDS: [34.0522, -118.2437] | STATUS: LOCKED", {
            fontSize: 0.28,
            anchor: CENTER
        });
        targetData.paint.fill = new Color(0.7, 0.85, 0.95, 0.9);
        targetData.move([0, -0.2, 0.05]);

        const cardGroup = new VGroup(hudCard, targetHeader, targetData);

        await this.play([
            new GrowFromCenter(title, { duration: 600 }),
            new FadeIn(cardGroup, { duration: 700 }),
        ]);

        await this.wait(400);

        // 1. Transient Cyan HUD bracket scan
        await this.play(
            new CornerBrackets(cardGroup, {
                color: new Color(0.2, 0.9, 1.0, 1.0),
                bracketLength: 0.7,
                strokeWidth: 0.08,
                padding: 0.25,
                duration: 1000,
            })
        );

        await this.wait(500);

        // 2. Focused tighter bracket on header
        await this.play(
            new CornerBrackets(targetHeader, {
                color: new Color(1.0, 0.8, 0.2, 1.0),
                bracketLength: 0.4,
                strokeWidth: 0.06,
                padding: 0.18,
                duration: 800,
            })
        );

        await this.wait(1500);
    }
}
