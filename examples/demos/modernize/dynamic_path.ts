import { frameStage, demoCaption } from "../../shared/presentation";
import {
    Scene, OrbitCameraController, Path, Color, Rect, GPUAllocator
} from "retiam";

export default class TestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new OrbitCameraController(this, this.camera);
        frameStage(this, 60, 60);
        demoCaption(this, "An expanding path buffer", "An empty path becomes a pair of crossing strokes");

        // 1. Create an intentionally empty path.
        // In the old engine, this would crash without the monkey-patch.
        // Now, it should safely use GPUAllocator.safeCreateBuffer and allocate 256 bytes.
        const emptyPath = new Path("");
        emptyPath.paint.stroke = Color.RED;
        emptyPath.paint.strokeWidth = 0.5;
        this.add(emptyPath);

        // 2. Add a rectangle to ensure standard rendering still works alongside it
        const rect = new Rect(20, 20);
        rect.paint.fill = Color.BLUE;
        this.add(rect);

        await this.wait(1000);

        // 3. Dynamically populate the empty path to prove the buffer expands safely
        // and that our data-upload pipelines are healthy
        emptyPath.setVertices("M -20 -20 L 20 20 M -20 20 L 20 -20");

        await this.wait(2000);
    }
}
