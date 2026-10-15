import { frameStage, demoCaption } from "../../shared/presentation";
import {
    Scene, OrbitCameraController, Vec3, Color, Rect, Circle,
    RIGHT, ORIGIN, UP, DOWN, Rate, GroupAnimator,
    CENTER
} from "retiam";

export default class TestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new OrbitCameraController(this, this.camera);
        frameStage(this, 160, 200);
        demoCaption(this, "Transforms and group pivots", "Shift, rotate and scale around shared anchors");

        const rect = new Rect(20, 20);
        rect.paint.fill = Color.RED;
        this.add(rect);

        const circle = new Circle(10, { anchor: CENTER });
        circle.paint.fill = Color.BLUE;
        this.add(circle);

        // 1. Initial manual placement
        circle.nextTo(rect, RIGHT, 5);

        await this.wait(500);

        // 2. Test Animator Builder explicitly (NO PROXIES INVOLVED!)
        // Notice we chain `.shift()`, `.rotate()`, and `.scale()` just like before.
        await this.play([
            rect.animate.shift(new Vec3(0, 20, 0)).rotate(Math.PI / 4).scale(1.5),
            circle.animate.snapTo(rect, ORIGIN).setFill(Color.GREEN)
        ], { duration: 2000, rate_func: Rate.easeInOutCubic() });

        await this.wait(500);

        // 3. Test GroupAnimator explicitly (NO PROXIES INVOLVED!)
        // The GroupAnimator calculates the bounding box of BOTH the rect and circle,
        // finds the exact bottom-edge (DOWN) of that bounding box, sets it as the pivot,
        // and rotates them both perfectly around that group edge.
        const groupAnim = [rect, circle];
        await this.play(
            this.getGroupAnimator(groupAnim).rotate(Math.PI, DOWN),
            { duration: 1500, rate_func: Rate.easeInOutQuad() }
        );
    }

    // Helper to get the group animator quickly
    private getGroupAnimator(entities: any[]) {
        return new GroupAnimator(entities, 0);
    }
}
