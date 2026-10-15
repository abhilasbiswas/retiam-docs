// =========================================================================
// File: examples/demos/modifiers/offset_demo.ts
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
    OffsetModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class OffsetDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("OffsetModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Parallel Normal Boundary Dilation (Insetting & Outsetting)", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Core central shape: Rounded Shield
        const shieldD = "M 0 2 C 1.5 2, 2.5 1.5, 2.5 0 C 2.5 -1.5, 1 -2.5, 0 -3 C -1 -2.5, -2.5 -1.5, -2.5 0 C -2.5 1.5, -1.5 2, 0 2 Z";

        // Reference center shape
        const baseShield = new Path(shieldD);
        baseShield.paint.setStroke(0.06, hex("#475569"));
        baseShield.paint.fill = new Color(0.1, 0.15, 0.25, 0.3);
        baseShield.transform.position.set([0, 0, 0]);
        this.add(baseShield);

        // Dynamic Offset Outline
        const offsetShield = new Path(shieldD)
            .addModifier(new OffsetModifier({ distance: 0.4 }));
        offsetShield.paint.setStroke(0.08, hex("#38BDF8"));
        offsetShield.transform.position.set([0, 0, 0]);
        this.add(offsetShield);

        const statusLabel = new SDFText("Offset: +0.40 (Outset)", { anchor: CENTER, fontSize: 0.28 });
        statusLabel.transform.position.set([0, -3.8, 0]);
        statusLabel.paint.fill = hex("#38BDF8");
        this.add(statusLabel);

        frameContent(this, [title, baseShield, offsetShield, statusLabel, subtitle], 0.22);

        const mod = offsetShield.getModifier(OffsetModifier)!;

        // Animate offset through negative inset and positive outset
        await this.play(new CustomAnimation((t) => {
            // Oscillates between -0.6 (inset) and +0.8 (outset)
            const d = -0.6 + (1 + Math.sin(t * Math.PI * 2 - Math.PI / 2)) * 0.7;
            mod.distance = d;

            const sign = d >= 0 ? "+" : "";
            const mode = d >= 0 ? "Outset" : "Inset";
            statusLabel.text = `Offset: ${sign}${d.toFixed(2)} (${mode})`;
        }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
