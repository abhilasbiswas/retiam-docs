import { demoBackground } from "../../shared/presentation";
import { Scene, Axes, ParametricCurve2D, Color, Create, OrbitCameraController, Vec3 } from "retiam";


export default class Test2DScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        this.camera.position = [0, 0, 10];
        new OrbitCameraController(this, this.camera, { radius: 20 });
        const axes = new Axes({
            xRange: [-10, 10, 2],
            yRange: [-10, 10, 2],
            width: 12,
            height: 12
        });
        this.add(axes);

        // Spiral: x = (0.5 * t) * cos(t), y = (0.5 * t) * sin(t)
        const spiral = new ParametricCurve2D(
            (t) => 0.5 * t * Math.cos(t),
            (t) => 0.5 * t * Math.sin(t),
            axes,
            {
                tRange: [0, Math.PI * 4],
                samples: 200,
                stroke: new Color(0.0, 1.0, 0.8, 1.0),
                strokeWidth: 0.1
            }
        );

        // Introduces the curve sequentially using the system creation algorithm [2]
        await this.play(new Create(spiral, { duration: 3000 }));
    }
}
