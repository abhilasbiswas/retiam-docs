import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, ParametricCurve3D, Circle, Color, VectorTransform, Rate, CustomAnimation, Vec3 } from "retiam";

export default class ComputeLimitTest extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 112, 110);
        demoCaption(this, "100,000-point morph", "A dense spiral transforms into a circle");

        // 1. Generate an insanely dense parametric curve (100,000 points)
        const denseCurve = new ParametricCurve3D(
            (t) => {
                const angle = t * Math.PI * 100; // 50 loops
                const r = t * 40;
                return new Vec3(Math.cos(angle) * r, Math.sin(angle) * r, 0);
            },
            {
                samples: 100000, // Trigger the > 65k element limit!
                stroke: Color.CYAN,
                strokeWidth: 0.1
            }
        );

        // 2. Generate a target circle
        const targetCircle = new Circle(40);
        targetCircle.paint.stroke = Color.MAGENTA;
        targetCircle.paint.strokeWidth = 0.5;
        targetCircle.paint.fill = Color.NONE;

        // Ensure the scene automatically prepares buffers
        this.add(denseCurve);

        await this.wait(1000);

        // 3. Morph 100,000 points into the circle!
        // If spread operators are used, this crashes the tab.
        // If prefix sum isn't recursive, the math breaks.
        const morphAnim = new VectorTransform(denseCurve, targetCircle, {
            duration: 3000,
            rate_func: Rate.easeInOutCubic()
        });

        await this.play(morphAnim);
        await this.wait(2000);
    }
}
