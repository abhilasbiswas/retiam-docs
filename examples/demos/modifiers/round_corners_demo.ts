// =========================================================================
// File: examples/demos/modifiers/round_corners_demo.ts
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
    RoundCornersModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class RoundCornersDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        const title = new SDFText("RoundCornersModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 3.8, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Dynamic Fillet Corner Rounding on Polygonal Vectors", { anchor: CENTER, fontSize: 0.3 });
        subtitle.transform.position.set([0, 3.2, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // Shape 1: 5-Point Star (Left)
        const starD = "M 0 1.8 L 0.5 0.5 L 1.8 0.5 L 0.8 -0.3 L 1.2 -1.5 L 0 -0.8 L -1.2 -1.5 L -0.8 -0.3 L -1.8 0.5 L -0.5 0.5 Z";
        const star = new Path(starD).addModifier(new RoundCornersModifier({ radius: 0.0 }));
        star.paint.setStroke(0.08, hex("#A78BFA"));
        star.paint.fill = new Color(0.65, 0.55, 0.98, 0.2);
        star.transform.position.set([-2.8, 0.3, 0]);
        this.add(star);

        const starLabel = new SDFText("Star Fillet", { anchor: CENTER, fontSize: 0.25 });
        starLabel.transform.position.set([-2.8, -1.8, 0]);
        starLabel.paint.fill = hex("#A78BFA");
        this.add(starLabel);

        // Shape 2: Sharp Geometric Hexagon (Right)
        const hexD = "M -1 1.7 L 1 1.7 L 2 0 L 1 -1.7 L -1 -1.7 L -2 0 Z";
        const hexagon = new Path(hexD).addModifier(new RoundCornersModifier({ radius: 0.0 }));
        hexagon.paint.setStroke(0.08, hex("#10B981"));
        hexagon.paint.fill = new Color(0.06, 0.72, 0.51, 0.2);
        hexagon.transform.position.set([2.8, 0.3, 0]);
        this.add(hexagon);

        const hexLabel = new SDFText("Hexagon Fillet", { anchor: CENTER, fontSize: 0.25 });
        hexLabel.transform.position.set([2.8, -1.8, 0]);
        hexLabel.paint.fill = hex("#10B981");
        this.add(hexLabel);

        frameContent(this, [title, star, hexagon, starLabel, hexLabel, subtitle], 0.25);

        const starMod = star.getModifier(RoundCornersModifier)!;
        const hexMod = hexagon.getModifier(RoundCornersModifier)!;

        // Animate corner radius pulsing from sharp (0.0) to smooth (0.35)
        await this.play(new CustomAnimation((t) => {
            const r = Math.sin(t * Math.PI) * 0.35;
            starMod.radius = r;
            hexMod.radius = r * 1.5;

            starLabel.text = `Star Fillet (r: ${r.toFixed(2)})`;
            hexLabel.text = `Hexagon Fillet (r: ${(r * 1.5).toFixed(2)})`;
        }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

        await this.wait(600);
    }
}
