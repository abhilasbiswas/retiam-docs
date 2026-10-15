import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Axes, FunctionGraph2D, Color } from "retiam";


export default class WelcomeScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        new CameraController(this, this.camera);
        frameStage(this, 21, 13);
        demoCaption(this, "A changing mathematical domain", "A high-frequency sine wave across an expanding grid");

        const axes = new Axes({
            xRange: [-2, 2, 1], // Initial mathematical range
            yRange: [-3, 3, 1],
            width: 16,          // Physical width on screen
            height: 8,
            showGrid: true,
            dynamicGrid: true   // Turn on the fractal/auto-subdividing grid!
        });
        this.add(axes);

        // A high-frequency sine wave so we can zoom out to see it pack together
        const graph = new FunctionGraph2D(axes, (x) => Math.sin(x * 5), {
            strokeWidth: 0.08,
            fill: new Color(0.2, 0.8, 1.0, 0.3)
        });
        this.add(graph);

        // Exponential Zoom Out over Time
        this.always(() => {
            const time = this.time * 0.001;

            // X spans exponentially from [-2, 2] out to [-200, 200]
            const zoomPower = 2 * Math.pow(10, Math.sin(time * 0.5) * 2);
            axes.setXRange(-zoomPower, zoomPower);
            axes.setYRange(-zoomPower, zoomPower);

            // Force redraw since geometry updated
            this.invalidate();
        });
    }
}
