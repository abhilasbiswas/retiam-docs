import {
    Scene,
    Color,
    OrbitCameraController,
    ThreeDAxes,
    SurfaceGraph3D,
    SurfaceViewStyle,
    ParametricCurve3D,
    Vec3,
    Create,
    Rate,
    FadeIn
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ThreeDAxesFeatureScene extends Scene {
    public async run() {
        this.camera.position.set([12, 10, 16]);
        this.clearColor(demoBackground());
        new OrbitCameraController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup 3D Coordinate System
        const axes3D = new ThreeDAxes({
            xRange: [-5, 5, 2],
            yRange: [-5, 5, 2],
            zRange: [-3, 3, 1],
            width: 10,
            depth: 10,
            height: 6,
            axisColor: new Color(0.7, 0.8, 0.95, 1.0),
            gridColor: new Color(0.2, 0.35, 0.55, 0.35),
            showGrid: true,
            gridPlanes: ["xy", "xz", "yz"]
        });
        this.add(axes3D);
        await this.play(new Create(axes3D, { duration: 1200, rate_func: Rate.easeOutCubic() }));

        // 2. Plot 3D Parametric Helix Curve: gamma(t) = (2 cos t, 2 sin t, 0.3 t)
        const helix = axes3D.plotParametricCurve3D(
            (t) => 2.5 * Math.cos(t),
            (t) => 2.5 * Math.sin(t),
            (t) => 0.25 * t - 2.0,
            {
                tRange: [0, 5 * Math.PI],
                stroke: new Color(1.0, 0.3, 0.7, 1.0),
                strokeWidth: 0.08,
                samples: 250
            }
        );
        await this.play(new Create(helix, { duration: 1500 }));

        // 3. Plot 3D Sinc Ripple Surface
        const surface = new SurfaceGraph3D(
            axes3D,
            (x, y) => {
                const r = Math.sqrt(x * x + y * y);
                return r === 0 ? 2.0 : (2.0 * Math.sin(r * 1.5)) / r;
            },
            {
                uSegments: 60,
                vSegments: 60,
                viewStyle: SurfaceViewStyle.HEATMAP
            }
        );
        axes3D.add(surface);
        await this.play(new FadeIn(surface, { duration: 1200 }));

        await this.wait(3000);
    }
}
