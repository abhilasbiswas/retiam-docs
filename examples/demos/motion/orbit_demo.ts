// =========================================================================
// File: examples/demos/motion/orbit_demo.ts
// =========================================================================

import { Scene, CameraController, Circle, Rate, OrbitAnimation, TracePath, Create, hex } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

const AMBER = hex("#f59e0b");
const ACCENT = hex("#38bdf8");

export default class OrbitDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 10, 10);
        motionHeading(this, "Orbital motion", 4.1);
        new CameraController(this, this.camera);

        const sun = new Circle(0.8);
        sun.paint.fill = AMBER;
        sun.paint.strokeWidth = 0;

        const planet = new Circle(0.24);
        planet.paint.fill = ACCENT;
        planet.paint.strokeWidth = 0;
        planet.move([3, 0, 0]);

        const trace = new TracePath({ target: planet, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        planet.z_index = 1;

        await this.play(new Create([planet, sun]), { duration: 500 });

        while (1) {
            await this.wait(300);

            // Full orbit around the sun
            await this.play(new OrbitAnimation(planet, sun, {
                angle: Math.PI * 2,
                duration: 2500,
                rate_func: Rate.linear(),
            }));

            await this.wait(300);

            // Half orbit (reverse direction)
            await this.play(new OrbitAnimation(planet, sun, {
                angle: -Math.PI,
                duration: 1500,
                rate_func: Rate.easeInOutCubic(),
            }));

            await this.wait(400);
        }

    }
}
