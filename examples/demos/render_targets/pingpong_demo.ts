import { demoBackground, demoCaption } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: type = "pingpong"
// USE CASE: Iterative GPU simulations (Game of Life, diffusion, fluid, blur)
//
// PingPong maintains TWO textures (A and B). Each frame you read from one and
// write to the other, then call swap(). This enables iterative simulations
// where each step depends on the previous step's output.
// =============================================================================
import { Scene, Color, CameraModel, RenderTarget, Sprite, ComputeKernel, Res, Rect } from "retiam";
import { GPUAllocator } from "retiam";

export default class PingPongDemo extends Scene {
    public async run() {
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);
        this.clearColor(demoBackground());
        demoCaption(this, "Ping-pong simulation", "Two storage textures alternate between input and output");

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        const SIZE = 256;

        // --- 1. CREATE PING-PONG RENDER TARGET ---
        const sim = new RenderTarget(this, "Simulation", {
            width: SIZE,
            height: SIZE,
            type: "pingpong",
            format: "rgba8unorm"
        });

        const pp = sim.pingPong!;

        // --- 2. SEED INITIAL STATE ---
        // Write random cells into BOTH textures (so first read always has data)
        const seedData = new Uint8Array(SIZE * SIZE * 4);
        for (let i = 0; i < SIZE * SIZE; i++) {
            const alive = Math.random() < 0.3 ? 255 : 0;
            seedData[i * 4 + 0] = alive;
            seedData[i * 4 + 1] = alive;
            seedData[i * 4 + 2] = alive;
            seedData[i * 4 + 3] = 255;
        }
        this.device.queue.writeTexture(
            { texture: pp.textureA },
            seedData,
            { bytesPerRow: SIZE * 4, rowsPerImage: SIZE },
            [SIZE, SIZE, 1]
        );

        // --- 3. DISPLAY ---
        // We display BOTH textures side by side so we always see the latest output
        const displaySize = Math.min(this.canvas.width, this.canvas.height) * 0.75;
        const displayA = new Sprite(displaySize, displaySize, pp.textureA);
        displayA.z_index = 0;
        this.add(displayA);

        // We'll also keep a reference to B display, toggling visibility
        const displayB = new Sprite(displaySize, displaySize, pp.textureB);
        displayB.z_index = 1;
        this.add(displayB);

        const border = new Rect(displaySize, displaySize);
        border.paint.fill = Color.NONE;
        border.paint.stroke = new Color(0.2, 1.0, 0.5, 0.6);
        border.paint.strokeWidth = 2;
        border.z_index = 2;
        this.add(border);

        // --- 4. GAME OF LIFE COMPUTE SHADER ---
        const paramsBuffer = GPUAllocator.safeCreateBuffer(this.device, {
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([SIZE, SIZE, 0, 0]));

        const wgslCode = /* wgsl */ `
            struct Params { width: f32, height: f32, _p1: f32, _p2: f32 };

            @compute @workgroup_size(8, 8)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let w = i32(params.width);
                let h = i32(params.height);
                let x = i32(id.x);
                let y = i32(id.y);
                if (x >= w || y >= h) { return; }

                // Count live neighbors (wrap around edges)
                var neighbors = 0;
                for (var dy = -1; dy <= 1; dy = dy + 1) {
                    for (var dx = -1; dx <= 1; dx = dx + 1) {
                        if (dx == 0 && dy == 0) { continue; }
                        let nx = (x + dx + w) % w;
                        let ny = (y + dy + h) % h;
                        let sample = textureLoad(inputTex, vec2<i32>(nx, ny), 0);
                        if (sample.g > 0.5) { neighbors = neighbors + 1; }
                    }
                }

                let current = textureLoad(inputTex, vec2<i32>(x, y), 0);
                let alive = current.g > 0.5;

                // Conway's Game of Life rules
                var next = 0.0;
                if (alive && (neighbors == 2 || neighbors == 3)) {
                    next = 1.0;
                } else if (!alive && neighbors == 3) {
                    next = 1.0;
                }

                // Color based on state: alive = green, dead = dark
                let col = select(vec4<f32>(0.02, 0.03, 0.05, 1.0), vec4<f32>(0.1, 0.9, 0.4, 1.0), next > 0.5);
                textureStore(outputTex, vec2<i32>(x, y), col);
            }
        `;

        // Pre-create TWO kernels: one for A→B and one for B→A
        const kernelAtoB = new ComputeKernel(
            {
                "inputTex": Res.texture(pp.viewA, 'float', '2d'),
                "outputTex": Res.storageTexture(pp.viewB, 'rgba8unorm', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            wgslCode,
            [8, 8, 1]
        );

        const kernelBtoA = new ComputeKernel(
            {
                "inputTex": Res.texture(pp.viewB, 'float', '2d'),
                "outputTex": Res.storageTexture(pp.viewA, 'rgba8unorm', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            wgslCode,
            [8, 8, 1]
        );

        // --- 5. SIMULATION LOOP ---
        let frameCounter = 0;
        let showA = true; // Track which texture has the latest result
        const dispatchCount = Math.ceil(SIZE / 8);

        this.always(() => {
            frameCounter++;
            // Step every 3 frames for visible pace
            if (frameCounter % 3 !== 0) return;

            if (showA) {
                // Read A, write B
                const cmd = kernelAtoB.dispatch(this.device, dispatchCount, dispatchCount, 1);
                this.addCompute(cmd);
                // Latest result is now in B
                displayA.VISIBILITY = false;
                displayB.VISIBILITY = true;
                showA = false;
            } else {
                // Read B, write A
                const cmd = kernelBtoA.dispatch(this.device, dispatchCount, dispatchCount, 1);
                this.addCompute(cmd);
                // Latest result is now in A
                displayA.VISIBILITY = true;
                displayB.VISIBILITY = false;
                showA = true;
            }
        });
    }
}
