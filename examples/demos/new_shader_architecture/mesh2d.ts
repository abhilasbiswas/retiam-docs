// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Vec2, JointType, Path, Mesh2D } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ComputeGridScene extends Scene {
    private computePipeline!: GPUComputePipeline;
    private computeBindGroup!: GPUBindGroup;
    private timeBuffer!: GPUBuffer;

    public async run() {
        this.camera.position.set([0, 0, 120]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 1. Generate 2D Grid Vertices and Indices on CPU (10x10 Grid)
        const GRID_SIZE = 20;
        const SPACING = 4.0;
        const vertices: number[] = [];
        const indices: number[] = [];

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Push X, Y. We center the grid around (0,0)
                vertices.push(
                    (x - GRID_SIZE / 2) * SPACING,
                    (y - GRID_SIZE / 2) * SPACING
                );

                // Create 2 triangles (1 quad) per grid cell
                if (x < GRID_SIZE - 1 && y < GRID_SIZE - 1) {
                    const row1 = y * GRID_SIZE;
                    const row2 = (y + 1) * GRID_SIZE;

                    indices.push(row1 + x, row2 + x, row1 + x + 1);
                    indices.push(row1 + x + 1, row2 + x, row2 + x + 1);
                }
            }
        }

        const vertexData = new Float32Array(vertices);
        const indexData = new Uint32Array(indices);

        // 2. Allocate GPU Buffers
        const vertexBuffer = this.device.createBuffer({
            size: vertexData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
        vertexBuffer.unmap();

        const indexBuffer = this.device.createBuffer({
            size: indexData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Uint32Array(indexBuffer.getMappedRange()).set(indexData);
        indexBuffer.unmap();

        // 3. Time Buffer for Animation
        this.timeBuffer = this.device.createBuffer({
            size: 16, // Padded to 16 bytes for Uniform rules
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 4. Compute Shader to create a "Waving Flag" effect
        const shaderCode = `
            @group(0) @binding(0) var<storage, read_write> vertices: array<vec2f>;
            @group(0) @binding(1) var<uniform> time: f32;

            @compute @workgroup_size(64)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let vertexCount = ${GRID_SIZE * GRID_SIZE}u;
                if (id.x >= vertexCount) { return; }

                var pos = vertices[id.x];

                // Base Y position is calculated via grid coordinates to prevent drifting away
                let baseY = (f32(id.x / ${GRID_SIZE}u) - ${GRID_SIZE}.0 / 2.0) * ${SPACING.toFixed(1)};

                // Add Sine wave distortion based on X position and Time
                let wave = sin(pos.x * 0.15 + time * 3.0) * 5.0;

                vertices[id.x] = vec2f(pos.x, baseY + wave);
            }
        `;

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: { module: this.device.createShaderModule({ code: shaderCode }), entryPoint: 'main' }
        });

        this.computeBindGroup = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: vertexBuffer } },
                { binding: 1, resource: { buffer: this.timeBuffer } }
            ]
        });

        // 5. Initialize the Mesh2D with the GPU Buffers (indexCount auto-computed from indexBuffer.size / 4)
        const dynamicMesh = new Mesh2D(vertexBuffer, indexBuffer);
        dynamicMesh.paint.fill = new Color(0.2, 0.6, 1.0, 1.0); // Ocean Blue
        this.add(dynamicMesh);

        // 6. Execution Loop
        this.always(() => {
            this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([this.time * 0.001, 0, 0, 0]));

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.computePipeline);
            pass.setBindGroup(0, this.computeBindGroup);
            // Dispatch enough workgroups to cover all vertices
            pass.dispatchWorkgroups(Math.ceil((GRID_SIZE * GRID_SIZE) / 64));
            pass.end();
            this.device.queue.submit([encoder.finish()]);

            this.invalidate(); // Keep loop alive
        });
    }
}
