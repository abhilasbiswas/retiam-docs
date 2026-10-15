// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, TracePath, Circle, Vec3, Line3D, AABB } from "retiam";
import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";

export default class ComputeLineScene extends Scene {
    private computePipeline!: GPUComputePipeline;
    private computeBindGroup1!: GPUBindGroup;
    private computeBindGroup2!: GPUBindGroup;

    private line1!: Line3D;
    private line2!: Line3D;

    private timeBuffer!: GPUBuffer;

    public async run() {
        this.camera.position.set([0, 0, 155]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        frameContent(this, new AABB(new Vec3(-15, -43, -15), new Vec3(15, 43, 15)), 0.35);
        demoCaption(this, "Compute-driven double helix", "Two GPU-generated strands twist through space");

        const NUM_POINTS = 500;

        // 1. Allocate GPU Buffers for the points (NUM_POINTS * vec4f -> 16 bytes per point)
        const buffer1 = this.device.createBuffer({
            size: NUM_POINTS * 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        const buffer2 = this.device.createBuffer({
            size: NUM_POINTS * 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        // 2. Uniform Time Buffer
        this.timeBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Compute Shader to generate a spinning DNA shape
        const shaderCode = `
            @group(0) @binding(0) var<storage, read_write> points: array<vec4f>;
            @group(0) @binding(1) var<uniform> time: f32;

            // Allow an offset so we can generate two interwoven strands
            @group(0) @binding(2) var<uniform> strand_offset: f32;

            @compute @workgroup_size(64)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let i = id.x;
                let count = ${NUM_POINTS}u;
                if (i >= count) { return; }

                let t = f32(i) / f32(count - 1u);

                // Height expands upwards from -40 to 40
                let y = (t - 0.5) * 80.0;

                // Helical twisting logic
                let freq = 15.0;
                let angle = (t * freq) + time * 3.0 + strand_offset;

                let radius = 10.0 + sin(time * 2.0 + t * 5.0) * 3.0; // Pulsing radius

                let x = cos(angle) * radius;
                let z = sin(angle) * radius;

                // Points format: [x, y, z, 0.0 (arc-length slot)]
                points[i] = vec4f(x, y, z, 0.0);
            }
        `;

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: { module: this.device.createShaderModule({ code: shaderCode }), entryPoint: 'main' }
        });

        // Create uniform buffers for the offsets
        const offsetBuf1 = this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true });
        new Float32Array(offsetBuf1.getMappedRange()).set([0, 0, 0, 0]); offsetBuf1.unmap();

        const offsetBuf2 = this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true });
        new Float32Array(offsetBuf2.getMappedRange()).set([Math.PI, 0, 0, 0]); offsetBuf2.unmap();

        this.computeBindGroup1 = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: buffer1 } },
                { binding: 1, resource: { buffer: this.timeBuffer } },
                { binding: 2, resource: { buffer: offsetBuf1 } }
            ]
        });

        this.computeBindGroup2 = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: buffer2 } },
                { binding: 1, resource: { buffer: this.timeBuffer } },
                { binding: 2, resource: { buffer: offsetBuf2 } }
            ]
        });

        // 4. Initialize Line3D Entities directly from the buffers!
        // We use a custom shader to color them based on their physical height
        const colorShader = `
            fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
                let core = smoothstep(0.7, 1.0, 1.0 - abs(w));
                let rgb = mix(col.rgb, vec3f(1.0), core * 0.8);
                return vec4f(rgb, col.a);
            }
        `;

        this.line1 = new Line3D(buffer1, NUM_POINTS, { shader: colorShader });
        this.line1.paint.stroke = new Color(0.0, 1.0, 0.8, 1.0); // Cyan
        this.line1.paint.strokeWidth = 3.0;
        this.line1.fragment.preventSelfOverlap = true; // Use advanced stencil logic
        this.add(this.line1);

        this.line2 = new Line3D(buffer2, NUM_POINTS, { shader: colorShader });
        this.line2.paint.stroke = new Color(1.0, 0.2, 0.8, 1.0); // Magenta
        this.line2.paint.strokeWidth = 3.0;
        this.line2.fragment.preventSelfOverlap = true; // Use advanced stencil logic
        this.add(this.line2);

        // 5. Execution Loop
        this.always(() => {
            this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([this.time * 0.001, 0, 0, 0]));

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.computePipeline);

            pass.setBindGroup(0, this.computeBindGroup1);
            pass.dispatchWorkgroups(Math.ceil(NUM_POINTS / 64));

            pass.setBindGroup(0, this.computeBindGroup2);
            pass.dispatchWorkgroups(Math.ceil(NUM_POINTS / 64));

            pass.end();
            this.device.queue.submit([encoder.finish()]);

            // Notify the Lines that their buffers changed so they run the Arc-Length Compute pass
            this.line1.refreshLength();
            this.line2.refreshLength();

            this.invalidate();
        });
    }
}
