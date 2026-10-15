import { demoBackground } from "../../shared/presentation";
import { Scene, Axes, ParametricCurve2D, Color, Create, OrbitCameraController, Vec3, ParametricCurve3D, PathEffect, ThreeDAxes } from "retiam";



export default class Test3DScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // Setup 3D camera controls
        this.camera.position.set([10, 10, 10]);
        new OrbitCameraController(this, this.camera);

        const axes3d = new ThreeDAxes({
            xRange: [-5, 5, 1],
            yRange: [-5, 5, 1],
            zRange: [-5, 5, 1]
        });
        this.add(axes3d);

        // Helix: x = 3 * cos(t), y = 3 * sin(t), z = 0.5 * t
        const helix = new ParametricCurve3D(
            (t) => 3.0 * Math.cos(t),
            (t) => 0.5 * Math.cos(t * 5),
            (t) => 3.0 * Math.sin(t),
            axes3d,
            {
                tRange: [-Math.PI * 2, Math.PI * 2],
                samples: 300,
                stroke: new Color(1.0, 0.2, 0.6, 1.0),
                strokeWidth: 0.05,
                pathEffect: PathEffect.Glow(0.4) // Beautiful neon glow effect
            }
        );

        await this.play(new Create(helix, { duration: 4000 }));
    }
}
