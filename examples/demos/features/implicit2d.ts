import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Axes, ImplicitCurve2D, Color, OrbitCameraController } from "retiam";



export default class DesmosFillDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 15]);
        new CameraController(this, this.camera);
        frameStage(this, 16, 16);
        demoCaption(this, "A beating implicit heart", "An inequality fills the interior of the curve");

        const axes = new Axes({
            xRange: [-3, 3, 1],
            yRange: [-3, 3, 1],
            width: 12, height: 12,
            showGrid: true,
            gridColor: new Color(0.2, 0.2, 0.2, 0.5)
        });
        this.add(axes);

        // Fill an animated Heart!
        // The inequality is `<` so it fills the INSIDE of the equation.
        const filledHeart = new ImplicitCurve2D(axes, (x, y) => {
            const t = this.time * 0.005;
            // Add a beating effect
            const beat = 1.0 + 0.15 * Math.pow(Math.sin(t), 8);
            const xS = x / beat;
            const yS = y / beat;

            const a = xS * xS + yS * yS - 1;
            return a * a * a - xS * xS * yS * yS * yS;
        }, {
            operator: '<',
            fill: new Color(1.0, 0.2, 0.5, 0.4),  // Semi-transparent pink fill
            stroke: new Color(1.0, 0.2, 0.5, 1.0),// Solid pink outline
            strokeWidth: 0.1,
            resolution: 128 // Generates an ultra-fast 128x128 grid every frame
        });

        this.add(filledHeart);

        // Tell the engine to re-evaluate the function every frame
        this.always(() => {
            filledHeart.updateCurve();
            this.invalidate();
        });
    }
}
