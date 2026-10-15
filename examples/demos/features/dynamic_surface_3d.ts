import { demoBackground } from "../../shared/presentation";
import { Scene, Vec3, ThreeDAxes, SurfaceGraph3D, SurfaceViewStyle, OrbitCameraController } from "retiam";


export default class WelcomeScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // Set camera angle to look down obliquely at our 3D grid
        this.camera.position.set([12, 10, 16]);

        // Use Orbit camera controls so you can click and drag to view the 3D surface!
        new OrbitCameraController(this, this.camera, { radius: 18 });

        const axes = new ThreeDAxes({
            xRange: [-4, 4, 1],
            yRange: [-4, 4, 1],
            zRange: [-4, 4, 1],
            showGrid: true
        });
        this.add(axes);

        // A beautiful rotating concentric ripple function z = cos(r^2) / (r^2 + 1)
        const wave = new SurfaceGraph3D(axes, (x, y) => {
            const time = this.time * 0.002;
            const r2 = x*x + y*y;
            return Math.cos(r2 * 0.8 - time) * (2.5 / (r2 * 0.15 + 1.0));
        }, {
            uSegments: 75,
            vSegments: 75,
            viewStyle: SurfaceViewStyle.HEATMAP
        });
        this.add(wave);

        // Smoothly zoom the 3D Math Domain in and out
        this.always(() => {
            const time = this.time * 0.001;

            // Mathematically zoom X and Z ranges between [-2, 2] and [-6, 6]
            const zoomPower = 4 + Math.sin(time * 0.5) * 2;

            axes.setXRange(-zoomPower, zoomPower, 1);
            axes.setZRange(-zoomPower, zoomPower, 1);

            this.invalidate(); // Trigger WebGPU redraw
        });
    }
}
