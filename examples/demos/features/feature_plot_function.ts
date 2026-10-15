import { Scene, CameraController, Color, Axes, Vec3, FunctionGraph2D, ThreeDAxes, SurfaceGraph3D, SurfaceViewStyle, Waiting, OrbitCameraController } from "retiam";
import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";


export default class MathPlotScene extends Scene {
    public async run() {
        // 1. Setup Environment
        this.camera.position.set([0, 6, 30]);
        new OrbitCameraController(this, this.camera);

        // Optional dark presentation background
        this.clearColor(demoBackground());

        // ==========================================
        // DEMO 1: 2D Explicit Function (y = f(x))
        // ==========================================

        const axes2D = new Axes({
            xRange: [-2 * Math.PI, 2 * Math.PI, Math.PI / 2],
            yRange: [-2, 2, 1],
            width: 15,
            height: 5,
            showGrid: true
        });
        axes2D.transform.position = new Vec3(0, 10, 0); // Position it higher up
        this.add(axes2D);

        // A beautiful sine wave with an area fill
        const func2D = new FunctionGraph2D(axes2D, (x) => 0.25 * Math.sin(x) * Math.pow(Math.abs(x), 1.1), {
            stroke: new Color(1.0, 0.2, 0.5, 1.0),
            strokeWidth: 0.1,
            fill: new Color(1.0, 0.2, 0.5, 0.2) // 20% opacity pink fill
        });
        // func2D.moveTo(axes2D)

        // this.add(func2D);
        axes2D.add(func2D)
        this.always(() => {
            func2D.func = (x: number) => {
                return 0.25 * Math.sin(x) * Math.pow(Math.abs(x), (Math.sin(1 - this.time * 0.005) + 1) * 0.5);
            }
            func2D.updateGraph()
        })

        // ==========================================
        // DEMO 2: 3D Explicit Surface (z = f(x, y))
        // ==========================================

        const axes3D = new ThreeDAxes({
            xRange: [-5, 5, 2],
            yRange: [-5, 5, 2],
            zRange: [-2, 2, 1], // The height axis in our math world
            showGrid: true
        });
        axes3D.transform.position = new Vec3(0, 0, 0);
        // Tilt the axes slightly so we can see the 3D volume clearly
        axes3D.transform.setRotationX(Math.PI / 6);
        this.add(axes3D);

        // Math: Ripple (Sinc) function
        const rippleFunc = (x: number, y: number) => {
            const r = Math.sqrt(x * x + y * y);
            if (r === 0) return 2.0; // Prevent divide by zero spike
            return Math.sin(r * 2) / (r * 0.5);
        };

        const surface = new SurfaceGraph3D(axes3D, rippleFunc, {
            uSegments: 100, // High fidelity mesh
            vSegments: 100,
            viewStyle: SurfaceViewStyle.HEATMAP // Start with Heatmap
        });

        // Attach the surface to the 3D axes so it tilts seamlessly with it
        axes3D.add(surface);
        frameContent(this, [axes2D, axes3D], 0.35);
        demoCaption(this, "Functions and surfaces", "A changing sine curve above a three-dimensional ripple");

        // Keep rendering active indefinitely for camera dragging
        this.always(() => { this.invalidate(); });

        // ==========================================
        // ANIMATION: Cycling View Styles automatically
        // ==========================================

        const styles = [
            SurfaceViewStyle.HEATMAP,
            SurfaceViewStyle.CONTOUR,
            SurfaceViewStyle.DEPTH,
            SurfaceViewStyle.WIREFRAME,
            SurfaceViewStyle.SOLID
        ];

        let index = 0;
        while (true) {
            await this.play(new Waiting({ duration: 3000 })); // Wait 3 seconds
            index = (index + 1) % styles.length;

            // Switch style instantly on the fly
            surface.applyViewStyle(styles[index]);
        }
    }
}
