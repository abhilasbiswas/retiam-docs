import { demoBackground } from "../../shared/presentation";
import {
    Scene,
    CameraController,
    Axes,
    FunctionGraph2D,
    Color,
    PerlinNoise,
    SimplexNoise,
    ValueNoise,
    WorleyNoise,
    WhiteNoise
} from "retiam";

export default class SynthWaveformNoiseScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Camera
        this.camera.position.set([0, 0, 16]);
        new CameraController(this, this.camera);

        // 2. Setup 2D Mathematical Axes
        const axes = new Axes({
            xRange: [-6, 6, 1],
            yRange: [-5.5, 5.5, 1],
            width: 18,
            height: 12,
            showGrid: true,
            dynamicGrid: true
        });
        this.add(axes);

        // 3. Instantiate Noise Generators
        const perlin = new PerlinNoise({ scale: 2.0 });
        const simplex = new SimplexNoise({ scale: 2.0 });
        const valueNoise = new ValueNoise({ scale: 2.0 });
        const worley = new WorleyNoise({ scale: 2.0, worleyReturnType: 'F1' });
        const fbm = new PerlinNoise({ scale: 2.0, octaves: 4, persistence: 0.5 });
        const ridged = new PerlinNoise({ scale: 2.0, octaves: 4, fractalType: 'ridged' });
        const whiteNoise = new WhiteNoise({ scale: 0.2 });

        const t = () => this.time * 0.0006;

        // 4. Multi-Track Synth Waveform Visualizer Curves

        // Track 1: White Noise PRNG Static (Top: White)
        const whiteGraph = new FunctionGraph2D(axes, (x) => whiteNoise.evaluate1D(x * 12 + t() * 60) * 0.35 + 4.2, {
            strokeWidth: 0.04,
            fill: new Color(0.95, 0.95, 0.95, 1.0)
        });
        this.add(whiteGraph);

        // Track 2: Perlin 1D (Cyan)
        const perlinGraph = new FunctionGraph2D(axes, (x) => perlin.evaluate1D(x + t()) * 0.8 + 2.8, {
            strokeWidth: 0.08,
            fill: new Color(0.0, 0.85, 1.0, 1.0)
        });
        this.add(perlinGraph);

        // Track 3: Simplex 1D (Emerald Green)
        const simplexGraph = new FunctionGraph2D(axes, (x) => simplex.evaluate1D(x + t() * 1.2) * 0.8 + 1.4, {
            strokeWidth: 0.08,
            fill: new Color(0.1, 0.95, 0.45, 1.0)
        });
        this.add(simplexGraph);

        // Track 4: Value Noise 1D (Golden Amber)
        const valueGraph = new FunctionGraph2D(axes, (x) => valueNoise.evaluate1D(x + t()) * 0.8 + 0.0, {
            strokeWidth: 0.08,
            fill: new Color(1.0, 0.8, 0.15, 1.0)
        });
        this.add(valueGraph);

        // Track 5: Worley Cellular 1D (Plasma Orange)
        const worleyGraph = new FunctionGraph2D(axes, (x) => worley.evaluate1D(x + t()) * 0.8 - 1.4, {
            strokeWidth: 0.08,
            fill: new Color(1.0, 0.45, 0.1, 1.0)
        });
        this.add(worleyGraph);

        // Track 6: FBM 4-Octave 1D (Neon Purple)
        const fbmGraph = new FunctionGraph2D(axes, (x) => fbm.evaluate1D(x + t()) * 0.8 - 2.8, {
            strokeWidth: 0.08,
            fill: new Color(0.75, 0.25, 1.0, 1.0)
        });
        this.add(fbmGraph);

        // Track 7: Ridged Multifractal 1D (Hot Magenta)
        const ridgedGraph = new FunctionGraph2D(axes, (x) => ridged.evaluate1D(x + t()) * 0.8 - 4.2, {
            strokeWidth: 0.08,
            fill: new Color(1.0, 0.15, 0.6, 1.0)
        });
        this.add(ridgedGraph);

        // 5. Dynamic Animation Loop
        this.always(() => {
            this.invalidate();
        });
    }
}
