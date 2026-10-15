// =========================================================================
// File: examples/demos/modifiers/smooth_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Path,
    SDFText,
    CustomAnimation,
    Rate,
    hex,
    Color,
    SmoothModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class SmoothDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("SmoothModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 4.3, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Douglas-Peucker Simplification & Chaikin Curvature Smoothing", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.65, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Staircase / Stepped jagged polyline
        const jaggedD = "M -5 0 L -4 1 L -3 1 L -2 0 L -1 -1 L 0 -1 L 1 1 L 2 1 L 3 0 L 4 -1 L 5 0";

        // Top: Raw jagged path
        const rawPath = new Path(jaggedD);
        rawPath.paint.setStroke(0.06, hex("#64748B"));
        rawPath.transform.position.set([0, 1.75, 0]);
        this.add(rawPath);

        const rawLabel = new SDFText("Raw Discrete Stepped Polyline", { anchor: CENTER, fontSize: 0.25 });
        rawLabel.transform.position.set([0, 3.0, 0]);
        rawLabel.paint.fill = hex("#64748B");
        this.add(rawLabel);

        // Bottom: Smoothly filtered path
        const smoothPath = new Path(jaggedD)
            .addModifier(new SmoothModifier({ tolerance: 0.01, smoothness: 0.0 }));
        smoothPath.paint.setStroke(0.08, hex("#38BDF8"));
        smoothPath.transform.position.set([0, -1.75, 0]);
        this.add(smoothPath);

        const smoothLabel = new SDFText("Smoothed Curve (smoothness: 0.00)", { anchor: CENTER, fontSize: 0.25 });
        smoothLabel.transform.position.set([0, -0.3, 0]);
        smoothLabel.paint.fill = hex("#38BDF8");
        this.add(smoothLabel);

        frameContent(this, [title, rawPath, smoothPath, rawLabel, smoothLabel, subtitle], 0.25);

        const mod = smoothPath.getModifier(SmoothModifier)!;

        // Animate smoothness factor from 0.0 to 1.0 and back
        await this.play(new CustomAnimation((t) => {
            const factor = Math.sin(t * Math.PI) * 0.95;
            mod.smoothness = factor;
            smoothLabel.text = `Smoothed Curve (smoothness: ${factor.toFixed(2)})`;
        }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
