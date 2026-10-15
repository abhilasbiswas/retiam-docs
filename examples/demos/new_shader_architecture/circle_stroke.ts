import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Circle } from "retiam";



export default class ModernCircleScene extends Scene {
    public async run() {

        this.camera.position.set([0, 0, 820]);
        new CameraController(this, this.camera);
        frameStage(this, 320, 310);
        demoCaption(this, "Custom stroke shading", "A dashed contour traces the circle");

        const circle1 = new Circle(100);
        // circle1.transform.position.set([-150, 0, 0]);
        circle1.paint.fill = new Color(0.8, 0.2, 0.2, 1.0);
        circle1.paint.stroke = new Color(1.0, 1.0, 1.0, 0.5);
        circle1.paint.strokeWidth = 10;
        this.add(circle1);

        // Animated Dashed Circle (Custom Fragment injected perfectly via Domain Templates)
        const dashShader = `
                fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
                    let dashCount = 12.0;
                    let dash = sin(t * TWO_PI * dashCount);
                    if (dash < 0.0) { return vec4f(0.0); }
                    return col;
                }
            `;
        const circle2 = new Circle(100, { strokeShader: dashShader });
        // circle2.transform.position.set([150, 0, 0]);
        circle2.paint.fill = new Color(0.0, 0.0, 0.0, 0.0);
        circle2.paint.stroke = new Color(0.8, 0.8, 1.0, 1.00);
        circle2.paint.strokeWidth = 15;
        this.add(circle2);

        // Animate the line drawing over time using the state manager
        this.always(() => {
            circle2.state.transform.t2 = (this.time * 0.0005) % 1.0;
            this.invalidate();
        });
    }
}
