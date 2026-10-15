import { demoBackground } from "../../shared/presentation";
import {
    Scene,
    CameraController,
    Axes,
    VectorField2D,
    SimplexNoise,
    PerlinNoise
} from "retiam";

export default class CosmicAuroraCurlScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Camera
        this.camera.position.set([0, 0, 16]);
        new CameraController(this, this.camera);

        // 2. Setup 2D Mathematical Axes
        const axes = new Axes({
            xRange: [-6, 6, 1],
            yRange: [-4, 4, 1],
            width: 20,
            height: 12,
            showGrid: true,
            dynamicGrid: true
        });
        this.add(axes);

        // 3. Multi-frequency Simplex noise potential fields for Curl evaluation
        const macroCurlNoise = new SimplexNoise({
            scale: 3.5,
            octaves: 3,
            persistence: 0.55
        });

        const microCurlNoise = new PerlinNoise({
            scale: 1.2,
            octaves: 2
        });

        // 4. Divergence-free 2D Curl Noise vector potential: V = ∇ × Ψ
        const vectorFunction = (x: number, y: number, time: number): [number, number] => {
            const macroCurl = macroCurlNoise.sampleCurl2D(x + time * 0.1, y + time * 0.15);
            const microCurl = microCurlNoise.sampleCurl2D(x * 1.5 - time * 0.2, y * 1.5);

            // Combine macro vortex swirl with micro turbulent ripples
            const dx = macroCurl.data[0] * 1.2 + microCurl.data[0] * 0.4;
            const dy = macroCurl.data[1] * 1.2 + microCurl.data[1] * 0.4;

            return [dx, dy];
        };

        // 5. Create 2D Cosmic Fluid Vector Field
        const vectorField = new VectorField2D(axes, vectorFunction, {
            xStep: 0.35,
            yStep: 0.35,
            arrowScale: 0.85,
            maxMagnitude: 1.8,
            normalize: true
        });
        this.add(vectorField);

        // 6. Smooth Orbital Camera Motion & Update Loop
        this.always(() => {
            const time = this.time * 0.0008;

            // Slowly orbit camera focus around cosmic fluid center
            const panX = Math.sin(time * 0.4) * 1.8;
            const panY = Math.cos(time * 0.5) * 1.2;
            const zoom = 5.5 + Math.sin(time * 0.3) * 1.5;

            axes.setXRange(-zoom + panX, zoom + panX, 1);
            axes.setYRange(-zoom * 0.65 + panY, zoom * 0.65 + panY, 1);

            this.invalidate();
        });
    }
}
