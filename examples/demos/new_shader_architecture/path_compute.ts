import { Scene, ComputeKernel, Color, Vec3, CameraController, createBuffer, Usage, Res, Path, PathEffect } from "retiam";
import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";

export default class DynamicComputePathScene extends Scene {
    private computeKernel!: ComputeKernel;
    private paramsBuffer!: GPUBuffer;
    private pointsBuffer!: GPUBuffer;

    // We need an odd number of points (2M + 1) for contiguous quadratic beziers
    private numPoints = 401;

    public async run() {
        // 1. Setup Environment
        this.clearColor(demoBackground()); // Dark background for the neon effect
        this.camera.position = new Vec3(0, 0, 15);
        new CameraController(this, this.camera);
        frameStage(this, 28, 24);
        demoCaption(this, "A compute-driven knot", "GPU-generated curves change shape and color");

        // 2. Allocate GPU Buffers
        // A single vec2f point requires 2 floats. We pass an empty Float32Array
        // to automatically allocate the exact byte length on the GPU.
        this.pointsBuffer = createBuffer(
            this.device,
            Usage.USAGE_IO, // Equal to: STORAGE | VERTEX | COPY_SRC | COPY_DST
            new Float32Array(this.numPoints * 2)
        );

        // Params: [time, num_points, 0, 0] (16 bytes = vec4f)
        this.paramsBuffer = createBuffer(
            this.device,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            new Float32Array(4)
        );

        // 3. Create Compute Kernel
        // The ComputeKernel automatically wraps this logic inside a `fn main(global_id: vec3<u32>)` block.
        const computeLogic = `
            let i = global_id.x;
            let time = params.x;
            let num_pts = u32(params.y);

            if (i >= num_pts) { return; }

            // Map thread ID to a normalized parameter 't' from 0.0 to 1.0
            let t = f32(i) / f32(num_pts - 1u);
            let angle = t * 3.14159265 * 2.0;

            // Complex Parametric Math (Swirling Lissajous knot)
            let x = sin(angle * 3.0 + time * 1.5) * 5.0
                  + cos(angle * 5.0 - time * 0.8) * 1.5
                  + sin(angle * 1.0 + time * 0.2) * 2.0;

            let y = cos(angle * 4.0 + time * 1.2) * 3.0
                  + sin(angle * 2.0 - time * 1.1) * 2.5
                  + cos(angle * 1.0 + time * 0.5) * 1.5;

            // Add a pulsating wave through the radius
            let radius = 1.0 + sin(time * 3.0 + t * 15.0) * 0.15;

            points[i] = vec2<f32>(x * radius, y * radius);
        `;

        this.computeKernel = new ComputeKernel(
            {
                "points": Res.buffer("array<vec2f>", this.pointsBuffer, "read_write"),
                "params": Res.uniform("vec4f", this.paramsBuffer)
            },
            computeLogic,
            [64, 1, 1] // Workgroup size
        );

        // 4. Create the Path Entity using the GPU Buffer
        // We use the new automated constructor overload: Path(buffer, vertexCount, shaderEffect)
        const dynamicPath = new Path(
            this.pointsBuffer,
            this.numPoints,
            {
                strokeShader: PathEffect.Glow(0.25) // Soft neon glow effect (defined in PathEffect.ts)
            }
        );
        // dynamicPath.paint.fill = Color.NONE;

        dynamicPath.fragment.preventSelfOverlap = false;

        // Style the curve
        dynamicPath.paint.stroke = new Color(0.1, 0.9, 1.0, 1.0); // Cyan Neon
        dynamicPath.paint.strokeWidth = 0.22;

        this.add(dynamicPath);

        // 5. Render Loop (Executes every frame)
        this.always(() => {
            // A. Update uniform data (Time and Point Count)
            const timeSec = this.time * 0.001;
            this.device.queue.writeBuffer(
                this.paramsBuffer,
                0,
                new Float32Array([timeSec, this.numPoints, 0, 0])
            );

            // B. Dispatch the compute shader
            const cmd = this.computeKernel.dispatch(this.device, this.numPoints);
            this.addCompute(cmd);

            // C. Tell the path that its external buffer was modified by Compute,
            // which triggers the internal path tessellation & arc-length encoders
            dynamicPath.refresh();

            // D. Color shift the neon path dynamically over time
            dynamicPath.paint.stroke = new Color(
                0.5 + 0.5 * Math.sin(timeSec * 2.0),
                0.5 + 0.5 * Math.sin(timeSec * 2.5 + 2.0),
                0.8 + 0.2 * Math.sin(timeSec * 1.5 + 4.0),
                1.0
            );
        });
    }
}
