import { Scene, CameraController, RaymarchedPlot3D, OrbitCameraController, Color, ParametricColorMode, SDFText, SurfaceViewStyle, ThreeDAxes, Vec3, RaymarchStyle, RaymarchColorMode, CameraModel, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";


export default class RaymarchDemo extends Scene {
    public async run() {
        this.clearColor(demoBackground());

        // let view = this.createView(this.canvas.width, this.canvas.height);
        // view.camera.position = [0, 5, 30]
        // view.camera.model = CameraModel.ORTHOGRAPHIC;
        // view.camera.seeOnlyLayers([2])


        this.camera.position.set([0, 4, 8]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, -1, 0), radius: 20 });

        const title = new SDFText("Raymarch 3D Plot", { fontSize: 3.2, anchor: CENTER });

        // title.setLayers([2])
        title.setAsUI();
        title.transform.position.set([0, 42, 0]);

        title.paint.fill = Color.Grey(0.7);
        this.add(title);

        const axes = new ThreeDAxes({
            xRange: [-6, 6, 2],
            yRange: [-3, 3, 1], // Matches physical boundaries
            zRange: [-6, 6, 2],
            width: 12,
            height: 3,
            depth: 12,
            fill: new Color(0.6, 0.6, 0.6, 0.5),
            showGrid: true,
        });
        this.add(axes);

        const equation = `
            let r1 = length(vec2<f32>(x - 1.5, z - 2.0));
            let r2 = length(vec2<f32>(x + 1.5, z + 1.5));

            let w1 = sin(r1 * 3.0) * exp(-r1 * 0.1);
            let w2 = cos(r2 * 2.5) * exp(-r2 * 0.1);

            return (w1 + w2) * min(view.time*0.002, 1.5);
        `;

        // Create the Plot and apply the NEW custom gradient!
        const plot = new RaymarchedPlot3D(axes, equation, {
            viewStyle: RaymarchStyle.CONTOUR,
            opacity: 1.0,
            gridColor: new Color(0, 0, 0, 0.7), // Dark contours to contrast the bright colors
            contourWidth: 0.06,
            // The magic custom color parameter!
            // Passing 4 stops: Purple -> Magenta -> Orange -> Yellow
            customColors: [
                new Color(0.0, 0.0, 0.4, 1.0), // Deep Purple at the bottom
                new Color(0.2, 0.2, 1.0, 1.0), // Magenta
                new Color(0.6, 0.5, 0.9, 1.0), // Bright Orange
                new Color(0.9, 0.9, 0.9, 1.0), // Glowing Yellow at the peaks
                new Color(0.5, 0.1, 0.1, 1.0), // Glowing Yellow at the peaks
                new Color(0.8, 0.0, 0.0, 1.0), // Glowing Yellow at the peaks
            ],
            showGrid: false
        });

        // plot.CAST_SHADOW = false;
        // plot.RECEIVE_SHADOW = false;

        plot.transform.shift([0, -1.0, 0]);
        this.add(plot);


        this.always(() => {
            const rotationSpeed = this.dt * 0.000015;
            plot.transform.rotateWorldY(rotationSpeed);
            axes.transform.rotateWorldY(rotationSpeed);
            this.invalidate();
        });
    }
}
