import {
    Scene,
    Color,
    Camera2DController,
    NumberPlane,
    Create,
    Rate,
    FadeIn
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class NumberPlaneFeatureScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup NumberPlane with primary axes and background grid
        const plane = new NumberPlane({
            xRange: [-8, 8, 1],
            yRange: [-5, 5, 1],
            width: 18,
            height: 11,
            axisColor: new Color(0.7, 0.8, 0.95, 1.0),
            gridColor: new Color(0.2, 0.35, 0.55, 0.35),
            subdivisions: 50,
            showLabels: true
        });
        this.add(plane);
        await this.play(new Create(plane, { duration: 1200, rate_func: Rate.easeOutCubic() }));

        // 2. Plot mathematical curves directly on the plane
        const sineWave = plane.plot((x) => 2 * Math.sin(0.8 * x), {
            stroke: new Color(0.3, 0.8, 1.0, 1.0),
            strokeWidth: 0.065
        });

        const dampedWave = plane.plot((x) => 2.5 * Math.exp(-0.15 * Math.abs(x)) * Math.cos(1.2 * x), {
            stroke: new Color(1.0, 0.4, 0.5, 1.0),
            strokeWidth: 0.065
        });

        await this.play(new Create(sineWave, { duration: 1000 }));
        await this.play(new Create(dampedWave, { duration: 1000 }));

        // 3. Mark key coordinates using plane.getDot() and plane.getLabeledDot()
        const dotOrigin = plane.getLabeledDot("O", [0, 0], {
            radius: 0.22,
            fill: Color.WHITE,
            labelColor: Color.BLACK
        });
        const peakDot = plane.getLabeledDot("Max", [Math.PI / 1.6, 2], {
            radius: 0.25,
            fill: new Color(0.3, 0.8, 1.0, 1.0),
            labelColor: Color.BLACK
        });

        await this.play(new FadeIn(dotOrigin, { duration: 500 }));
        await this.play(new FadeIn(peakDot, { duration: 500 }));

        await this.wait(2000);
    }
}
