import {
    Scene,
    Color,
    Camera2DController,
    ComplexPlane,
    Complex,
    Field,
    HomotopyAnimation,
    Create,
    Rate
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ComplexPlaneFeatureScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup Complex Plane (Re vs Im)
        const cPlane = new ComplexPlane({
            realRange: [-5, 5, 1],
            imagRange: [-3, 3, 1],
            width: 14,
            height: 8.4,
            subdivisions: 50,
            axisColor: new Color(0.4, 0.9, 1.0, 0.95),
            gridColor: new Color(0.18, 0.5, 0.85, 0.3),
            showLabels: true
        });
        this.add(cPlane);
        await this.play(new Create(cPlane, { duration: 1000, rate_func: Rate.easeOutCubic() }));

        // 2. Plot Complex Trajectory: gamma(t) = 1.6 e^{i t} + 0.5 e^{i 3t}
        const epicycle = cPlane.plotComplexCurve(
            (t) => {
                const z1 = Complex.polar(1.6, t);
                const z2 = Complex.polar(0.5, 3 * t);
                return z1.add(z2);
            },
            [0, 2 * Math.PI],
            {
                stroke: new Color(1.0, 0.35, 0.75, 1.0),
                strokeWidth: 0.065,
                samples: 250
            }
        );
        this.add(epicycle);
        await this.play(new Create(epicycle, { duration: 1200 }));

        // 3. Conformal Space Deformation: f(z) = z + 0.25 * sin(1.4 * z)
        const conformalField = Field.conformal((z) => {
            return z.add(z.mul(1.4).sin().mul(0.25));
        });

        // Warp both ComplexPlane and plotted curve in 1:1 synchronization
        await this.play(
            new HomotopyAnimation([cPlane, epicycle], conformalField, {
                duration: 3500,
                rate_func: Rate.easeInOut(3)
            })
        );

        await this.wait(800);

        // Restore back to flat Euclidean space
        await this.play(
            new HomotopyAnimation([cPlane, epicycle], conformalField, {
                duration: 2500,
                fromProgress: 1.0,
                toProgress: 0.0,
                rate_func: Rate.smooth()
            })
        );

        await this.wait(1500);
    }
}
