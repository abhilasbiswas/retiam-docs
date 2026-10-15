import { demoBackground, framePerspective } from "../../shared/presentation";
import { Color, Text, Scene, CameraController, CustomComputePass, PostProcessPass, Shader, Torus, Box, MathShape3D, OrbitCameraController } from "retiam";



export default class NeonCyberCore extends Scene {
    public async run() {
        // ---------------------------------------------------------
        // 0. SCENE & CAMERA SETUP
        // ---------------------------------------------------------
        this.camera.position.set([0, 0, 20]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);

        // ---------------------------------------------------------
        // 1. DATA GENERATION: Compute Shader Plasma Field
        // ---------------------------------------------------------
        const gridRes = 256;
        const numCells = gridRes * gridRes;

        // A single float per cell is enough for plasma intensity
        const plasmaBuffer = this.device.createBuffer({
            size: numCells * 4, // array<f32> (4 bytes per cell)
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        const timeBuffer = this.device.createBuffer({
            size: 4, // 1 float32
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Compute shader: Procedural continuous plasma noise
        const computeCode = `
            @group(0) @binding(0) var<uniform> time: f32;
            @group(0) @binding(1) var<storage, read_write> grid: array<f32>;

            @compute @workgroup_size(16, 16, 1)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let res = ${gridRes}u;
                if (id.x >= res || id.y >= res) { return; }

                let idx = id.y * res + id.x;
                let uv = vec2f(f32(id.x) / f32(res), f32(id.y) / f32(res)) * 10.0;
                let t = time * 1.5;

                // Procedural Plasma Math
                var v = sin(uv.x + t);
                v += sin(uv.y + t);
                v += sin(uv.x + uv.y + t);
                v += sin(length(uv - vec2f(5.0)) + t);

                grid[idx] = v; // Store intensity
            }
        `;

        const plasmaComputePass = new CustomComputePass(
            "PlasmaSimulation",
            computeCode,
            [timeBuffer],    // Read dependencies
            [plasmaBuffer],  // Write dependencies
            [Math.ceil(gridRes / 16), Math.ceil(gridRes / 16), 1]
        );
        this.addPass(plasmaComputePass);

        this.always(() => {
            this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time * 0.001]));
        });

        // ---------------------------------------------------------
        // 2. 2D BACKGROUND: Mapping Plasma Data to Color
        // ---------------------------------------------------------
        const bgShaderCode = `
            let res = ${gridRes}.0;
            let coord = vec2u(input.uv * res);
            let idx = min(coord.y * u32(res) + coord.x, u32(res * res) - 1u);

            let v = grid[idx] * 0.25; // Normalize somewhat

            // Cyberpunk Dark Palette Mapping
            let r = sin(v * 3.14) * 0.5 + 0.5;
            let g = cos(v * 3.14) * 0.5 + 0.5;
            let b = sin(v * 3.14 + 1.5) * 0.5 + 0.5;

            finalColor = vec4f(r * 0.1, g * 0.05, b * 0.25, 1.0); // Keep it dark
        `;

        const background = new Shader(80, 50, bgShaderCode);
        background.setStorageBuffer("grid", "array<f32>", plasmaBuffer, "read");
        background.z_index = -10;
        this.add(background);

        // ---------------------------------------------------------
        // 3. 3D ENTITIES: Nested Solid & Wireframe
        // ---------------------------------------------------------

        // Inner Core: Solid, highly metallic block
        const coreBox = new Box(4, 4, 4);
        coreBox.material.color = new Float32Array([0.1, 0.8, 0.4]); // Emerald Green
        coreBox.material.metallic = 0.9;
        coreBox.material.roughness = 0.1;
        this.add(coreBox);

        // Outer Shell: Refractive mathematical wireframe
        const wireSphere = MathShape3D.Sphere(6, 12, {
            stroke: new Color(0.9, 0.2, 0.8, 1.0), // Neon Pink edges
            strokeWidth: 0.06,
            fill: new Color(0.2, 0.0, 0.3, 1.0),   // Dark purple glass
            fillOpacity: 0.15,
            transmission: 0.8,                          // High transparency
            roughness: 0.0                              // Perfectly smooth glass
        });
        this.add(wireSphere);

        // Animate the 3D nesting dynamically
        this.always(() => {
            coreBox.transform.rotateWorldX(this.dt * 0.002);
            coreBox.transform.rotateWorldY(this.dt * 0.003);

            wireSphere.transform.rotateWorldZ(-this.dt * 0.001);
            wireSphere.transform.rotateWorldY(-this.dt * 0.0005);

            this.invalidate(); // Keeps the render loop continuously spinning
        });

        // ---------------------------------------------------------
        // 4. POST-PROCESSING: Sobel Edge Detection + RGB Split
        // ---------------------------------------------------------
        const edgeDetectionCode = PostProcessPass.getDefaultShader(`
            let texel = 1.0 / vec2f(textureDimensions(tex));

            // --- 1. Chromatic RGB Split (Color Fringing) ---
            let offset = vec2f(0.004, 0.0);
            let rBase = textureSample(tex, samp, uv + offset).r;
            let bBase = textureSample(tex, samp, uv - offset).b;
            let baseColor = textureSample(tex, samp, uv);
            let rgbSplit = vec3f(rBase, baseColor.g, bBase);

            // --- 2. Sobel Edge Detection ---
            // Samples the neighbors to find geometric/color boundaries
            let tl = textureSample(tex, samp, uv + vec2f(-texel.x, -texel.y)).rgb;
            let tc = textureSample(tex, samp, uv + vec2f(0.0, -texel.y)).rgb;
            let tr = textureSample(tex, samp, uv + vec2f(texel.x, -texel.y)).rgb;

            let l  = textureSample(tex, samp, uv + vec2f(-texel.x, 0.0)).rgb;
            let r  = textureSample(tex, samp, uv + vec2f(texel.x, 0.0)).rgb;

            let bl = textureSample(tex, samp, uv + vec2f(-texel.x, texel.y)).rgb;
            let bc = textureSample(tex, samp, uv + vec2f(0.0, texel.y)).rgb;
            let br = textureSample(tex, samp, uv + vec2f(texel.x, texel.y)).rgb;

            let dX = tr + 2.0*r + br - (tl + 2.0*l + bl);
            let dY = bl + 2.0*bc + br - (tl + 2.0*tc + tr);

            let edge = sqrt(dX*dX + dY*dY);
            let edgeIntensity = length(edge);

            // --- 3. Composite Neon Glow ---
            // Maps the detected edges to a glowing Cyan/Blue neon light
            let neonGlow = vec3f(edgeIntensity * 0.1, edgeIntensity * 1.8, edgeIntensity * 3.0);

            let finalRGB = rgbSplit + neonGlow;

            return vec4f(finalRGB, 1.0);
        `);

        // Hook the Neon post-processing pass onto the end of the pipeline
        const neonPass = new PostProcessPass("NeonEdgeFilter", this.renderer.finalOutputHandle, edgeDetectionCode);
        this.addPass(neonPass);
    }
}
