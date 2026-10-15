import { Scene, Shader, Quaternion, Vec3, Color, Res, CameraController, CameraModel, ShaderBuilder } from "retiam";
import { ComputeKernel } from "retiam";
import { demoBackground } from "../../shared/presentation";




// ShaderBuilder.prototype.addStorageBuffer = function (
//     name: string,
//     wgslType: string,
//     access: 'read' | 'read_write' = 'read',
//     visibility: GPUShaderStageFlags = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT
// ) {
//     const bindingIndex = this.customResources.length;
//     this.customResources.push({
//         name,
//         wgslType: wgslType, // Fix: Preserve the original type (e.g. array<u32>) instead of forcing atomic<u32>
//         layoutEntry: {
//             binding: bindingIndex,
//             visibility,
//             buffer: { type: access === 'read' ? 'read-only-storage' : 'storage' }
//         }
//     });
// };

// Grid configuration
const GRID_WIDTH = 4096;
const GRID_HEIGHT = 4096;
const NUM_CELLS = GRID_WIDTH * GRID_HEIGHT;
const QUAD_SIZE = 800; // Size of the rendering plane

export default class GameOfLifeScene extends Scene {
    private lifeCompute!: ComputeKernel;
    private gridShader!: Shader;
    private lastTick: number = 0;

    // 0 means buf0 is current source, buf1 is current target
    // 1 means buf1 is current source, buf0 is current target
    private ping: number = 0;

    public async run() {
        // 1. Fixed Orthographic 2D Camera
        this.camera.model = 1; // 1 = Orthographic projection
        this.camera.orthoScale = QUAD_SIZE;
        this.camera.position.set([0, 0, 100]); // Face down Z-axis

        new CameraController(this, this.camera);

        this.clearColor(demoBackground());

        // 2. Create Double Buffers
        const buffer0 = this.device.createBuffer({
            size: NUM_CELLS * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        const buffer1 = this.device.createBuffer({
            size: NUM_CELLS * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        // Initialize Buffer 0 with random living cells (~15% alive) - FIXED: Removed JS syntax error '1u'/'0u'
        const initData = new Uint32Array(NUM_CELLS);
        for (let i = 0; i < NUM_CELLS; i++) {
            initData[i] = Math.random() > 0.85 ? 1 : 0;
        }
        this.device.queue.writeBuffer(buffer0, 0, initData);

        // Params Buffer (vec4u for 16-byte alignment compliance)
        const paramsBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([this.ping, 0, 0, 0]));

        // 3. Define the Game of Life Compute Logic (Fully Inlined)
        const computeWGSL = `
            let w = ${GRID_WIDTH}u;
            let h = ${GRID_HEIGHT}u;
            let x = i32(global_id.x);
            let y = i32(global_id.y);

            if (x >= i32(w) || y >= i32(h)) { return; }

            // Sum up the 8 neighbors using inline modulo coordinates
            var neighbors = 0u;
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    if (i == 0 && j == 0) { continue; }

                    let nx = u32((x + i + i32(w)) % i32(w));
                    let ny = u32((y + j + i32(h)) % i32(h));
                    let n_idx = ny * w + nx;

                    // Read from the active source buffer based on Ping state
                    if (params.x == 0u) {
                        neighbors += buf0[n_idx];
                    } else {
                        neighbors += buf1[n_idx];
                    }
                }
            }

            // Apply Conway's rules
            let idx = u32(y) * w + u32(x);

            var current = 0u;
            if (params.x == 0u) {
                current = buf0[idx];
            } else {
                current = buf1[idx];
            }

            var next_state = 0u;

            if (current == 1u && (neighbors == 2u || neighbors == 3u)) {
                next_state = 1u; // Survive
            } else if (current == 0u && neighbors == 3u) {
                next_state = 1u; // Reproduce
            }

            // Write output to the destination buffer
            if (params.x == 0u) {
                buf1[idx] = next_state;
            } else {
                buf0[idx] = next_state;
            }
        `;

        this.lifeCompute = new ComputeKernel(
            {
                "params": Res.uniform("vec4<u32>", paramsBuffer),
                "buf0": Res.buffer("array<u32>", buffer0, "read_write"),
                "buf1": Res.buffer("array<u32>", buffer1, "read_write")
            },
            computeWGSL,
            [16, 16, 1]
        );

        // 4. Define the Render Logic using the Shader entity
        const renderWGSL = `
            let w = ${GRID_WIDTH}.0;
            let h = ${GRID_HEIGHT}.0;

            // Map UV coordinates back to strict integer grid space
            let px = clamp(u32(input.uv.x * w), 0u, u32(w) - 1u);
            let py = clamp(u32(input.uv.y * h), 0u, u32(h) - 1u);
            let idx = py * u32(w) + px;

            // Read the cell state from the buffer the compute shader just finished writing to
            var cell = 0u;
            if (params.x == 0u) {
                cell = buf1[idx];
            } else {
                cell = buf0[idx];
            }

            // Compute sub-pixel grid line borders
            let cell_uv = fract(input.uv * vec2f(w, h));
            let border = step(cell_uv.x, 0.05) + step(cell_uv.y, 0.05) + step(0.95, cell_uv.x) + step(0.95, cell_uv.y);

            // Color Mapping
            var color = vec3f(0.04, 0.04, 0.06); // Dead cell
            if (cell == 1u) {
                color = vec3f(0.0, 1.0, 0.6);    // Alive cell (Neon Cyan)
            }

            // Apply grid borders
            if (border > 0.0) {
                color *= 0.3;
            }

            finalColor = vec4f(color, 1.0);
        `;

        // Initialize Quad
        this.gridShader = new Shader(QUAD_SIZE, QUAD_SIZE, renderWGSL);

        // Link resources to the display quad
        this.gridShader.setUniformBuffer("params", "vec4<u32>", paramsBuffer);
        this.gridShader.setStorageBuffer("buf0", "array<u32>", buffer0, "read");
        this.gridShader.setStorageBuffer("buf1", "array<u32>", buffer1, "read");

        this.gridShader.transform.position = [0, 0, 0];
        this.add(this.gridShader);

        // 5. Execute initial compute pass once so buf1 has data before rendering starts
        const initialCmd = this.lifeCompute.dispatch(this.device, Math.ceil(GRID_WIDTH / 16), Math.ceil(GRID_HEIGHT / 16), 1);
        const initialEncoder = this.device.createCommandEncoder();
        const initialPass = initialEncoder.beginComputePass();
        initialPass.setPipeline(initialCmd.pipeline);
        initialPass.setBindGroup(0, initialCmd.bind_group);
        initialPass.dispatchWorkgroups(initialCmd.dispatch_count[0] as number, initialCmd.dispatch_count[1] as number, initialCmd.dispatch_count[2] as number);
        initialPass.end();
        this.device.queue.submit([initialEncoder.finish()]);
        const cmd = this.lifeCompute.dispatch(this.device, Math.ceil(GRID_WIDTH / 16), Math.ceil(GRID_HEIGHT / 16), 1);

        // 6. Simulation Loop
        this.always(() => {
            // Update simulation at ~16 generations per second
            if (this.time - this.lastTick > 60) {
                this.lastTick = this.time;

                // Toggle the GPU state
                this.ping = this.ping === 0 ? 1 : 0;
                this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([this.ping, 0, 0, 0]));

                // Fire the Compute Shader immediately

                this.addCompute(cmd);
            }

            this.invalidate(); // Force continuous rendering
        });
    }
}
