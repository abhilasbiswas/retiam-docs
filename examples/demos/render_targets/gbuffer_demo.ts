// =============================================================================
// RenderTarget Demo: type = "gbuffer"
// USE CASE: Deferred shading, multi-render-target (MRT) geometry pass
//
// GBuffer creates multiple textures (albedo, normal, position, depth) for
// deferred rendering pipelines. The geometry pass writes material properties
// into separate buffers, and a lighting pass composites them afterwards.
//
// NOTE: This demo visualizes the GBuffer textures rather than implementing
// full deferred shading, which requires custom render pipeline passes.
// =============================================================================
import { CENTER, Scene, Color, CameraModel, RenderTarget, Sprite, Rect, SDFText, Vec3, ComputeKernel, Res } from "retiam";
import { GPUAllocator } from "retiam";

export default class GBufferDemo extends Scene {
    public async run() {
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        const SIZE = 256;

        // --- 1. CREATE GBUFFER RENDER TARGET ---
        const gbuffer = new RenderTarget(this, "DeferredGBuffer", {
            width: SIZE,
            height: SIZE,
            type: "gbuffer"
        });

        const gb = gbuffer.gBuffer!;

        // --- 2. WRITE SYNTHETIC GBUFFER DATA VIA COMPUTE ---
        // In production, a custom MRT render pass would fill these.
        // Here we use compute shaders to generate test patterns.

        const paramsBuffer = GPUAllocator.safeCreateBuffer(this.device, {
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Albedo: procedural checkerboard with color
        const albedoKernel = new ComputeKernel(
            {
                "output": Res.storageTexture(gb.albedoTexture.createView(), 'rgba8unorm', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            /* wgsl */ `
                struct Params { time: f32, size: f32, _p1: f32, _p2: f32 };

                @compute @workgroup_size(8, 8)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let uv = vec2<f32>(f32(id.x), f32(id.y)) / params.size;
                    let t = params.time;

                    // Animated checkerboard
                    let freq = 8.0;
                    let cx = floor(uv.x * freq + sin(t) * 0.5);
                    let cy = floor(uv.y * freq + cos(t * 0.7) * 0.5);
                    let checker = (cx + cy) % 2.0;

                    // Sphere mask
                    let d = length(uv - 0.5) * 2.0;
                    let sphere = smoothstep(0.9, 0.85, d);

                    let baseColor = mix(
                        vec3<f32>(0.8, 0.2, 0.3),
                        vec3<f32>(0.2, 0.7, 0.9),
                        checker
                    );

                    let albedo = baseColor * sphere + vec3<f32>(0.05) * (1.0 - sphere);
                    textureStore(output, vec2<i32>(id.xy), vec4<f32>(albedo, 1.0));
                }
            `,
            [8, 8, 1]
        );

        // Normal map: procedural hemisphere normals
        const normalKernel = new ComputeKernel(
            {
                "output": Res.storageTexture(gb.normalTexture.createView(), 'rgba16float', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            /* wgsl */ `
                struct Params { time: f32, size: f32, _p1: f32, _p2: f32 };

                @compute @workgroup_size(8, 8)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let uv = vec2<f32>(f32(id.x), f32(id.y)) / params.size;
                    let centered = (uv - 0.5) * 2.0;
                    let d = length(centered);

                    // Sphere normals
                    var normal = vec3<f32>(0.0, 0.0, 1.0);
                    if (d < 1.0) {
                        let z = sqrt(1.0 - d * d);
                        normal = normalize(vec3<f32>(centered.x, centered.y, z));
                    }

                    // Encode to [0,1] range for visualization
                    let encoded = normal * 0.5 + 0.5;
                    textureStore(output, vec2<i32>(id.xy), vec4<f32>(encoded, 1.0));
                }
            `,
            [8, 8, 1]
        );

        // Position map: world-space positions
        const positionKernel = new ComputeKernel(
            {
                "output": Res.storageTexture(gb.positionTexture.createView(), 'rgba16float', 'write'),
                "params": Res.uniform("Params", paramsBuffer)
            },
            /* wgsl */ `
                struct Params { time: f32, size: f32, _p1: f32, _p2: f32 };

                @compute @workgroup_size(8, 8)
                fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                    let uv = vec2<f32>(f32(id.x), f32(id.y)) / params.size;
                    let centered = (uv - 0.5) * 2.0;
                    let d = length(centered);

                    var pos = vec3<f32>(centered.x, centered.y, 0.0);
                    if (d < 1.0) {
                        pos.z = sqrt(1.0 - d * d);
                    }

                    // Scale to world-space range and encode
                    let encoded = pos * 0.5 + 0.5;
                    textureStore(output, vec2<i32>(id.xy), vec4<f32>(encoded, 1.0));
                }
            `,
            [8, 8, 1]
        );

        // --- 3. DISPLAY ALL GBUFFER LAYERS ---
        const tileSize = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        const gap = tileSize * 0.1;
        const startX = -(tileSize + gap);
        const startY = tileSize * 0.2;

        const buffers = [
            { tex: gb.albedoTexture, label: "Albedo", x: startX },
            { tex: gb.normalTexture, label: "Normal", x: 0 },
            { tex: gb.positionTexture, label: "Position", x: -startX }
        ];

        for (const buf of buffers) {
            // Texture display
            const sprite = new Sprite(tileSize, tileSize, buf.tex);
            sprite.transform.position.set([buf.x, startY, 0]);
            sprite.z_index = 0;
            this.add(sprite);

            // Border
            const rect = new Rect(tileSize, tileSize);
            rect.paint.fill = Color.NONE;
            rect.paint.stroke = new Color(0.3, 0.6, 1.0, 0.5);
            rect.paint.strokeWidth = 1.5;
            rect.transform.position.set([buf.x, startY, 0]);
            rect.z_index = 1;
            this.add(rect);

            // Label
            const label = new SDFText(buf.label, { anchor: CENTER, fontSize: 18 });
            label.paint.fill = new Color(0.7, 0.8, 0.9, 1.0);
            label.transform.position = new Vec3(buf.x, startY - tileSize * 0.6, 0);
            label.z_index = 2;
            this.add(label);
        }

        // Title
        const title = new SDFText("G-Buffer Deferred Shading Buffers", { anchor: CENTER, fontSize: 22 });
        title.paint.fill = new Color(0.5, 0.7, 1.0, 1.0);
        title.transform.position = new Vec3(0, this.canvas.height * 0.42, 0);
        title.z_index = 10;
        this.add(title);

        // --- 4. UPDATE COMPUTE EVERY FRAME ---
        const dispatchCount = Math.ceil(SIZE / 8);

        this.always(() => {
            const t = this.time * 0.001;
            this.device.queue.writeBuffer(paramsBuffer, 0, new Float32Array([t, SIZE, 0, 0]));

            this.addCompute(albedoKernel.dispatch(this.device, dispatchCount, dispatchCount));
            this.addCompute(normalKernel.dispatch(this.device, dispatchCount, dispatchCount));
            this.addCompute(positionKernel.dispatch(this.device, dispatchCount, dispatchCount));
        });
    }
}
