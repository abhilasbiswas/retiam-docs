import {
    Scene,
    Color,
    Camera2DController,
    PolarAxes,
    Create,
    Rate
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class PolarAxesFeatureScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup Polar Coordinate System
        const polarAxes = new PolarAxes({
            radius: 5.5,
            rMax: 4,
            rStep: 1,
            thetaStep: Math.PI / 6,
            axisColor: new Color(0.6, 0.7, 0.9, 0.95),
            gridColor: new Color(0.2, 0.35, 0.55, 0.35),
            showGrid: true,
            showLabels: true
        });
        this.add(polarAxes);
        await this.play(new Create(polarAxes, { duration: 1200, rate_func: Rate.easeOutCubic() }));

        // 2. Plot Rose Curve: r(theta) = 3.5 * cos(4 * theta)
        const roseCurve = polarAxes.plotPolar((theta) => 3.5 * Math.cos(4 * theta), {
            thetaRange: [0, 2 * Math.PI],
            stroke: new Color(1.0, 0.3, 0.6, 1.0),
            strokeWidth: 0.06,
            samples: 300
        });
        await this.play(new Create(roseCurve, { duration: 1500 }));

        // 3. Plot Archimedean Spiral: r(theta) = 0.5 * theta
        const spiral = polarAxes.plotPolar((theta) => 0.5 * theta, {
            thetaRange: [0, 3 * Math.PI],
            stroke: new Color(0.2, 0.85, 1.0, 1.0),
            strokeWidth: 0.05,
            samples: 250
        });
        await this.play(new Create(spiral, { duration: 1500 }));

        await this.wait(2000);
    }
}
