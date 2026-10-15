// =========================================================================
// File: examples/demos/highlights/pulse_glow_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    CameraController,
    Text,
    Circle,
    VGroup,
    GrowFromCenter,
    CENTER,
} from "retiam";
import { PulseGlow } from "retiam/highlights";

import { frameStage } from "../../shared/presentation";

export default class PulseGlowDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 20]);
        frameStage(this, 18, 11, 1);
        new CameraController(this, this.camera);

        const title = new Text("Breathing Aura: Pulse Glow", { fontSize: 0.72, anchor: CENTER});
        title.paint.fill = Color.WHITE;
        title.move([0, 4.3, 0]);

        const orb = new Circle(1.4);
        orb.paint.fill = new Color(0.08, 0.3, 0.35, 1.0);
        orb.paint.strokeWidth = 0;

        const orbLabel = new Text("AURA", { fontSize: 0.52, anchor: CENTER });
        orbLabel.paint.fill = Color.WHITE;
        orbLabel.move([0, 0, 0.05]);

        const orbGroup = new VGroup(orb, orbLabel);
        orbGroup.move([0, 0, 0]);

        await this.play([
            new GrowFromCenter(title, { duration: 500 }),
            new GrowFromCenter(orbGroup, { duration: 600 }),
        ]);

        await this.wait(400);

        // Breathing cyan-green aura (2 smooth pulses)
        await this.play(
            new PulseGlow(orbGroup, {
                color: new Color(0.3, 1.0, 0.65, 1.0),
                opacity: 0.5,
                pulses: 2,
                padding: 0.35,
                duration: 1200,
            })
        );

        await this.wait(1500);
    }
}
