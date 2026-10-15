import { demoBackground, demoCaption } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: type = "storage"
// USE CASE: Compute shader procedural textures, GPU noise, simulation output
//
// Storage creates a GPU texture with STORAGE_BINDING usage so compute shaders
// can write directly to it via texture_storage_2d. Use `storageView` for the
// compute write target and `texture` to read the result in materials/sprites.
// =============================================================================
import { Scene, Color, CameraModel, RenderTarget, Sprite, ComputeKernel, Res, Rect } from "retiam";
import { GPUAllocator } from "retiam";

export default class StorageDemo extends Scene {
    public async run() {
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);
        this.clearColor(demoBackground());
        demoCaption(this, "A GPU storage texture", "Compute writes the pixels displayed by the sprite");

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        const SIZE = 512;

        // --- 1. CREATE STORAGE RENDER TARGET ---
        const storageTex = new RenderTarget(this, "ProceduralTexture", {
            width: SIZE,
            height: SIZE,
            type: "storage",
            format: "rgba8unorm"
        });

        // --- 2. DISPLAY THE TEXTURE ---
        const displaySize = Math.min(this.canvas.width, this.canvas.height) * 0.7;
        const display = new Sprite(displaySize, displaySize, storageTex.texture!);
        display.z_index = 0;
        this.add(display);

        // Border
        const border = new Rect(displaySize, displaySize);
        border.paint.fill = Color.NONE;
        border.paint.stroke = new Color(0.4, 0.8, 1.0, 0.6);
        border.paint.strokeWidth = 2;
        border.z_index = 1;
        this.add(border);

        // --- 3. CREATE COMPUTE SHADER TO WRITE PLASMA EFFECT ---
        const paramsBuffer = GPUAllocator.safeCreateBuffer(this.device, {
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const computeShader = new ComputeKernel(
            {
                "output": Res.storageTexture(storageTex.storageView!, 'rgba8unorm', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            /* wgsl */ `
                struct Params { time: f32, size: f32, _pad1: f32, _pad2: f32 };

                @compute @workgroup_size(8, 8)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let dims = vec2<f32>(params.size, params.size);
                    let uv = vec2<f32>(f32(id.x), f32(id.y)) / dims;
                    let t = params.time;

                    // Plasma effect
                    let cx = uv.x - 0.5;
                    let cy = uv.y - 0.5;

                    var v = sin(cx * 10.0 + t);
                    v = v + sin(cy * 10.0 + t * 0.7);
                    v = v + sin((cx + cy) * 10.0 + t * 1.3);
                    v = v + sin(sqrt(cx * cx + cy * cy) * 20.0 - t * 2.0);
                    v = v * 0.25;

                    let r = sin(v * 3.14159 + 0.0) * 0.5 + 0.5;
                    let g = sin(v * 3.14159 + 2.094) * 0.5 + 0.5;
                    let b = sin(v * 3.14159 + 4.189) * 0.5 + 0.5;

                    textureStore(output, vec2<i32>(id.xy), vec4<f32>(r, g, b, 1.0));
                }
            `,
            [8, 8, 1]
        );

        // --- 4. DISPATCH COMPUTE EVERY FRAME ---
        const dispatchCount = Math.ceil(SIZE / 8);

        this.always(() => {
            const t = this.time * 0.001;

            // Update time uniform
            this.device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([t, SIZE, 0, 0]));

            // Dispatch the compute shader
            const cmd = computeShader.dispatch(this.device, dispatchCount, dispatchCount, 1);
            this.addCompute(cmd);
        });
    }
}
