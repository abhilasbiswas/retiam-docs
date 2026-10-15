import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Difference, Color, Line3D, Vec3, CapType, JointType, Circle, Instanced, ComputeKernel, Res, CameraModel, Rect, Write, Intersection, Exclusion, Union } from "retiam";

export default class BooleanTestScene extends Scene {
    public async run() {
        this.camera.position = [0,0,20];
        frameStage(this, 18, 16);
        demoCaption(this, "Boolean path operations", "Subtracting one filled silhouette from another");
        // 1. Create source primitives (You don't need to add them to the scene!)
        const circle = new Circle(4);
        circle.shift([2, 2, 0]);

        const square = new Rect(6, 6);
        square.shift([-1, -1, 0]);

        // 2. Perform the Set operation
        const moonShape = new Difference(new Union(circle, square), circle);
        moonShape.paint.fill = new Color(1, 0.718, 0, 1);
        moonShape.paint.strokeWidth = 0.1;

        // 3. Play the beautiful stroke writing animation!
        await this.play(new Write(moonShape, { duration: 2000 }));
    }
}
