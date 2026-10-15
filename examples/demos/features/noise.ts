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
    WorleyNoise,
    SimplexNoise
} from "retiam";

export default class CyberLandscapeScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Camera for Cinematic 3D Orbit View
        this.camera.position.set([14, 10, 18]);
        new OrbitCameraController(this, this.camera, { radius: 22 });

        // 2. Setup 3D Axes
        const axes = new ThreeDAxes({
            xRange: [-6, 6, 1],
            yRange: [-3.5, 4.5, 1],
            zRange: [-6, 6, 1],
            showGrid: true
        });
        this.add(axes);

        // 3. Multi-layer procedural noise setup
        // Layer A: Multi-octave FBM domain-warped Perlin terrain
        const domainWarpTerrain = new PerlinNoise({
            octaves: 5,
            persistence: 0.52,
            lacunarity: 2.1,
            scale: 3.2,
            domainWarp: {
                intensity: 1.2,
                frequency: 0.45,
                octaves: 3
            }
        });

        // Layer B: Organic Worley cellular Voronoi ridges
        const worleyRidges = new WorleyNoise({
            scale: 2.2,
            distanceMetric: 'euclidean',
            worleyReturnType: 'F2minusF1'
        });

        // Layer C: High-frequency Simplex noise ripples
        const simplexMicro = new SimplexNoise({
            scale: 0.8
        });

        // 4. Custom Bioluminescent Cyberpunk Gradient Palette
        const neonPalette: Color[] = [
            new Color(0.05, 0.02, 0.25, 1.0), // Deep Void Indigo
            new Color(0.2, 0.1, 0.6, 1.0),   // Electric Violet
            new Color(0.0, 0.7, 0.9, 1.0),   // Neon Cyan
            new Color(0.1, 0.95, 0.5, 1.0),  // Emerald Glow
            new Color(1.0, 0.85, 0.2, 1.0),  // Solar Gold
            new Color(1.0, 0.2, 0.5, 1.0)    // Plasma Pink
        ];

        // 5. Create Cyber Surface Mesh
        const cyberSurface = new SurfaceGraph3D(axes, (x, z) => {
            const time = this.time * 0.0006;

            // Evaluate domain-warped FBM landscape
            const baseElevation = domainWarpTerrain.evaluate3D(x, time * 0.5, z) * 2.8;

            // Add Voronoi cellular ridge details
            const cellularDetail = worleyRidges.evaluate2D(x * 0.9 + time * 0.2, z * 0.9) * 1.1;

            // Add micro Simplex wave ripples
            const microRipple = simplexMicro.evaluate2D(x * 3.0 + time, z * 3.0) * 0.25;

            return baseElevation + cellularDetail + microRipple;
        }, {
            uSegments: 100,
            vSegments: 100,
            viewStyle: SurfaceViewStyle.HEATMAP,
            customColors: neonPalette
        });
        this.add(cyberSurface);

        // 6. Dynamic Animation Loop
        this.always(() => {
            this.invalidate(); // Trigger WebGPU redraw
        });
    }
}
