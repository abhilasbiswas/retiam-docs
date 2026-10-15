// =========================================================================
// File: examples/demos/modifiers/path_modifiers_showcase.ts
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
    TrimModifier,
    WiggleModifier,
    RoundCornersModifier,
    OffsetModifier,
    ZigZagModifier,
    DashModifier,
    PuckerBloatModifier,
    TwistModifier
} from "retiam";
import { frameContent, demoBackground } from "../../shared/presentation";

export default class PathModifiersShowcaseScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());

        // Title
        const title = new SDFText("Retiam Path Modifier Pipeline", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 4.2, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Procedural Geometric Operations on Path Entities", { anchor: CENTER, fontSize: 0.32 });
        subtitle.transform.position.set([0, 3.6, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // 1. Wiggle & Resample (Electric Line)
        const wire = new Path("M -5 1.5 L -1 1.5")
            .addModifier(new ResampleModifier({ count: 60 }))
            .addModifier(new WiggleModifier({ amplitude: 0.25, frequency: 4, anchorEnds: true }));
        wire.paint.setStroke(0.08, hex("#38BDF8"));
        this.add(wire);

        const wireLabel = new SDFText("Resample + Wiggle", { anchor: CENTER, fontSize: 0.25 });
        wireLabel.transform.position.set([-3, 0.9, 0]);
        wireLabel.paint.fill = hex("#94A3B8");
        this.add(wireLabel);

        // 2. Trim Path (Progressive Traveling Stroke)
        const loop = new Path("M 1 2 C 2 3, 4 3, 5 2 C 6 1, 4 0.5, 3 1 C 2 1.5, 1 1, 1 2")
            .addModifier(new TrimModifier({ start: 0.0, end: 0.4 }));
        loop.paint.setStroke(0.1, hex("#F59E0B"));
        this.add(loop);

        const loopLabel = new SDFText("Trim Path (Traveling Arc)", { anchor: CENTER, fontSize: 0.25 });
        loopLabel.transform.position.set([3, 0.4, 0]);
        loopLabel.paint.fill = hex("#94A3B8");
        this.add(loopLabel);

        // 3. Round Corners (Fillet Morph)
        const star = new Path("M -4.5 -1 L -3.5 -1 L -3 -0.2 L -2.5 -1 L -1.5 -1 L -2.2 -1.6 L -1.9 -2.5 L -3 -2 L -4.1 -2.5 L -3.8 -1.6 Z")
            .addModifier(new RoundCornersModifier({ radius: 0.15 }));
        star.paint.setStroke(0.06, hex("#A78BFA"));
        star.paint.fill = new Color(0.65, 0.55, 0.98, 0.15);
        this.add(star);

        const starLabel = new SDFText("Round Corners (Fillet)", { anchor: CENTER, fontSize: 0.25 });
        starLabel.transform.position.set([-3, -2.9, 0]);
        starLabel.paint.fill = hex("#94A3B8");
        this.add(starLabel);

        // 4. ZigZag & Offset (Concentric Wave Ring)
        const ring = new Path("M 1.5 -1.8 C 1.5 -0.8, 4.5 -0.8, 4.5 -1.8 C 4.5 -2.8, 1.5 -2.8, 1.5 -1.8 Z")
            .addModifier(new ZigZagModifier({ amplitude: 0.1, ridges: 16, style: "smooth" }));
        ring.paint.setStroke(0.06, hex("#10B981"));
        ring.paint.fill = new Color(0.06, 0.72, 0.51, 0.15);
        this.add(ring);

        const ringLabel = new SDFText("Smooth ZigZag Wave", { anchor: CENTER, fontSize: 0.25 });
        ringLabel.transform.position.set([3, -3.1, 0]);
        ringLabel.paint.fill = hex("#94A3B8");
        this.add(ringLabel);

        // Auto-frame camera
        frameContent(this, [title, wire, loop, star, ring, subtitle, wireLabel, loopLabel, starLabel, ringLabel], 0.25);

        // Retrieve modifiers for dynamic animation
        const wiggleMod = wire.getModifier(WiggleModifier)!;
        const trimMod = loop.getModifier(TrimModifier)!;
        const roundMod = star.getModifier(RoundCornersModifier)!;
        const zigzagMod = ring.getModifier(ZigZagModifier)!;

        // Animate modifiers simultaneously across timeline
        await this.play(new CustomAnimation((t) => {
            // Animate wiggle line boil & frequency
            wiggleMod.time = t * 6.0;
            wiggleMod.amplitude = 0.15 + Math.sin(t * Math.PI) * 0.2;

            // Animate trim path traveling loop
            trimMod.offset = t * 1.5;

            // Animate corner radius pulsing
            roundMod.radius = 0.05 + 0.25 * Math.sin(t * Math.PI);

            // Animate traveling wave phase on ring
            zigzagMod.phase = t * Math.PI * 4;
        }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

        await this.wait(500);
    }
}
