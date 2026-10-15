import { Scene, CameraController, Box, Sphere, Torus, Circle, ThreeDAxes, Vec3, Color } from "retiam";
import { demoBackground } from "../../shared/presentation";

// Standalone Isolated Scene Class A: Kinetic 3D Shapes
export default class SceneA extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        const box = new Box(12, 12, 12);
        box.material.color = new Color(0.1, 0.8, 1.0, 1.0);
        this.add(box);

        const torus = new Torus(18, 2);
        torus.material.color = new Color(1.0, 0.2, 0.6, 1.0);
        this.add(torus);

        this.always(() => {
            box.transform.rotateX(this.dt * 0.001);
            box.transform.rotateY(this.dt * 0.0015);
            torus.transform.rotateZ(this.dt * 0.0008);
            this.invalidate();
        });
    }
}

// Standalone Isolated Scene Class B: Pulsing 2D Geometry
export class SceneB extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        const circle = new Circle(18, { fill: Color.GREEN, strokeWidth: 1.0, stroke: Color.WHITE });
        this.add(circle);

        this.always(() => {
            const scale = 1.0 + Math.sin(this.time * 0.004) * 0.3;
            circle.transform.scale([scale, scale, 1]);
            circle.transform.rotateZ(this.dt * 0.002);
            this.invalidate();
        });
    }
}
