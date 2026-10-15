import { demoBackground } from "../../shared/presentation";
import { CameraController, Color, MathShape3D, OrbitCameraController, Scene, Vec3 } from "retiam";


export default class MathVisualizationScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // Set up orbital controls
        this.camera.position.set([0, 0, 30]);
        new OrbitCameraController(this, this.camera, { radius: 20 });

        // 1. Create a transparent Box with clean white strokes
        const box = MathShape3D.Box(4, 4, 4, {
            fill: new Color(0.1, 0.6, 1.0, 1.0), // Sky Blue
            stroke: new Color(1.0, 1.0, 1.0, 1.0),
            strokeWidth: 0.04,
            fillOpacity: 0.9,
            transmission: 0.0
        });
        box.transform.position = new Vec3(-6, 0, 0);
        this.add(box);

        // 2. Create a transparent Torus with highlighted details
        const torus = MathShape3D.Torus(3.0, 1.0, 12, 32, {
            fill: new Color(1.0, 0.2, 0.6, 1.0), // Deep Pink
            stroke: new Color(1.0, 1.0, 1.0, 0.8),
            strokeWidth: 0.03,
            fillOpacity: 0.3,
            transmission: 0.5
        });
        torus.transform.position = new Vec3(6, 0, 0);
        this.add(torus);

        // 3. Create a structured Math Sphere
        const sphere = MathShape3D.Sphere(3.5, 10, {
            fill: new Color(0.1, 0.8, 0.4, 1.0), // Emerald Green
            stroke: new Color(1.0, 1.0, 1.0, 0.9),
            strokeWidth: 0.03,
            fillOpacity: 0.2,
            transmission: 0.6
        });
        sphere.transform.position = new Vec3(0, 5, -5);
        this.add(sphere);

        // Rotate them smoothly over time
        this.always(() => {
            box.transform.rotateWorldY(this.dt * 0.0005);
            box.transform.rotateWorldX(this.dt * 0.0002);

            torus.transform.rotateWorldY(this.dt * -0.0004);
            torus.transform.rotateWorldX(this.dt * 0.0003);

            sphere.transform.rotateWorldY(this.dt * 0.0002);

            this.invalidate();
        });
    }
}
