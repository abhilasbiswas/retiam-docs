import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, Shader } from "retiam";

export default class CustomUniformsScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        frameStage(this, 180, 116);
        demoCaption(this, "Animated shader uniforms", "A moving source drives the color and ripple field");

        // 1. Define the exact WGSL struct shape you want to pass in
        const userFunctions = `
            struct CustomData {
                cursor: vec2<f32>,
                colorA: vec4<f32>,
                colorB: vec4<f32>,
                pulse: f32,
                pad1: f32,
                pad2: f32,
                pad3: f32 // WebGPU structs must align to 16 bytes natively!
            };
        `;

        const fragmentLogic = `
            let uv = input.uv;
            let t = view.time * 0.001;

            // Note: Your ShaderBuilder auto-creates "@group(3) @binding(0) var<uniform> myUniforms: CustomData;"
            let d = distance(uv, myUniforms.cursor);

            // Create a wave rippling outward from the cursor
            let ripple = sin(d * 40.0 - t * 10.0 + myUniforms.pulse) * 0.5 + 0.5;

            // Blend colors based on ripple and distance
            let col = mix(myUniforms.colorA.rgb, myUniforms.colorB.rgb, ripple) * smoothstep(0.8, 0.0, d);

            finalColor = vec4f(col, 1.0);
        `;

        const shader = new Shader(160, 90, fragmentLogic, { userFunctions });

        // 2. Allocate the GPU Buffer (Our struct is 48 bytes -> allocate 64 for 16-byte alignment)
        const buffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // 3. Bind the buffer to the 'Shader' entity via setUniformBuffer
        shader.setUniformBuffer('myUniforms', 'CustomData', buffer);
        this.add(shader);

        // CPU Float32 mapping for our struct
        const dataArray = new Float32Array(16);

        // 4. Update the buffer data on the CPU every frame
        this.always(() => {
            const t = this.time * 0.001;

            // Animate a faux "cursor" moving in a figure-8 pattern
            dataArray[0] = Math.sin(t) * 0.4 + 0.5;         // cursor.x
            dataArray[1] = Math.sin(t * 2.0) * 0.4 + 0.5;   // cursor.y

            // vec4 uniforms start on 16-byte boundaries.
            // Color A (Animated warm accent)
            dataArray[4] = 1.0;
            dataArray[5] = Math.sin(t) * 0.2 + 0.65;
            dataArray[6] = 0.2;
            dataArray[7] = 1.0;

            // Color B (Static Blue)
            dataArray[8] = 0.1;
            dataArray[9] = 0.65;
            dataArray[10] = 1.0;
            dataArray[11] = 1.0;

            // Pulse variable
            dataArray[12] = Math.cos(t * 4.0);

            // Upload to GPU
            this.device.queue.writeBuffer(buffer, 0, dataArray);
            this.invalidate(); // Ensure the engine redraws this frame
        });
    }

}
