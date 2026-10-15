import { demoBackground } from "../../shared/presentation";
import { Scene, CameraController, Axes, VectorField2D } from "retiam";


export default class WelcomeScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Camera
        this.camera.position.set([0, 0, 18]);
        new CameraController(this, this.camera);

        // 2. Setup the Dynamic Axes
        const axes = new Axes({
            xRange: [-5, 5, 1],
            yRange: [-3, 3, 1],
            width: 20,
            height: 12,
            showGrid: true,
            dynamicGrid: true // Automatically subdivides as we zoom!
        });
        this.add(axes);

        // 3. Define a time-varying swirling vector field
        const vectorFunction = (x: number, y: number, time: number): [number, number] => {
            // A beautiful mathematical fluid curl with a slight inward sink
            const dx = Math.sin(y * 1.5 + time) - x * 0.1;
            const dy = Math.cos(x * 1.5 - time) - y * 0.1;
            return [dx, dy];
        };

        // 4. Attach Vector Field to Axes
        const vectorField = new VectorField2D(axes, vectorFunction, {
            xStep: 0.5,           // Space between arrows in mathematical units
            yStep: 0.5,
            arrowScale: 0.8,      // Scale arrows relative to the grid gap
            maxMagnitude: 2.0,    // Color mapping threshold
            normalize: true       // Keep arrows the same length, just color them based on strength
        });
        this.add(vectorField);

        // 5. Dynamic Camera Panning & Zooming
        this.always(() => {
            const time = this.time * 0.001; // Current time in seconds

            // Mathematically Zoom In and Out over a 10-second period
            // Zooms between a scale of 2x and 8x
            const zoom = 5 + Math.sin(time * 0.5) * 3;

            // Slowly Pan the center around in a circle
            const panX = Math.cos(time * 0.3) * 2;
            const panY = Math.sin(time * 0.4) * 2;

            // Update the axes ranges.
            // The VectorField2D will intercept this and automatically recalculate!
            axes.setXRange(-zoom + panX, zoom + panX, 1);
            axes.setYRange(-zoom * 0.6 + panY, zoom * 0.6 + panY, 1);

            // Force redraw since geometry was updated
            this.invalidate();
        });
    }
}
