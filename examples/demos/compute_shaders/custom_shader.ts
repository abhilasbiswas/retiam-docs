import { Scene, CameraController, Shader, UniformSchema, DataType, UniformBufferData, Color } from "retiam";
import { demoBackground } from "../../shared/presentation";




export default class CustomShaderScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 1. Define custom WGSL Structs and Helper Functions
        const userFunctions = `
            struct ShaderData {
                time: f32,
                resolution: vec2f,
                mouse: vec2f,
            };

            // Pallete generator for psychedelic colors
            fn palette(t: f32) -> vec3f {
                let a = vec3f(0.5, 0.5, 0.5);
                let b = vec3f(0.5, 0.5, 0.5);
                let c = vec3f(1.0, 1.0, 1.0);
                let d = vec3f(0.263, 0.416, 0.557);
                return a + b * cos(6.28318 * (c * t + d));
            }
        `;

        // 2. Define the main Fragment Logic
        // (Input struct provides 'input.uv' and 'input.position')
        const fragmentLogic = `
            var uv = input.uv * 2.0 - 1.0;
            uv.x *= uData.resolution.x / uData.resolution.y;
            let uv0 = uv;

            var finalRGB = vec3f(0.0);

            for (var i = 0.0; i < 4.0; i += 1.0) {
                uv = fract(uv * 1.5) - 0.5;

                var d = length(uv) * exp(-length(uv0));
                var col = palette(length(uv0) + uData.time * 0.4 + i * 0.4);

                d = sin(d * 8.0 + uData.time) / 8.0;
                d = abs(d);
                d = pow(0.01 / d, 1.2);

                finalRGB += col * d;
            }

            finalColor = vec4f(finalRGB, 1.0) * paint.opacity;
        `;

        // 3. Create the Shader Entity
        const fractalShader = new Shader(60, 60, fragmentLogic, { userFunctions });
        fractalShader.transform.position = [0, 0, 0];

        // 4. Build a strongly-typed Uniform Buffer using the new Engine Schema!
        const schema = new UniformSchema("ShaderData", {
            time: DataType.f32,
            resolution: DataType.vec2f,
            mouse: DataType.vec2f
        });

        const uniformData = new UniformBufferData(schema);
        const gpuBuffer = this.device.createBuffer({
            size: schema.byteSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 5. Inject the buffer into the Shader!
        fractalShader.setUniformBuffer("uData", "ShaderData", gpuBuffer);

        this.add(fractalShader);

        // 6. Execution Loop
        this.always(() => {
            // Update CPU variables dynamically via string paths
            uniformData.set("time", this.time * 0.001);
            uniformData.set("resolution", [this.canvas.width, this.canvas.height]);

            // Upload to GPU
            this.device.queue.writeBuffer(gpuBuffer, 0, uniformData.buffer);

            fractalShader.transform.rotateWorldZ(this.dt * 0.0005);
            this.invalidate(); // Keep loop alive
        });
    }
}
