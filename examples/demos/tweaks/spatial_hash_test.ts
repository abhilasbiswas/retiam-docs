import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, ThreeDAxes, SurfaceGraph3D, SurfaceViewStyle, Color, Circle, Vec3, OrbitCameraController } from "retiam";

export default class SpatialHashTest extends Scene {
    public async run() {
        this.camera.position.set([0, 15, 30]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A continuously generated surface", "A dense mesh intersects a transparent vector plane");

        const axes = new ThreeDAxes({
            xRange: [-5, 5, 1],
            yRange: [-2, 2, 1],
            zRange: [-5, 5, 1],
            showGrid: false
        });
        this.add(axes);

        // 1. Stress test the Math3D string hashing fix
        // Creating a dense 60x60 grid = 3600 vertices generated and welded every frame
        const surface = new SurfaceGraph3D(axes, (x, z) => {
            const d = Math.sqrt(x * x + z * z);
            return Math.sin(d - this.time * 0.005) * 1.5; // Animated wave
        }, {
            uSegments: 60,
            vSegments: 60,
            viewStyle: SurfaceViewStyle.HEATMAP,
        });
        this.add(surface);

        // 2. Stress test the Clip Space Z-Index fix
        // We place a 2D shape physically at Y=0.
        // It should perfectly slice through the middle of the 3D wave.
        const intersectCircle = new Circle(4, {
            stroke: Color.WHITE,
            strokeWidth: 0.1,
            fill: new Color(1, 0, 0, 0.4),
        });

        intersectCircle.transform.rotateX(Math.PI / 2);
        // We give it a high z_index. If the 3D fix failed, the wave would jump in front
        // of or behind the circle erratically instead of intersecting it.
        intersectCircle.z_index = 100;

        this.add(intersectCircle);
    }
}
