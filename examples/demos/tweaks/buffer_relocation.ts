import { frameStage, demoCaption } from "../../shared/presentation";
import { Line, Scene, CameraController, Color, Vec2 } from "retiam";

export default class BufferReallocationTest extends Scene {
    public async run() {
        this.composer!.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 0, 150]);
        new CameraController(this, this.camera);
        frameStage(this, 85, 70);
        demoCaption(this, "Dynamic buffer growth", "A spiral extends one vertex at a time");

        const points: Vec2[] = [];
        const line = new Line(points, {
            stroke: Color.CYAN,
            strokeWidth: 0.8
        });

        // --- THE OPTIMIZATION ---
        // Explicitly opt-in to dynamic capacity scaling for this specific line
        line.geo.capacityMultiplier = 1.5;

        this.add(line);

        let angle = 0;
        let radius = 1;

        this.always(() => {
            // Add a new point every frame
            angle += 0.1;
            radius += 0.05;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            points.push(new Vec2(x, y));

            // Keep memory bounded to 5000 points
            if (points.length > 5000) {
                points.shift();
            }

            // Upload the new points to the GPU
            line.setVertices(points);
        });
    }
}
