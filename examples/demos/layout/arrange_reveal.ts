// =========================================================================
// File: examples/demos/layout/arrange_reveal.ts
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
    DOWN
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ArrangeRevealScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        frameStage(this, 40, 28, 0);
        new CameraController(this, this.camera);

        const title = new Text("ArrangeReveal: Spatial Introducers", { anchor: CENTER, fontSize: 1.6 });
        title.paint.fill = Color.WHITE;
        title.transform.position.set(0, 9, 0);
        this.add(title);

        const subtitle = new Text("Geometric Reveal Patterns: Diagonal, Radial, Snake & Columns", { anchor: CENTER, fontSize: 1.0 });
        subtitle.paint.fill = Color.CYAN;
        subtitle.nextTo(title, DOWN, 0.5);
        this.add(subtitle);

        const caption = new Text("Pattern: Diagonal Pop", { anchor: CENTER, fontSize: 1.2 });
        caption.paint.fill = Color.YELLOW;
        caption.transform.position.set(0, -9, 0);
        this.add(caption);

        const template = new Rect(1.3, 1.3);
        template.paint.fill = Color.WHITE;

        const grid = new Arrange(template, 25)
            .forAll((i, block) => {
                block.paint.fill = Color.fromHSL(i / 25, 0.85, 0.55);
            })
            .arrangeGrid(5, 5, 0.4);

        this.add(grid);

        this.always(() => {
            this.invalidate();
        });

        const patterns: Array<{ name: string; pattern: 'diagonal' | 'radial-out' | 'snake' | 'columns'; style: 'pop' | 'drop' | 'fade' }> = [
            { name: "1. Diagonal Sweep (Pop)", pattern: "diagonal", style: "pop" },
            { name: "2. Radial Outward (Pop)", pattern: "radial-out", style: "pop" },
            { name: "3. Serpentine Snake (Fade)", pattern: "snake", style: "fade" },
            { name: "4. Column-by-Column (Drop)", pattern: "columns", style: "drop" }
        ];

        while (true) {
            for (const p of patterns) {
                caption.text = `Pattern: ${p.name}`;
                caption.paint.fill = Color.YELLOW;

                await this.play(grid.reveal({
                    pattern: p.pattern,
                    animation: p.style,
                    cols: 5,
                    rows: 5,
                    duration: 1000,
                    lagRatio: 0.06
                }));

                await this.wait(1200);
            }
        }
    }
}
