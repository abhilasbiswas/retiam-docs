// =========================================================================
// File: examples/demos/layout/arrange_compute_wave.ts
// Real-time WebGPU Compute Shader demo on a 65,536 instance Arrange layout
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Circle,
    Text,
    Arrange,
    UP,
    Vec3
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ArrangeComputeWaveScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        // 1. Establish 3D Perspective Camera & Orbit Navigation
        this.camera.position.set([0, 0, 100]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);

        // ---------------------------------------------------------------------
        // 2. High-Density 65,536 Element Lattice (256 x 256)
        // ---------------------------------------------------------------------
        const COLS = 256;
        const ROWS = 256;
        const COUNT = COLS * ROWS; // 65,536 instances

        const template = new Circle(0.12);
        template.paint.fill = Color.WHITE;

        // Initialize Arrange in GPU mode (1 single draw call for all 65k items)
        const grid = new Arrange(template, COUNT, { gpu: true })
            .arrangeGrid(ROWS, COLS, 0.08);

        // Tilt the plane slightly for ideal 3D horizon perspective
        grid.transform.position.set(0, 0, 0);
        this.add(grid);

        // ---------------------------------------------------------------------
        // 3. WebGPU Compute Shader: Real-Time Multi-Octave Wave Synthesis
        // Executes directly on the GPU instance storage buffer in VRAM every frame.
        // Zero CPU loops, zero CPU-GPU data transfers per frame!
        // ---------------------------------------------------------------------
        grid.onCompute(`
            let i = id.x;
            if (i >= uniforms.count) { return; }

            let p = instances[i].pos_scale.xyz;
            let t = uniforms.time*0.001;

            // 1. Radial distance from center
            let r = length(p.xy);

            // 2. Concentric ripple wavefront
            let ripple = sin(r * 0.4 - t * 3.6);

            // 3. Dual traveling cross waves
            let crossWave = cos(p.x * 0.28 + t * 2.2) * sin(p.y * 0.28 - t * 1.8);

            // 4. Harmonic vortex spiral twist
            let angle = atan2(p.y, p.x);
            let spiral = sin(r * 0.18 - angle * 2.0 - t * 1.4);

            // Combined 3D elevation displacement
            let elevation = (ripple * 0.65 + crossWave * 0.45 + spiral * 0.3) * 3.2;
            instances[i].pos_scale.z = elevation;

            // 5. Dynamic scale pulsing on wave crests
            let normElevation = elevation / 3.2;
            let scalePulse = clamp(0.7 + 0.6 * normElevation, 0.25, 1.75);
            instances[i].pos_scale.w = scalePulse;

            // 6. Dynamic Cyberpunk / Aurora HSV palette via standard hsv2rgb helper
            let hue = fract((r * 0.025) + (normElevation * 0.22) + (t * 0.06));
            let saturation = 0.85 + 0.15 * cos(normElevation * 3.1415);
            let value = clamp(0.7 + 0.3 * normElevation, 0.4, 1.0);

            let rgb = hsv2rgb(vec3f(hue, saturation, value));
            instances[i].color = vec4f(rgb, 0.95);
        `);

        // ---------------------------------------------------------------------
        // 4. UI Title & Overlay Information
        // ---------------------------------------------------------------------
        const title = new Text("65,536 Primitives — WebGPU Compute Shader", { anchor: CENTER,
            fontSize: 1.8
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        title.transform.position.set(0, 24, 6);
        this.add(title);

        const subtitle = new Text("Real-Time Multi-Octave Wave Synthesis • 1 Single Draw Call • 0% CPU Overhead", { anchor: CENTER,
            fontSize: 0.95
        });
        subtitle.paint.fill = new Color(0.4, 0.8, 1.0, 0.9);
        subtitle.transform.position.set(0, 21.5, 6);
        this.add(subtitle);

        const instruction = new Text("Left Drag: Orbit in 3D  •  Scroll: Zoom View", { anchor: CENTER,
            fontSize: 0.75
        });
        instruction.paint.fill = new Color(0.6, 0.6, 0.7, 0.7);
        instruction.transform.position.set(0, -24, 6);
        this.add(instruction);
    }
}
