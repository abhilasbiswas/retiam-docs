import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Vec2, JointType, Path, Mesh2D } from "retiam";
import { Sprite } from "retiam";

export default class SpriteShowcaseScene extends Scene {
    private computePipeline!: GPUComputePipeline;
    private computeBindGroup!: GPUBindGroup;
    private timeBuffer!: GPUBuffer;

    private offscreenCtx!: OffscreenCanvasRenderingContext2D;
    private canvasSprite!: Sprite;

    public async run() {
        // Setup Camera
        this.camera.position.set([0, 0, 120]);
        new CameraController(this, this.camera);
        frameStage(this, 190, 145);
        demoCaption(this, "Images · video · canvas", "Four texture sources share the same sprite pipeline");

        const spriteSize = 40;
        const offset = 25;

        // ====================================================================
        // 1. TOP-LEFT: Standard Static Image
        // ====================================================================
        const imageSprite = new Sprite(spriteSize, spriteSize, "/res/media/image.jpg");
        imageSprite.transform.position = [-offset, offset, 0];
        this.add(imageSprite);


        // ====================================================================
        // 2. TOP-RIGHT: Live HTML Video
        // ====================================================================
        const videoSprite = new Sprite(spriteSize, spriteSize, "/res/media/nature.mp4");
        videoSprite.transform.position = [offset, offset, 0];
        this.add(videoSprite);

        // Play the video immediately
        videoSprite.play();


        // ====================================================================
        // 3. BOTTOM-LEFT: Dynamic OffscreenCanvas
        // ====================================================================
        const canvas = new OffscreenCanvas(256, 256);
        this.offscreenCtx = canvas.getContext('2d')!;

        this.canvasSprite = new Sprite(spriteSize, spriteSize, canvas);
        this.canvasSprite.transform.position = [-offset, -offset, 0];
        this.add(this.canvasSprite);


        // ====================================================================
        // 4. BOTTOM-RIGHT: Compute-Shader Warped Image
        // ====================================================================
        // Allocate a GPU Buffer for 4 Vertices (16 bytes per vertex: [X, Y, U, V])
        const vertexBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        // Initialize base geometry so the compute shader knows the original UVs
        const w = spriteSize / 2;
        new Float32Array(vertexBuffer.getMappedRange()).set([
            -w, w, 0, 0,
            -w, -w, 0, 1,
            w, w, 1, 0,
            w, -w, 1, 1
        ]);
        vertexBuffer.unmap();

        // Pass the Compute Buffer as the first argument to Sprite!
        const computeSprite = new Sprite(vertexBuffer, spriteSize, spriteSize, "/res/media/image.jpg");
        computeSprite.transform.position = [offset, -offset, 0];
        this.add(computeSprite);

        // Setup the Compute Pipeline to warp the quad
        this.timeBuffer = this.device.createBuffer({
            size: 16, // Padded to 16 bytes for Uniform rules
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const shaderCode = `
            struct Vertex { pos: vec2f, uv: vec2f };
            @group(0) @binding(0) var<storage, read_write> vertices: array<Vertex>;
            @group(0) @binding(1) var<uniform> time: f32;

            @compute @workgroup_size(4)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                if (id.x >= 4u) { return; }

                let u = vertices[id.x].uv.x;
                let v = vertices[id.x].uv.y;
                let w = ${w.toFixed(1)};

                // Original Anchor positions
                let baseX = select(-w, w, u > 0.5);
                let baseY = select(w, -w, v > 0.5);

                // Add Wobble offset (squish and stretch)
                let waveX = sin(time * 4.0 + v * 3.14) * 6.0;
                let waveY = cos(time * 5.0 + u * 3.14) * 6.0;

                vertices[id.x].pos = vec2f(baseX + waveX, baseY + waveY);
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

        // ====================================================================
        // Execution Loop
        // ====================================================================
        this.always(() => {
            // A. Update the CPU Canvas
            const timeSec = this.time * 0.001;
            this.offscreenCtx.fillStyle = `hsl(${(timeSec * 50) % 360}, 70%, 50%)`;
            this.offscreenCtx.fillRect(0, 0, 256, 256);

            this.offscreenCtx.fillStyle = "white";
            this.offscreenCtx.font = "bold 32px sans-serif";
            this.offscreenCtx.textAlign = "center";
            this.offscreenCtx.textBaseline = "middle";
            this.offscreenCtx.fillText("Live Canvas", 128, 128 - 20);
            this.offscreenCtx.fillText(`T: ${timeSec.toFixed(2)}s`, 128, 128 + 20);

            // Tell the Sprite that the canvas pixels have changed so it uploads to the GPU
            this.canvasSprite.refresh();

            // B. Dispatch the Compute Shader for the Warping Sprite
            this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([timeSec, 0, 0, 0]));

            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.computePipeline);
            pass.setBindGroup(0, this.computeBindGroup);
            pass.dispatchWorkgroups(1);
            pass.end();
            this.device.queue.submit([encoder.finish()]);

            // C. Keep the loop alive
            this.invalidate();
        });
    }
}
