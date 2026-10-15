import { demoBackground, framePerspective } from "../../shared/presentation";
import { Color, Text, Scene, CameraController, CustomComputePass, PostProcessPass, Shader, Torus } from "retiam";



export default class MultipassShowcase extends Scene {
    public async run() {
        // ---------------------------------------------------------
        // 0. SCENE & CAMERA SETUP
        // ---------------------------------------------------------
        this.camera.position.set([0, 0, 15]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);

        // ---------------------------------------------------------
        // 1. DATA GENERATION: Custom Compute Pass
        // ---------------------------------------------------------
        const gridRes = 256; // Higher resolution for smoother fluid!
        const numCells = gridRes * gridRes;

        // Allocate physical GPU Buffers
        const waveBuffer = this.device.createBuffer({
            size: numCells * 16, // array<vec4f> (16 bytes per cell)
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        const timeBuffer = this.device.createBuffer({
            size: 4, // 1 float32
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Define the compute shader that generates procedural fluid patterns
        const computeCode = `
            @group(0) @binding(0) var<uniform> time: f32;
            @group(0) @binding(1) var<storage, read_write> grid: array<vec4f>;

            @compute @workgroup_size(16, 16, 1)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let res = ${gridRes}u;
                if (id.x >= res || id.y >= res) { return; }

                let idx = id.y * res + id.x;
                let uv = vec2f(f32(id.x) / f32(res), f32(id.y) / f32(res)) - 0.5;

                // Procedural wave math
                let dist = length(uv);
                let wave = sin(dist * 30.0 - time * 5.0) * 0.5 + 0.5;

                // Techy grid colors (Cyan / Deep Blue)
                let r = max(0.0, 1.0 - dist * 2.0) * wave * 0.5;
                let g = 0.2 + wave * 0.5;
                let b = 0.8 + wave * 0.2;

                grid[idx] = vec4f(r, g, b, 1.0);
            }
        `;

        // Inject the Compute Pass into the FrameGraph using the RAW GPU Buffers
        const waveSimPass = new CustomComputePass(
            "WaveSimulation",
            computeCode,
            [timeBuffer],  // Dependencies to read
            [waveBuffer],  // Outputs to write
            [Math.ceil(gridRes / 16), Math.ceil(gridRes / 16), 1]
        );
        this.addPass(waveSimPass);

        // Update the time uniform every frame continuously
        this.always(() => {
            this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time * 0.002]));
        });

        // ---------------------------------------------------------
        // 2. SCENE CONSUMPTION: Rendering the Compute Data
        // ---------------------------------------------------------
        // THE FIX: Do NOT declare @group(3) @binding(0) here.
        // The Shader entity handles WGSL declarations automatically!
        const bgShaderCode = `
            // Map the screen UVs to the grid buffer index
            let res = ${gridRes}.0;
            let coord = vec2u(input.uv * res);
            let idx = min(coord.y * u32(res) + coord.x, u32(res * res) - 1u);

            // Output the computed color directly to the screen
            finalColor = grid[idx];
        `;

        // A massive 2D quad that fills the background
        const background = new Shader(60, 40, bgShaderCode);
        background.setStorageBuffer("grid", "array<vec4f>", waveBuffer, "read");
        background.z_index = -10; // Push far behind 3D objects
        this.add(background);

        // ---------------------------------------------------------
        // 3. 3D ENTITIES: PBR object interacting with background
        // ---------------------------------------------------------
        const torus = new Torus(3, 1.0, { radialSegments: 32, tubularSegments: 64 });
        // THE FIX: Make it highly metallic so it reflects light visibly!
        torus.material.color = new Float32Array([1.0, 0.7, 0.2]); // Gold
        torus.material.metallic = 1.0;
        torus.material.roughness = 0.15;
        this.add(torus);

        this.always(() => {
            torus.transform.rotateWorldX(this.dt * 0.001);
            torus.transform.rotateWorldY(this.dt * 0.0015);
            this.invalidate(); // Keeps the render loop continuously spinning
        });

        // ---------------------------------------------------------
        // 4. POST-PROCESSING: Glitch & CRT Filter
        // ---------------------------------------------------------
        const crtShaderCode = PostProcessPass.getDefaultShader(`
            // 1. Chromatic Aberration
            let offset = vec2f(0.003, 0.0);
            let r = textureSample(tex, samp, uv + offset).r;
            let g = textureSample(tex, samp, uv).g;
            let b = textureSample(tex, samp, uv - offset).b;

            // 2. CRT Scanlines
            let scanline = sin(uv.y * 1200.0) * 0.05;

            // 3. Vignette
            let dist = distance(uv, vec2f(0.5));
            let vignette = smoothstep(0.8, 0.3, dist);

            // Output the final composite pixel
            return vec4f((vec3f(r, g, b) - scanline) * vignette, 1.0);
        `);

        // Hook onto the end of the pipeline (reads from finalOutputHandle)
        const crtPass = new PostProcessPass("CRT_Filter", this.renderer.finalOutputHandle, crtShaderCode);
        this.addPass(crtPass);
    }
}
