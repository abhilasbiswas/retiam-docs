// =========================================================================
// File: examples/demos/modifiers/dash_demo.ts
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
    DashModifier,
    CapType
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class DashDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("DashModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Geometric Sub-Contour Splitting with Full Stroke Caps", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Pattern 1: Simple Dashes [0.5, 0.25] with Round Caps
        const path1 = new Path("M -5 1.2 C -2 3, 2 -1, 5 1.2")
            .addModifier(new DashModifier({ dashArray: [0.6, 0.3] }));
        path1.paint.setStroke(0.12, hex("#38BDF8"));
        path1.paint.cap = CapType.ROUND;
        this.add(path1);

        const label1 = new SDFText("Pattern [0.6, 0.3] (Round Caps)", { anchor: CENTER, fontSize: 0.25 });
        label1.transform.position.set([0, 2.2, 0]);
        label1.paint.fill = hex("#38BDF8");
        this.add(label1);

        // Pattern 2: Multi-step Morse Code [0.8, 0.2, 0.15, 0.2]
        const path2 = new Path("M -5 -1.2 C -2 1, 2 -3, 5 -1.2")
            .addModifier(new DashModifier({ dashArray: [0.8, 0.25, 0.2, 0.25] }));
        path2.paint.setStroke(0.12, hex("#F59E0B"));
        path2.paint.cap = CapType.ROUND;
        this.add(path2);

        const label2 = new SDFText("Morse Cadence [0.8, 0.25, 0.2, 0.25]", { anchor: CENTER, fontSize: 0.25 });
        label2.transform.position.set([0, -0.2, 0]);
        label2.paint.fill = hex("#F59E0B");
        this.add(label2);

        frameContent(this, [title, path1, path2, label1, label2, subtitle], 0.25);

        const mod1 = path1.getModifier(DashModifier)!;
        const mod2 = path2.getModifier(DashModifier)!;

        // Animate marching ants offset
        await this.play(new CustomAnimation((t) => {
            mod1.dashOffset = t * 3.6;
            mod2.dashOffset = -t * 4.0;
        }, { duration: 3500, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
