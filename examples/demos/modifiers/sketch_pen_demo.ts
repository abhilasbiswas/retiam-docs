// =========================================================================
// File: examples/demos/modifiers/sketch_pen_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Path,
    SDFText,
    hex,
    Color,
    Camera2DController,
    PathEffect,
    CapType,
    Rect,
    Ellipse
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

/**
 * Sketch pen on top of strict (rough.js) Excalidraw geometry:
 * the modifier doubles and bows the strokes, the pen then gives each stroke its own pressure.
 */
export default class SketchPenDemoScene extends Scene {
    public override async run(): Promise<void> {
        frameStage(this, 16, 11, 0);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });
        this.clearColor(demoBackground());

        const title = new SDFText("Sketch Pen", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 4.0, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Random artistic width inside [50%, 100%] of the stroke, lighter where the pen lands and lifts", { anchor: CENTER, fontSize: 0.26 });
        subtitle.transform.position.set([0, 3.4, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        const label = (text: string, x: number, y: number, color: string) => {
            const t = new SDFText(text, { anchor: CENTER, fontSize: 0.24 });
            t.transform.position.set([x, y, 0]);
            t.paint.fill = hex(color);
            this.add(t);
        };

        // -------------------------------------------------------------
        // PANEL 1: continuous Excalidraw geometry, constant width vs sketch pen
        // -------------------------------------------------------------
        label("Constant width", -5.2, 2.4, "#64748B");
        const plain = new Rect(2.8, 1.8).toExcalidraw({
            strokeShader: null,
            seed: 11,
            strokeWidth: 0.1,
            stroke: Color.BLUE,
        });
        plain.transform.position.set([-5.2, 0.9, 0]);
        this.add(plain);

        label("Sketch pen", -1.9, 2.4, "#38BDF8");
        const penned = new Rect(2.8, 1.8).toExcalidraw({
            seed: 11,
            strokeWidth: 0.1,
            stroke: Color.BLUE,
            strokeShader: PathEffect.Sketch({ wavelength: 2.0 }),
        });
        penned.transform.position.set([-1.9, 0.9, 0]);
        this.add(penned);

        label("Sketch pen, ellipse", 1.4, 2.4, "#38BDF8");
        const ellipse = new Ellipse(2.8, 1.8).toExcalidraw({
            seed: 5,
            strokeWidth: 0.1,
            stroke: Color.GREEN,
            strokeShader: PathEffect.Sketch({ wavelength: 2.0 }),
        });
        ellipse.transform.position.set([1.4, 0.9, 0]);
        this.add(ellipse);

        label("Filled sketch", 4.7, 2.4, "#38BDF8");
        const filled = new Rect(2.8, 1.8).toExcalidraw({
            seed: 3,
            strokeWidth: 0.1,
            stroke: Color.ORANGE,
            fill: new Color(Color.ORANGE.r, Color.ORANGE.g, Color.ORANGE.b, 0.45),
            strokeShader: PathEffect.Sketch({ wavelength: 2.0 }),
        });
        filled.transform.position.set([4.7, 0.9, 0]);
        this.add(filled);

        // -------------------------------------------------------------
        // PANEL 2: the pen on a single long stroke, with different settings
        // -------------------------------------------------------------
        const strokes: { name: string; y: number; options: Parameters<typeof PathEffect.Sketch>[0] }[] = [
            { name: "default", y: -0.6, options: { wavelength: 2.5 } },
            { name: "bias +0.8 (heavy)", y: -1.5, options: { wavelength: 2.5, bias: 0.8 } },
            { name: "bias -0.8 (light)", y: -2.4, options: { wavelength: 2.5, bias: -0.8 } },
            { name: "variation 0 (constant mid width)", y: -3.3, options: { variation: 0 } },
        ];
        for (const s of strokes) {
            label(s.name, -7.4, s.y + 0.32, "#64748B");
            const line = new Path(`M -7.4 ${s.y} C -4 ${s.y + 0.35}, 0 ${s.y - 0.35}, 7.4 ${s.y}`, {
                strokeShader: PathEffect.Sketch(s.options),
            });
            line.paint.setStroke(0.18, hex("#38BDF8"));
            line.paint.setCap(CapType.ROUND);
            this.add(line);
        }

        await this.wait(600);
    }
}
