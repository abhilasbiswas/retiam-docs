// =========================================================================
// File: examples/demos/modifiers/trim_demo.ts
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
    TrimModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class TrimDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("TrimModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Parametric Arc-Length Splitting & Continuous Traveling Loops", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Path A: Infinity loop (Cyclical Offset traveling trail)
        const infinityD = "M 0 0 C 1.5 2, 4 2, 4 0 C 4 -2, 1.5 -2, 0 0 C -1.5 2, -4 2, -4 0 C -4 -2, -1.5 -2, 0 0 Z";

        // Ghost background guide
        const ghost = new Path(infinityD);
        ghost.paint.setStroke(0.04, new Color(0.2, 0.3, 0.45, 0.3));
        ghost.transform.position.set([0, 0.5, 0]);
        this.add(ghost);

        const travelPath = new Path(infinityD)
            .addModifier(new TrimModifier({ start: 0.0, end: 0.25 }));
        travelPath.paint.setStroke(0.12, hex("#38BDF8"));
        travelPath.transform.position.set([0, 0.5, 0]);
        this.add(travelPath);

        const travelLabel = new SDFText("Cyclical Traveling Trail (Offset: 0.00)", { anchor: CENTER, fontSize: 0.26 });
        travelLabel.transform.position.set([0, -1.8, 0]);
        travelLabel.paint.fill = hex("#38BDF8");
        this.add(travelLabel);

        frameContent(this, [title, ghost, travelLabel, subtitle], 0.25);

        const trimMod = travelPath.getModifier(TrimModifier)!;

        // Phase 1: Draw in stroke from 0 to 100%
        await this.play(new CustomAnimation((t) => {
            trimMod.end = t;
            travelLabel.text = `Drawing In Stroke (${Math.round(t * 100)}%)`;
        }, { duration: 1500, rate_func: Rate.easeInOutCubic() }));

        await this.wait(400);

        // Phase 2: Shrink to 25% beam and shoot around the infinity loop indefinitely
        trimMod.start = 0.0;
        trimMod.end = 0.25;

        await this.play(new CustomAnimation((t) => {
            trimMod.offset = t * 2.0; // Two complete revolutions
            travelLabel.text = `Traveling Loop (Offset: ${(t * 2.0).toFixed(2)})`;
        }, { duration: 3000, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
