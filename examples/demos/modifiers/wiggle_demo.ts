// =========================================================================
// File: examples/demos/modifiers/wiggle_demo.ts
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
    WiggleModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class WiggleDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("WiggleModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Coherent Multi-Octave Noise Displacement & Animated Line Boil", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // 1. Smooth Organic Wave (Top)
        const smoothPath = new Path("M -5 1.2 L 5 1.2")
            .addModifier(new ResampleModifier({ count: 70 }))
            .addModifier(new WiggleModifier({ amplitude: 0.3, frequency: 3.5, type: "smooth", anchorEnds: true }));
        smoothPath.paint.setStroke(0.08, hex("#38BDF8"));
        this.add(smoothPath);

        const smoothLabel = new SDFText("Smooth Wiggle (Fluid Wave)", { anchor: CENTER, fontSize: 0.25 });
        smoothLabel.transform.position.set([0, 1.9, 0]);
        smoothLabel.paint.fill = hex("#38BDF8");
        this.add(smoothLabel);

        // 2. Corner Jagged Electricity (Bottom)
        const cornerPath = new Path("M -5 -1.2 L 5 -1.2")
            .addModifier(new ResampleModifier({ count: 70 }))
            .addModifier(new WiggleModifier({ amplitude: 0.35, frequency: 6.0, type: "corner", anchorEnds: true, seed: 999 }));
        cornerPath.paint.setStroke(0.08, hex("#F59E0B"));
        this.add(cornerPath);

        const cornerLabel = new SDFText("Corner Wiggle (Electric Arc / Lightning)", { anchor: CENTER, fontSize: 0.25 });
        cornerLabel.transform.position.set([0, -0.5, 0]);
        cornerLabel.paint.fill = hex("#F59E0B");
        this.add(cornerLabel);

        frameContent(this, [title, smoothPath, cornerPath, smoothLabel, cornerLabel, subtitle], 0.25);

        const smoothMod = smoothPath.getModifier(WiggleModifier)!;
        const cornerMod = cornerPath.getModifier(WiggleModifier)!;

        // Continuous line boil evolution
        await this.play(new CustomAnimation((t) => {
            smoothMod.time = t * 10.0;
            cornerMod.time = t * 15.0;
        }, { duration: 4000, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
