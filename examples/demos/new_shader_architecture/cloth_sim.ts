// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, TracePath, Circle, Vec3, Line3D, Model, Plane, OrbitCameraController } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ComputeClothScene extends Scene {
    private computePipeline!: GPUComputePipeline;
    private computeBindGroup!: GPUBindGroup;
    private timeBuffer!: GPUBuffer;

    public async run() {
        // 1. Setup Camera and Lighting
        this.camera.position.set([0, 30, 80]);
        this.camera.pitch = -0.3;
        new OrbitCameraController(this, this.camera, { radius: 80 });
        this.clearColor(demoBackground());

        // Add a floor plane to catch shadows
        const floor = new Plane(200, 200);
        floor.transform.position = [0, -20, 0];
        floor.material.color = [0.3, 0.3, 0.3];
        this.add(floor);

        // 2. Generate 3D Grid on CPU (50x50 resolution)
        const GRID = 50;
        const SIZE = 60.0;
        const SPACING = SIZE / GRID;

        // PBR Vertex format: [x, y, z,  nx, ny, nz,  u, v] (8 floats = 32 bytes)
        const vertexData = new Float32Array(GRID * GRID * 8);
        const indices: number[] = [];

        for (let z = 0; z < GRID; z++) {
            for (let x = 0; x < GRID; x++) {
                const i = (z * GRID + x) * 8;

                // Position X, Z centered
                vertexData[i + 0] = (x - GRID / 2) * SPACING;
                vertexData[i + 1] = 0; // Y
                vertexData[i + 2] = (z - GRID / 2) * SPACING;

                // Normal pointing UP
                vertexData[i + 3] = 0; vertexData[i + 4] = 1; vertexData[i + 5] = 0;

                // UVs
                vertexData[i + 6] = x / (GRID - 1);
                vertexData[i + 7] = z / (GRID - 1);

                // Indices (Quads)
                if (x < GRID - 1 && z < GRID - 1) {
                    const row1 = z * GRID;
                    const row2 = (z + 1) * GRID;
                    indices.push(row1 + x, row2 + x, row1 + x + 1);
                    indices.push(row1 + x + 1, row2 + x, row2 + x + 1);
                }
            }
        }
        const indexData = new Uint32Array(indices);

        // 3. Allocate GPU Buffers
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

        this.timeBuffer = this.device.createBuffer({
            size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 4. Cloth Compute Shader
        const shaderCode = `
           struct Vertex {
                px: f32, py: f32, pz: f32,
                nx: f32, ny: f32, nz: f32,
                u: f32, v: f32
            };

            @group(0) @binding(0) var<storage, read_write> vertices: array<Vertex>;
            @group(0) @binding(1) var<uniform> time: f32;

            @compute @workgroup_size(64)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let vertexCount = ${GRID * GRID}u;
                if (id.x >= vertexCount) { return; }

                var v = vertices[id.x];
                let dist = length(vec2f(v.px, v.pz));

                // 1. Calculate ripples
                let wave = sin(dist * 0.2 - time * 3.0) * 4.0;
                let secondary = cos(v.px * 0.1 + time) * 2.0;

                v.py = wave + secondary;

                // 2. Compute Analytical Normals
                let dWave_dDist = cos(dist * 0.2 - time * 3.0) * 4.0 * 0.2;
                let dDist_dx = select(0.0, v.px / dist, dist > 0.0);
                let dDist_dz = select(0.0, v.pz / dist, dist > 0.0);
                let dSec_dx = -sin(v.px * 0.1 + time) * 2.0 * 0.1;

                let dy_dx = (dWave_dDist * dDist_dx) + dSec_dx;
                let dy_dz = (dWave_dDist * dDist_dz);

                let norm = normalize(vec3f(-dy_dx, 1.0, -dy_dz));
                v.nx = norm.x; v.ny = norm.y; v.nz = norm.z;

                vertices[id.x] = v;
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

        // 5. Initialize the Model with GPU Buffers!
        const clothModel = new Model(vertexBuffer, GRID * GRID, indexBuffer, indices.length);
        clothModel.material.color = [0.1, 0.4, 0.8]; // Blue Velvet
        clothModel.material.roughness = 0.3;
        clothModel.material.metallic = 0.1;
        this.add(clothModel);

        // 6. Execution Loop
        this.always(() => {
            this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([this.time * 0.001, 0, 0, 0]));

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.computePipeline);
            pass.setBindGroup(0, this.computeBindGroup);
            pass.dispatchWorkgroups(Math.ceil((GRID * GRID) / 64));
            pass.end();
            this.device.queue.submit([encoder.finish()]);

            this.invalidate(); // Keep loop alive
        });
    }
}
