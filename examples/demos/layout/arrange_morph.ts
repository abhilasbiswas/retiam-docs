// =========================================================================
// File: examples/demos/layout/arrange_morph.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Rect,
    Text,
    Arrange,
    UP,
    DOWN,
    RIGHT
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ArrangeMorphScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 32]);
        this.clearColor(demoBackground());
        frameStage(this, 40, 28, 0);
        new CameraController(this, this.camera);

        const title = new Text("MorphArrange: Fluid Layout Transitions", { anchor: CENTER, fontSize: 1.6 });
        title.paint.fill = Color.WHITE;
        title.transform.position.set(0, 9, 0);
        this.add(title);

        const subtitle = new Text("Grid ↔ Radial Dial ↔ Parametric Curve ↔ Linear Sequence", { anchor: CENTER, fontSize: 0.95 });
        subtitle.paint.fill = Color.CYAN;
        subtitle.nextTo(title, DOWN, 0.5);
        this.add(subtitle);

        const caption = new Text("Layout: 4x4 Grid", { anchor: CENTER, fontSize: 1.2 });
        caption.paint.fill = Color.YELLOW;
        caption.transform.position.set(0, -9, 0);
        this.add(caption);

        // 16 rectangular cards
        const template = new Rect(1.3, 1.3);
        template.paint.fill = Color.WHITE;

        const layout = new Arrange(template, 16)
            .forAll((i, card) => {
                card.paint.fill = Color.fromHSL(i / 16, 0.85, 0.55);
            })
            .arrangeGrid(4, 4, 0.5);

        this.add(layout);

        this.always(() => {
            this.invalidate();
        });

        while (true) {
            // Morph 1: Grid -> Radial Ring (with tangent orientation)
            caption.text = "Morphing -> Radial Dial (Tangent Oriented)";
            caption.paint.fill = Color.MAGENTA;
            await this.play(layout.morphToRadial(5.5, { orient: 'tangent' }, {
                duration: 1500,
                lagRatio: 0.03
            }));
            await this.wait(1000);

            // Morph 2: Radial Ring -> Parametric Sine Curve
            caption.text = "Morphing -> Parametric Sine Curve";
            caption.paint.fill = Color.LIME;
            await this.play(layout.morphAlongCurve(
                (t) => {
                    const x = (t - 0.5) * 18;
                    const y = Math.sin(t * Math.PI * 2) * 3.0;
                    return [x, y, 0];
                },
                { orient: true },
                { duration: 1500, lagRatio: 0.02 }
            ));
            await this.wait(1000);

            // Morph 3: Curve -> 1D Linear Line
            caption.text = "Morphing -> 1D Linear Sequence";
            caption.paint.fill = Color.CYAN;
            await this.play(layout.morphToLinear(RIGHT, 1.1, 'step', {
                duration: 1400,
                lagRatio: 0.025
            }));
            await this.wait(1000);

            // Morph 4: Line -> 4x4 Grid
            caption.text = "Morphing -> 4x4 Grid";
            caption.paint.fill = Color.YELLOW;
            await this.play(layout.morphToGrid(4, 4, 0.5, {
                duration: 1500,
                lagRatio: 0.02
            }));
            await this.wait(1200);
        }
    }
}
