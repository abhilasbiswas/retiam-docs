// =========================================================================
// File: examples/demos/layout/arrange_wave.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Rect,
    Text,
    Arrange,
    UP,
    DOWN,
    RIGHT
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class ArrangeWaveScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        frameStage(this, 44, 28, 0);
        new CameraController(this, this.camera);

        const title = new Text("Arrange: Real-Time Dynamic Wave (.onUpdate)", { anchor: CENTER, fontSize: 1.6 });
        title.paint.fill = Color.WHITE;
        title.transform.position.set(0, 8, 0);
        this.add(title);

        const subtitle = new Text("Frame-by-frame procedural height and color gradient modulation", { anchor: CENTER, fontSize: 0.95 });
        subtitle.paint.fill = Color.CYAN;
        subtitle.nextTo(title, DOWN, 0.5);
        this.add(subtitle);

        // 60 spectrum bars
        const barTemplate = new Rect(0.22, 4.0);
        barTemplate.paint.fill = Color.CYAN;

        const wave = new Arrange(barTemplate, 60)
            .arrangeLinear(RIGHT, 0.38, 'step')
            .onUpdate((time, dt, arrange) => {
                const tSec = time * 0.0025;
                arrange.forAll((i, bar) => {
                    const waveY = Math.sin(tSec * 3 + i * 0.22) * 2.2 + Math.cos(tSec * 1.5 + i * 0.1) * 0.8;
                    bar.transform.position.y = waveY;
                    const progress = (waveY + 3.0) / 6.0;
                    bar.paint.fill = Color.lerp(Color.CYAN, Color.MAGENTA, progress);
                });
            });

        wave.transform.position.set(0, -2, 0);
        this.add(wave);

        this.always(() => {
            this.invalidate();
        });
    }
}
