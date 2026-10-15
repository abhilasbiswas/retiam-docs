// =========================================================================
// File: examples/demos/modifiers/pucker_bloat_demo.ts
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
    PuckerBloatModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class PuckerBloatDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("PuckerBloatModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Radial Anchor-Locked Tension (Sharp Star ◄──► Puffy Flower)", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // 4-point Diamond / Box Polygon
        const polyD = "M 0 2 L 2 0 L 0 -2 L -2 0 Z";

        const shape = new Path(polyD)
            .addModifier(new PuckerBloatModifier({ amount: 0.0 }));
        shape.paint.setStroke(0.08, hex("#38BDF8"));
        shape.paint.fill = new Color(0.22, 0.74, 0.97, 0.2);
        shape.transform.position.set([0, 0.2, 0]);
        this.add(shape);

        const stateLabel = new SDFText("Neutral Base Polygon (amount: 0.00)", { anchor: CENTER, fontSize: 0.28 });
        stateLabel.transform.position.set([0, -2.6, 0]);
        stateLabel.paint.fill = hex("#38BDF8");
        this.add(stateLabel);

        frameContent(this, [title, shape, stateLabel, subtitle], 0.25);

        const mod = shape.getModifier(PuckerBloatModifier)!;

        // Animate from Pucker (-0.75) to Bloat (+0.75)
        await this.play(new CustomAnimation((t) => {
            // Oscillates between -0.75 and +0.75
            const amt = Math.sin(t * Math.PI * 2) * 0.75;
            mod.amount = amt;

            if (amt > 0.05) {
                stateLabel.text = `Bloated Clover / Flower (amount: +${amt.toFixed(2)})`;
                shape.paint.setStroke(0.08, hex("#10B981"));
                stateLabel.paint.fill = hex("#10B981");
            } else if (amt < -0.05) {
                stateLabel.text = `Puckered Sharp Star (amount: ${amt.toFixed(2)})`;
                shape.paint.setStroke(0.08, hex("#F43F5E"));
                stateLabel.paint.fill = hex("#F43F5E");
            } else {
                stateLabel.text = "Neutral Base Polygon (amount: 0.00)";
                shape.paint.setStroke(0.08, hex("#38BDF8"));
                stateLabel.paint.fill = hex("#38BDF8");
            }
        }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
