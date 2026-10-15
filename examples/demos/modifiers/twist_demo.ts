// =========================================================================
// File: examples/demos/modifiers/twist_demo.ts
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
    TwistModifier,
    ResampleModifier,
    Group
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class TwistDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.clearColor(demoBackground());

        const title = new SDFText("TwistModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 5.3, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Angular Vortex Deformation with Radial Falloff (Galactic Swirl)", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 4.65, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        const spokes: Path[] = [];
        const spokeCount = 8;
        for (let i = 0; i < spokeCount; i++) {
            const angle = (i / spokeCount) * Math.PI;
            const cos = Math.cos(angle) * 3.5;
            const sin = Math.sin(angle) * 3.5;

            const p = new Path(`M ${-cos} ${-sin} L ${cos} ${sin}`)
                .addModifier(new ResampleModifier({ count: 60 })) // Ensure smooth bending
                .addModifier(new TwistModifier({ angle: 0.0, radius: 4.0 }));

            p.transform.position.set([0, 0.2, 0]);
            p.paint.setStroke(0.08, hex("#38BDF8"));
            this.add(p);
            spokes.push(p);
        }

        const angleLabel = new SDFText("Twist Angle: 0.0°", { anchor: CENTER, fontSize: 0.28 });
        angleLabel.transform.position.set([0, -3.9, 0]);
        angleLabel.paint.fill = hex("#38BDF8");
        this.add(angleLabel);

        frameStage(this, 16, 12.5, 0.7);

        // Animate twist angle up to 2.5 PI (spiral galaxy)
        await this.play(new CustomAnimation((t) => {
            const angle = Math.sin(t * Math.PI) * Math.PI * 2.5;

            for (const p of spokes) {
                const mod = p.getModifier(TwistModifier)!;
                mod.angle = angle;
            }

            const degrees = Math.round((angle * 180) / Math.PI);
            angleLabel.text = `Twist Angle: ${degrees}° (Spiral Vortex)`;
        }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
