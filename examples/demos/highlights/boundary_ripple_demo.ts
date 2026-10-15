// =========================================================================
// File: examples/demos/highlights/boundary_ripple_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Circle,
    Rect,
    VGroup,
    GrowFromCenter,
    FadeIn,
    CENTER,
} from "retiam";
import { BoundaryRipple } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class BoundaryRippleDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Boundary Ripple (Radar Ping)", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const node = new Circle(1.2);
        node.paint.fill = new Color(0.15, 0.65, 0.9, 1.0);
        node.paint.strokeWidth = 0;

        const nodeLabel = new Text("PING", { fontSize: 0.4 , anchor: CENTER});
        nodeLabel.paint.fill = Color.WHITE;
        nodeLabel.move([0, 0, 0.05]);
        const nodeGroup = new VGroup(node, nodeLabel);
        nodeGroup.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new GrowFromCenter(nodeGroup, { duration: 600 }),
        ]);

        await this.wait(400);

        // Ripple 1
        await this.play(
            new BoundaryRipple(node, {
                color: new Color(0.3, 0.8, 1.0, 1.0),
                expandScale: 1.5,
                strokeWidth: 0.07,
                duration: 800,
            })
        );

        await this.wait(200);

        // Ripple 2
        await this.play(
            new BoundaryRipple(node, {
                color: new Color(0.4, 0.9, 1.0, 1.0),
                expandScale: 1.6,
                strokeWidth: 0.06,
                duration: 800,
            })
        );

        await this.wait(1500);
    }
}
