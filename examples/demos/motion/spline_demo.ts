import { demoCaption, framePerspective } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/motion/spline_demo.ts
// =========================================================================

import { Scene, Color, Rate, Builder, Vec3, TracePath, OrbitCameraController, Sphere, Create, hex } from "retiam";

const BG = hex("#080c14");
const ACCENT = hex("#38bdf8");

export default class SplineDemoScene extends Scene {
    public async run() {
        this.camera.fov = Math.PI / 4;
        this.camera.position.set([0, 5, 18]);
        this.camera.lookAt([0, 0, 0]);
        this.clearColor(BG);
        new OrbitCameraController(this, this.camera, { radius: 19, targetCenter: new Vec3(0, 0, 0) });

        framePerspective(this);
        demoCaption(this, "Spline motion", "Waypoints and a rounded path guide the same moving point");

        const dot = new Sphere(0.28);
        dot.material.color = ACCENT;
        dot.paint.strokeWidth = 0;

        const trace = new TracePath({ target: dot, maxAge: 3500, minDistance: 0.035, stroke: ACCENT, strokeWidth: 0.075 });
        trace.setOpacity(0.75);
        this.add(trace);
        dot.z_index = 1;

        await this.play(new Create(dot), { duration: 500 });
        await this.wait(300);

        // Spline through waypoints
        const waypoints: Vec3[] = [
            new Vec3(-5, -2, 0),
            new Vec3(-2, 3, 3),
            new Vec3(1, -1, 0),
            new Vec3(4, 2, -3),
            new Vec3(6, -2, 0)
        ];

        await this.play(dot.animate.followPath(waypoints, {
            duration: 3000,
            rate_func: Rate.easeInOutSine()
        }));

        // await this.wait(400);

        // Spline returning to start using a Builder Path
        let path = (new Builder()).roundedRect(-5, -3, 10, 6, 1.5).build();
        path.setFill(Color.NONE).setStroke(0.035, hex("#334155"));
        this.add(path);

        while (1) {
            await this.play(dot.animate.followPath(waypoints, {
                duration: 3000,
                rate_func: Rate.easeInOutSine()
            }));

            await this.play(dot.animate.followPath(path, {
                duration: 2500,
                rate_func: Rate.easeInOutSine()
            }));
        }

    }
}
