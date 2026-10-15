// =========================================================================
// File: examples/demos/layout/arrange_ripple.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Circle,
    Text,
    Arrange,
    UP,
    DOWN,
    ORIGIN
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ArrangeRippleScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        frameStage(this, 42, 28, 0);
        new CameraController(this, this.camera);

        const title = new Text("ArrangeRipple: Spatial Shockwaves", { anchor: CENTER, fontSize: 1.6 });
        title.paint.fill = Color.WHITE;
        title.transform.position.set(0, 9, 0);
        this.add(title);

        const subtitle = new Text("Euclidean distance-based wavefronts modulating scale, elevation & color", { anchor: CENTER, fontSize: 0.95 });
        subtitle.paint.fill = Color.CYAN;
        subtitle.nextTo(title, DOWN, 0.5);
        this.add(subtitle);

        const caption = new Text("Shockwave: Scale & Color Flash", { anchor: CENTER, fontSize: 1.2 });
        caption.paint.fill = Color.YELLOW;
        caption.transform.position.set(0, -9, 0);
        this.add(caption);

        // 7x7 dot matrix
        const template = new Circle(0.45);
        template.paint.fill = Color.WHITE;

        const grid = new Arrange(template, 49)
            .forAll((i, dot) => {
                dot.paint.fill = Color.fromHSL(0.55 + (i / 49) * 0.4, 0.8, 0.5);
            })
            .arrangeGrid(7, 7, 0.5);

        this.add(grid);

        this.always(() => {
            this.invalidate();
        });

        while (true) {
            // Wave 1: Pure Scale Pulse from Center
            caption.text = "1. Scale Pulse from Center (scalePeak: 2.0)";
            caption.paint.fill = Color.CYAN;
            await this.play(grid.ripple({
                origin: ORIGIN,
                scalePeak: 2.0,
                waveWidth: 3.0,
                duration: 1200
            }));
            await this.wait(600);

            // Wave 2: Color Flash & Jump
            caption.text = "2. Color Flash & Jump (colorPeak: Gold, jumpHeight: 1.5)";
            caption.paint.fill = Color.GOLD;
            await this.play(grid.ripple({
                origin: ORIGIN,
                scalePeak: 1.6,
                jumpHeight: 1.5,
                jumpAxis: 'y',
                colorPeak: Color.WHITE,
                waveWidth: 2.5,
                duration: 1300
            }));
            await this.wait(600);

            // Wave 3: Damped Ripple
            caption.text = "3. Attenuated Ripple with Damping (damping: 0.7)";
            caption.paint.fill = Color.MAGENTA;
            await this.play(grid.ripple({
                origin: ORIGIN,
                scalePeak: 2.2,
                colorPeak: Color.MAGENTA,
                damping: 0.7,
                waveWidth: 3.5,
                duration: 1400
            }));
            await this.wait(1000);
        }
    }
}
