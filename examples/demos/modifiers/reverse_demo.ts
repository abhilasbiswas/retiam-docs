// =========================================================================
// File: examples/demos/modifiers/reverse_demo.ts
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
    TrimModifier,
    ReverseModifier,
    Dot
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ReverseDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.clearColor(demoBackground());

        const title = new SDFText("ReverseModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Inverts Contour Traversal Direction, Normals, and Tangents", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        const curveD = "M -4 0 C -2 3, 2 -3, 4 0";

        // 1. Forward Path (Top)
        const forwardPath = new Path(curveD)
            .addModifier(new TrimModifier({ start: 0, end: 0 }));
        forwardPath.paint.setStroke(0.1, hex("#38BDF8"));
        forwardPath.transform.position.set([0, 1.2, 0]);
        this.add(forwardPath);

        const forwardLabel = new SDFText("Forward Direction (Left ──► Right)", { anchor: CENTER, fontSize: 0.25 });
        forwardLabel.transform.position.set([0, 2.2, 0]);
        forwardLabel.paint.fill = hex("#38BDF8");
        this.add(forwardLabel);

        const dotStartF = new Dot([-4, 1.2, 0], { radius: 0.12, fill: hex("#10B981") });
        const dotEndF = new Dot([4, 1.2, 0], { radius: 0.12, fill: hex("#EF4444") });
        this.add(dotStartF);
        this.add(dotEndF);

        // 2. Reversed Path (Bottom)
        const reversePath = new Path(curveD)
            .addModifier(new ReverseModifier()) // Invert vertices & normals
            .addModifier(new TrimModifier({ start: 0, end: 0 }));
        reversePath.paint.setStroke(0.1, hex("#F59E0B"));
        reversePath.transform.position.set([0, -1.5, 0]);
        this.add(reversePath);

        const reverseLabel = new SDFText("Reversed Modifier (Right ──► Left)", { anchor: CENTER, fontSize: 0.25 });
        reverseLabel.transform.position.set([0, -0.5, 0]);
        reverseLabel.paint.fill = hex("#F59E0B");
        this.add(reverseLabel);

        const dotStartR = new Dot([4, -1.5, 0], { radius: 0.12, fill: hex("#10B981") });
        const dotEndR = new Dot([-4, -1.5, 0], { radius: 0.12, fill: hex("#EF4444") });
        this.add(dotStartR);
        this.add(dotEndR);

        frameStage(this, 14, 10, 0.4);

        const trimF = forwardPath.getModifier(TrimModifier)!;
        const trimR = reversePath.getModifier(TrimModifier)!;

        // Animate stroke draw simultaneously
        await this.play(new CustomAnimation((t) => {
            trimF.end = t;
            trimR.end = t;
        }, { duration: 3000, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
