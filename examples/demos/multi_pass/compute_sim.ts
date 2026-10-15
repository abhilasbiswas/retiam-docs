import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, CustomComputePass, Shader, CameraController, Torus, Color } from "retiam";

export default class ComputeSimulationShowcase extends Scene {
    public async run() {
        // ---------------------------------------------------------
        // 0. SCENE & CAMERA SETUP
        // ---------------------------------------------------------
        this.camera.position.set([0, 0, 15]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Compute and render passes", "A procedural surface composed through the frame graph");

        const gridRes = 512;
        const numCells = gridRes * gridRes;

        // ---------------------------------------------------------
        // 1. ALLOCATE RAW GPU BUFFERS
        // ---------------------------------------------------------

        // Buffer A: Stores the output pixels of the simulation
        const simBuffer = this.device.createBuffer({
            size: numCells * 16, // array<vec4f> (16 bytes per cell)
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        // Buffer B: Stores the current time so the shader knows how to animate
        const timeBuffer = this.device.createBuffer({
            size: 16, // Minimum uniform alignment is 16 bytes (4 floats)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // ---------------------------------------------------------
        // 2. THE COMPUTE SHADER
        // ---------------------------------------------------------
        const computeCode = `
            // Binding 0 comes from the 'inputs' array in CustomComputePass
            @group(0) @binding(0) var<uniform> time: f32;

            // Binding 1 comes from the 'outputs' array in CustomComputePass
            @group(0) @binding(1) var<storage, read_write> grid: array<vec4f>;

            @compute @workgroup_size(16, 16, 1)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let res = ${gridRes}u;
                if (id.x >= res || id.y >= res) { return; }

                let idx = id.y * res + id.x;
                let uv = vec2f(f32(id.x) / f32(res), f32(id.y) / f32(res)) - 0.5;

                // Procedural Plasma Math using our explicit time uniform
                let wave = sin(length(uv) * 20.0 - time * 0.005);

                // Colors
                let r = max(0.0, 1.0 - length(uv) * 2.0) * wave * 0.5;
                let g = 0.2 + wave * 0.5;
                let b = 0.8 + wave * 0.2;

                grid[idx] = vec4f(r, g, b, 1.0);
            }
        `;

        const simPass = new CustomComputePass(
            "PlasmaSimulation",
            computeCode,
            [timeBuffer], // Inputs (maps to binding 0)
            [simBuffer],  // Outputs (maps to binding 1)
            [Math.ceil(gridRes / 16), Math.ceil(gridRes / 16), 1] // Dispatch grid
        );
        this.addPass(simPass);

        // Update the time uniform every single frame!
        this.always(() => {
            this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time, 0, 0, 0]));
        });

        // ---------------------------------------------------------
        // 3. RENDER THE COMPUTE DATA TO THE SCREEN
        // ---------------------------------------------------------
        const renderCode = `
            let res = ${gridRes}.0;
            let coord = vec2u(input.uv * res);
            let idx = min(coord.y * u32(res) + coord.x, u32(res * res) - 1u);

            finalColor = simData[idx];
        `;

        const screenQuad = new Shader(100, 100, renderCode);

        // Expose the GPU buffer to the Shader material
        screenQuad.setStorageBuffer("simData", "array<vec4f>", simBuffer, "read");
        screenQuad.z_index = -10; // Push behind 3D objects
        this.add(screenQuad);

        // ---------------------------------------------------------
        // 4. ADD A 3D OBJECT TO PROVE THEY COEXIST
        // ---------------------------------------------------------
        const torus = new Torus(3, 1.0, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(1.0, 0.7, 0.2, 1.0).rgba; // Gold
        torus.material.metallic = 1.0;
        torus.material.roughness = 0.15;
        this.add(torus);

        this.always(() => {
            torus.transform.rotateWorldX(this.dt * 0.001);
            torus.transform.rotateWorldY(this.dt * 0.0015);
            this.invalidate(); // Keeps the render loop continuously spinning
        });
    }
}
