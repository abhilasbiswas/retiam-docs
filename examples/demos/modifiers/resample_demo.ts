// =========================================================================
// File: examples/demos/modifiers/resample_demo.ts
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
    ResampleModifier,
    Dot,
    Group
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ResampleDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.clearColor(demoBackground());

        const title = new SDFText("ResampleModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 4.3, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Equidistant Arc-Length Re-parameterization", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.65, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Path SVG: S-curve
        const svgD = "M -5 0 C -3 3, 0 -3, 2 1 S 4 3, 5 0";

        // Top: Sparse baseline path
        const rawPath = new Path(svgD);
        rawPath.paint.setStroke(0.08, hex("#475569"));
        rawPath.transform.position.set([0, 1.2, 0]);
        rawPath.transform.setScale([1, 0.55, 1]);
        this.add(rawPath);

        const rawLabel = new SDFText("Raw Curve (Non-uniform control points)", { anchor: CENTER, fontSize: 0.25 });
        rawLabel.transform.position.set([0, 3.0, 0]);
        rawLabel.paint.fill = hex("#64748B");
        this.add(rawLabel);

        // Bottom: Resampled path with dynamic equidistant dots
        const resampledPath = new Path(svgD)
            .addModifier(new ResampleModifier({ count: 12 }));
        resampledPath.paint.setStroke(0.08, hex("#38BDF8"));
        resampledPath.transform.position.set([0, -1.5, 0]);
        resampledPath.transform.setScale([1, 0.55, 1]);
        this.add(resampledPath);

        const resampleLabel = new SDFText("Resampled Curve (Equidistant Arc-Length: 12 samples)", { anchor: CENTER, fontSize: 0.25 });
        resampleLabel.transform.position.set([0, 0.3, 0]);
        resampleLabel.paint.fill = hex("#38BDF8");
        this.add(resampleLabel);

        // Array for marker dots on the resampled vertices
        const activeDots: Dot[] = [];

        const updateDots = (count: number) => {
            for (const d of activeDots) {
                this.remove(d);
            }
            activeDots.length = 0;

            const ec = resampledPath.getEvaluatedContours()[0];
            if (!ec) return;
            // Draw a dot at each vertex
            for (let i = 0; i < ec.length; i += 4) {
                const dot = new Dot([ec[i], ec[i + 1] * 0.55 - 1.5, 0], { radius: 0.08, fill: hex("#F59E0B") });
                this.add(dot);
                activeDots.push(dot);
            }
        };
        updateDots(12);

        frameStage(this, 15, 10.5, 0.5);

        const mod = resampledPath.getModifier(ResampleModifier)!;

        // Animate density from 6 to 48 samples
        await this.play(new CustomAnimation((t) => {
            const currentCount = Math.round(6 + t * 42);
            mod.count = currentCount;
            updateDots(currentCount);
            resampleLabel.text = `Resampled Curve (Equidistant Arc-Length: ${currentCount} samples)`;
        }, { duration: 3000, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
