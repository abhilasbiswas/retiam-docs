import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Axes, FunctionGraph2D, Color, ImplicitCurve2D, ImplicitCurve2DGPU } from "retiam";


export default class WelcomeScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        new CameraController(this, this.camera);
        frameStage(this, 21, 21);
        demoCaption(this, "Dynamic implicit curves", "The domain pans and zooms while the functions stay fixed");

        const axes = new Axes({
            xRange: [-4, 4, 1],
            yRange: [-4, 4, 1],
            width: 16,
            height: 16,
            showGrid: true,
            dynamicGrid: true
        });
        this.add(axes);

        // 1. Add a standard FunctionGraph2D that is strictly limited from x=0 to x=3
        const parabola = new FunctionGraph2D(axes, (x) => x * x, {
            stroke: new Color(0.0, 1.0, 0.5, 1.0),
            strokeWidth: 0.1
        });
        parabola.updateGraph(0, 2); // Keep the visible segment within the y-domain.
        this.add(parabola);

        // 2. Add an Implicit Curve (Heart shape)
        const heart = new ImplicitCurve2DGPU(
            axes,
            `return (x*x + y*y) - 1.;`,
            { stroke: new Color(1.0, 0.2, 0.5, 1.0), strokeWidth: 0.1 }
        );
        this.add(heart);

        // Pan and Zoom continuously
        this.always(() => {
            const time = this.time * 0.001;

            // Zoom in and out over time
            const zoom = 4.5 + Math.sin(time) * 1.5;

            // Pan horizontally
            const panX = Math.cos(time * 0.5) * 1.2;

            axes.setXRange(-zoom + panX, zoom + panX);
            axes.setYRange(-zoom, zoom);

            // Must trigger re-evaluation of local bounds for the parabola
            // Parabola stays fixed to [0, 3], but its screen position moves!
            parabola.updateGraph(0, Math.min(3, Math.sqrt(zoom)));

            this.invalidate();
        });
    }
}
