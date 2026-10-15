// =========================================================================
// File: examples/demos/modifiers/zigzag_demo.ts
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
    ZigZagModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class ZigZagDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("ZigZagModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Triangular Ridges & Sinusoidal Waves along Normal Vectors", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // 1. Triangular Sawtooth (Schematic Resistor / Teeth)
        const sawPath = new Path("M -5 1.2 L 5 1.2")
            .addModifier(new ZigZagModifier({ amplitude: 0.35, ridges: 8, style: "corner" }));
        sawPath.paint.setStroke(0.08, hex("#F59E0B"));
        this.add(sawPath);

        const sawLabel = new SDFText("Triangular ZigZag ('corner' mode)", { anchor: CENTER, fontSize: 0.25 });
        sawLabel.transform.position.set([0, 2.0, 0]);
        sawLabel.paint.fill = hex("#F59E0B");
        this.add(sawLabel);

        // 2. Sinusoidal Wave Ribbon
        const wavePath = new Path("M -5 -1.2 L 5 -1.2")
            .addModifier(new ZigZagModifier({ amplitude: 0.35, ridges: 6, style: "smooth" }));
        wavePath.paint.setStroke(0.08, hex("#38BDF8"));
        this.add(wavePath);

        const waveLabel = new SDFText("Sinusoidal Ripple ('smooth' mode)", { anchor: CENTER, fontSize: 0.25 });
        waveLabel.transform.position.set([0, -0.4, 0]);
        waveLabel.paint.fill = hex("#38BDF8");
        this.add(waveLabel);

        frameContent(this, [title, sawPath, wavePath, sawLabel, waveLabel, subtitle], 0.25);

        const sawMod = sawPath.getModifier(ZigZagModifier)!;
        const waveMod = wavePath.getModifier(ZigZagModifier)!;

        // Animate traveling wave phase
        await this.play(new CustomAnimation((t) => {
            sawMod.phase = t * Math.PI * 4;
            waveMod.phase = t * Math.PI * 4;
        }, { duration: 3000, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
