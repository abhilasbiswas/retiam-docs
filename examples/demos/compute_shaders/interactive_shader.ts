import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Color, Shader, UniformSchema, DataType, UniformBufferData, CameraModel } from "retiam";


export default class InteractiveShaderScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 100;
        frameStage(this, 110, 120);
        demoCaption(this, "Pointer-driven shader", "Move the pointer to steer the ripple");

        // 1. Define custom WGSL Structs and Helper Functions
        const userFunctions = `
            struct ShaderData {
                mouse: vec2f,
                resolution: vec2f,
            };

            fn sdPentagram(p: vec2<f32>, r: f32) -> f32 {
                let k1x = 0.809016994;
                let k2x = 0.309016994;
                let k1y = 0.587785252;
                let k2y = 0.951056516;
                let k1z = 0.726542528;

                let v1 = vec2<f32>( k1x, -k1y);
                let v2 = vec2<f32>(-k1x, -k1y);
                let v3 = vec2<f32>( k2x, -k2y);

                var p_mut = p;
                p_mut.x = abs(p_mut.x);
                p_mut -= 2.0 * max(dot(v1, p_mut), -2.0) * v1;
                p_mut -= 2.0 * max(dot(v2, p_mut), 0.0) * v2;
                p_mut.x = abs(p_mut.x);
                p_mut.y -= r;

                return length(p_mut - v3 * clamp(dot(p_mut, v3), 0.0, k1z * r)) *
                       sign(p_mut.y * v3.x - p_mut.x * v3.y);
            }
        `;

        // 2. Define the main Fragment Logic
        // We use 'uData' for our uniforms, 'view.time' for the engine clock, and 'input.uv' for coordinates.
        const fragmentLogic = `
            let m = uData.mouse;

            // input.uv ranges from [0.0, 1.0].
            // We shift to [-0.5, 0.5] and scale by resolution to get pixel coordinates centered at 0,0
            let pixelPos = (input.uv - vec2f(0.5, 0.5)) * uData.resolution;

            // Calculate signed distance to the star
            let dist = sdPentagram(pixelPos - m, 20.0);

            // Psychedelic ripple animation driven natively by the engine's 'view.time'
            let a = 1.0 - (2.0 + sin(-view.time * 0.01 + dist)) * 0.25;

            // Output the final color (automatically handles blending and opacity)
            finalColor = vec4f(input.uv.x, input.uv.y, 0.5, 1.0) * a * paint.opacity;
        `;

        // 3. Create the Shader Entity
        const shaderWidth = 800;
        const shaderHeight = 800.1;
        const shader = new Shader(shaderWidth, shaderHeight, fragmentLogic, { userFunctions });

        shader.transform.setScale(0.1); // Scale it down slightly so it fits nicely on screen
        this.add(shader);

        // 4. Build a strongly-typed Uniform Buffer using the Engine Schema
        const schema = new UniformSchema("ShaderData", {
            mouse: DataType.vec2f,
            resolution: DataType.vec2f
        });

        const uniformData = new UniformBufferData(schema);
        const gpuBuffer = this.device.createBuffer({
            size: schema.byteSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Initialize default values
        uniformData.set("resolution", [shaderWidth, shaderHeight]);
        uniformData.set("mouse", [0, 0]); // Default to center
        this.device.queue.writeBuffer(gpuBuffer, 0, uniformData.buffer);

        // 5. Inject the buffer into the Shader!
        shader.setUniformBuffer("uData", "ShaderData", gpuBuffer);

        // 6. Keep the animation loop running continuously
        this.always(() => {
            this.invalidate(); // Forces the engine to advance view.time and re-render
        });

        // 7. Bind Mouse Tracking to the Shader Uniform
        this.setEvent('mousemove', (worldPosition) => {
            // Project through the camera so the pointer still aligns after a resize.
            const local = shader.worldToLocal(worldPosition);
            uniformData.set("mouse", [local.x, -local.y]);
            this.device.queue.writeBuffer(gpuBuffer, 0, uniformData.buffer);
        }, { contextAware: false });
    }
}
