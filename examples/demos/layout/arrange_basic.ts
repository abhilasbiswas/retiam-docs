// =========================================================================
// File: examples/demos/layout/arrange_basic.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Circle,
    Rect,
    Text,
    Arrange,
    UP,
    DOWN,
    Vec3
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ArrangeBasicScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 45]);
        this.clearColor(demoBackground());
        frameStage(this, 55, 28, 6);
        new CameraController(this, this.camera);

        // Header Title
        const title = new Text("Arrange: Core Procedural Layouts", { anchor: CENTER, fontSize: 1.8 });
        title.paint.fill = Color.WHITE;
        title.transform.position.set(0, 15, 0);
        this.add(title);

        // 1. 2D Grid (.arrangeGrid + .forAll)
        const gridTemplate = new Circle(0.7);
        const grid = new Arrange(gridTemplate, 16)
            .forAll((i, circle) => {
                circle.paint.fill = Color.fromHSL(i / 16, 0.85, 0.55);
            })
            .arrangeGrid(4, 4, 0.4);

        grid.transform.position.set(-16, 3, 0);
        this.add(grid);

        const gridLabel = new Text("4x4 Grid", { anchor: CENTER, fontSize: 1.2 });
        gridLabel.paint.fill = Color.CYAN;
        gridLabel.move([-16, -4.5, 0]);
        this.add(gridLabel);

        // 2. Radial Dial (.arrangeRadial)
        const dialTemplate = new Rect(0.25, 1.2);
        dialTemplate.paint.fill = Color.CYAN;

        const dial = new Arrange(dialTemplate, 12)
            .arrangeRadial(4.5, { orient: 'tangent' })
            .forAll((i, tick) => {
                if (i % 3 === 0) {
                    tick.paint.fill = Color.YELLOW;
                    tick.transform.scaling = new Vec3(1.5, 1.5, 1.5);
                }
            });

        dial.transform.position.set(0, 3, 0);
        this.add(dial);

        const dialLabel = new Text("Radial Dial (Tangent)", { anchor: CENTER, fontSize: 1.2 });
        dialLabel.paint.fill = Color.YELLOW;
        dialLabel.move([0, -4.5, 0]);
        this.add(dialLabel);

        // 3. Parametric Curve (.arrangeAlongCurve)
        const archTemplate = new Rect(0.25, 0.9);
        archTemplate.paint.fill = Color.MAGENTA;

        const arch = new Arrange(archTemplate, 18)
            .arrangeAlongCurve((t) => {
                const x = (t - 0.5) * 10;
                const y = -(x * x) * 0.12 + 3.0;
                return [x, y, 0];
            }, { orient: true });

        arch.transform.position.set(16, 3, 0);
        this.add(arch);

        const archLabel = new Text("Parametric Arch", { anchor: CENTER, fontSize: 1.2 });
        archLabel.paint.fill = Color.MAGENTA;
        archLabel.move([16, -4.5, 0]);
        this.add(archLabel);

        // Render loop
        this.always(() => {
            this.invalidate();
        });
    }
}
