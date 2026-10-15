import { frameStage, demoCaption } from "../../shared/presentation";
import { CameraController, Color, Rect, Scene, Triangle } from "retiam";







export default class DemoScene extends Scene {
    private computePipeline!: GPUComputePipeline;
    private computeBindGroup!: GPUBindGroup;
    private timeBuffer!: GPUBuffer;

    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 100, 90);
        demoCaption(this, "A rotating polygon", "GPU geometry with continuous transforms");

        // 1. Allocate GPU Buffer (3 Vertices * 2 Floats = 24 Bytes)
        const vertexBuffer = this.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
            label: "Compute Triangle Vertices"
        });

        // 2. Allocate Time Buffer (MUST BE 16 BYTES FOR WEBGPU ALIGNMENT!)
        this.timeBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Create the Compute Pipeline
        const shaderCode = `
            @group(0) @binding(0) var<storage, read_write> vertices: array<vec2f>;
            @group(0) @binding(1) var<uniform> time: f32;

            @compute @workgroup_size(3)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                if (id.x >= 3u) { return; }

                let PI2 = 6.283185307;
                let angle = (time * 3.0) + (f32(id.x) * (PI2 / 3.0));
                let radius = 25.0;

                vertices[id.x] = vec2f(cos(angle) * radius, sin(angle) * radius);
            }
        `;

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({ code: shaderCode }),
                entryPoint: 'main'
            }
        });

        this.computeBindGroup = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: vertexBuffer } },
                { binding: 1, resource: { buffer: this.timeBuffer } }
            ]
        });

        // 4. Initialize Triangle with the Compute Buffer directly
        const dynamicTriangle = new Triangle(vertexBuffer);
        dynamicTriangle.paint.fill = new Color(0.0, 1.0, 0.5, 1.0);
        this.add(dynamicTriangle);

        // 5. Direct submission loop (safely sidesteps engine queue wipes)
        this.always(() => {
            // Upload current time to GPU (Float32Array maps correctly to the 16 byte buffer)
            this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([this.time * 0.001, 0, 0, 0]));

            // Submit the Compute Shader directly!
            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.computePipeline);
            pass.setBindGroup(0, this.computeBindGroup);
            pass.dispatchWorkgroups(1);
            pass.end();
            this.device.queue.submit([encoder.finish()]);

            // Keep render loop alive for continuous animation
            this.invalidate();
        });
    }
}
