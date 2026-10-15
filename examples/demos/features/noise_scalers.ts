import { demoBackground } from "../../shared/presentation";
import {
    Scene,
    Vec3,
    ThreeDAxes,
    SurfaceGraph3D,
    SurfaceViewStyle,
    OrbitCameraController,
    Color,
    PerlinNoise,
    NoiseScaler,
    SimplexNoise
} from "retiam";

export default class CyberCitadelScalersScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Orbit Camera
        this.camera.position.set([13, 11, 17]);
        new OrbitCameraController(this, this.camera, { radius: 21 });

        // 2. Setup 3D Axes
        const axes = new ThreeDAxes({
            xRange: [-5.5, 5.5, 1],
            yRange: [-3.5, 4.5, 1],
            zRange: [-5.5, 5.5, 1],
            showGrid: true
        });
        this.add(axes);

        // 3. Multi-Octave Base Noise
        const baseNoise = new PerlinNoise({
            scale: 3.2,
            octaves: 4,
            persistence: 0.52
        });

        // 4. Chainable NoiseScaler pipeline:
        // Apply power gamma curve (x^2.5) to sharpen peak ridges, remap height range, and quantize into 9 topological terrace steps
        const terracedScaler = new NoiseScaler(baseNoise)
            .curvePower(2.2)
            .range(-2.8, 3.2)
            .quantizeSteps(9);

        // 5. Custom Futuristic Topological Heatmap Palette
        const citadelPalette: Color[] = [
            new Color(0.02, 0.05, 0.2, 1.0),  // Deep Trench Blue
            new Color(0.1, 0.3, 0.7, 1.0),   // Cobalt Ocean
            new Color(0.0, 0.75, 0.8, 1.0),  // Cyan Terrace
            new Color(0.2, 0.9, 0.4, 1.0),   // Emerald Plateau
            new Color(0.95, 0.85, 0.1, 1.0), // Golden Level
            new Color(1.0, 0.4, 0.0, 1.0),   // Magma Summit
            new Color(1.0, 0.1, 0.4, 1.0)    // Plasma Crystal Peak
        ];

        // 6. Create Terraced Cyber Citadel Surface Mesh
        const citadelSurface = new SurfaceGraph3D(axes, (x, z) => {
            const time = this.time * 0.0005;
            return terracedScaler.sample2D(x + Math.sin(time * 0.5) * 0.5, z + time * 0.3);
        }, {
            uSegments: 90,
            vSegments: 90,
            viewStyle: SurfaceViewStyle.HEATMAP,
            customColors: citadelPalette
        });
        this.add(citadelSurface);

        // 7. Update Loop
        this.always(() => {
            this.invalidate();
        });
    }
}
