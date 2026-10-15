import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Rect, SubScene, Color, Circle, CustomAnimation } from "retiam";

class MiniScene extends Scene {
    public async run() {
        const c = new Circle(15, { fill: Color.CYAN, strokeWidth: 0.5, stroke: Color.WHITE });
        this.add(c);

        this.always(() => {
            c.transform.rotateZ(this.dt * 0.005);
            this.invalidate();
        });
    }
}

export default class FrameworkIntegrationTest extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 85, 68);
        demoCaption(this, "Canvas layout integration", "The player follows the moving canvas");


        // 1. Mount a SubScene
        const sub = new SubScene(new MiniScene());
        sub.transform.shift([-20, 0, 0]);
        this.add(sub);

        const r = new Rect(20, 20, { fill: Color.RED });
        r.transform.shift([20, 0, 0]);
        this.add(r);

        // 2. Simulate React/Vue mutating the DOM layout mid-render
        let margin = 0;
        this.always(() => {
            margin = Math.sin(this.time * 0.005) * 50 + 50;
            // Shifting the DOM element itself! The PlayerControls overlay MUST follow it.
            (this.canvas as any).style.marginLeft = `${margin}px`;
            (this.canvas as any).style.marginTop = `${margin}px`;
        });

        await this.wait(5000);
    }
}
