// =========================================================================
// File: examples/demos/highlights/circumscribe_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Rect,
    Circle,
    VGroup,
    HBox,
    GrowFromCenter,
    FadeIn,
    CENTER,
} from "retiam";
import { Circumscribe } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class CircumscribeDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Circumscribe Highlight", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const box = new Rect(4, 2.4, { cornerRadius: 0.15 });
        box.paint.fill = new Color(0.08, 0.22, 0.32, 1.0);
        box.paint.strokeWidth = 0;

        const boxLabel = new Text("Rect Shape", { fontSize: 0.52 , anchor: CENTER});
        boxLabel.paint.fill = Color.WHITE;
        boxLabel.move([0, 0, 0.05]);
        const boxGroup = new VGroup(box, boxLabel);
        boxGroup.move([-4.5, 0.5, 0]);

        const circle = new Circle(1.5);
        circle.paint.fill = new Color(0.35, 0.22, 0.08, 1.0);
        circle.paint.strokeWidth = 0;

        const circleLabel = new Text("Circle Shape", { fontSize: 0.52, anchor: CENTER });
        circleLabel.paint.fill = Color.WHITE;
        circleLabel.move([0, 0, 0.05]);
        const circleGroup = new VGroup(circle, circleLabel);
        circleGroup.move([4.5, 0.5, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 600 }),
            new FadeIn(boxGroup, { duration: 600 }),
            new FadeIn(circleGroup, { duration: 600 }),
        ]);

        await this.wait(400);

        // 1. Circumscribe with Rect
        await this.play(
            new Circumscribe(box, {
                shape: "rect",
                color: new Color(1.0, 0.8, 0.2, 1.0),
                padding: 0.25,
                strokeWidth: 0.07,
                duration: 1200,
            })
        );

        await this.wait(300);

        // 2. Circumscribe with Circle
        await this.play(
            new Circumscribe(circle, {
                shape: "circle",
                color: new Color(0.3, 0.85, 1.0, 1.0),
                padding: 0.25,
                strokeWidth: 0.07,
                duration: 1200,
            })
        );

        await this.wait(400);

        // 3. Persistent circumscribe on Title
        await this.play(
            new Circumscribe(title, {
                shape: "pill",
                color: new Color(0.4, 1.0, 0.6, 1.0),
                padding: [0.4, 0.2],
                strokeWidth: 0.06,
                persist: true,
                duration: 1000,
            })
        );

        await this.wait(1500);
    }
}
