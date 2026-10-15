import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, Circle, Color, Model, Math3D, Sprite, OrbitCameraController, RenderTarget, ComputeKernel, Res, ComputeStorageTexture } from "retiam";

export default class IntermediateRenderComputeShowcase extends Scene {
    public async run() {
        this.composer!.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 0, 12]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Render → compute → texture", "A live render target processed on the GPU");

        // 1. CREATE AN OFFSCREEN PERSISTENT RENDER TARGET (512x512)
        const renderTarget = new RenderTarget(this, "DynamicCanvas", {
            width: 512,
            height: 512,
            type: "persistent"
        });

        // 2. CREATE PAINTBRUSH ENTITY & CAPTURE IT INTO THE RENDER TARGET
        const brush = new Circle(45);
        brush.paint.fill = new Color(0.9, 0.2, 0.5, 1.0);

        // Captures brush into renderTarget (automatically hides it from main screen & handles layers)
        renderTarget.capture(brush);

        // Animate the paintbrush position & color over time
        this.always(() => {
            const t = this.time * 0.003;
            const x = Math.sin(t * 2.0) * 160;
            const y = Math.cos(t * 1.5) * 160;

            brush.transform.position.set([x, y, 0]);
            brush.paint.fill.r = Math.sin(t) * 0.5 + 0.5;
            brush.paint.fill.g = Math.cos(t * 1.3) * 0.5 + 0.5;
            brush.paint.fill.b = Math.sin(t * 2.1) * 0.5 + 0.5;
        });

        // 3. CREATE COMPUTE STORAGE TEXTURE FOR THE COMPUTE SHADER OUTPUT
        const storageTex = new ComputeStorageTexture(this.device, {
            width: 512,
            height: 512,
            format: "rgba8unorm"
        });

        // 4. COMPUTE KERNEL: PROCESSES INTERMEDIATE TEXTURE -> WRITES TO STORAGE TEXTURE
        const computeKernel = new ComputeKernel(
            {
                "u_inputTex": Res.texture(renderTarget.texture!.createView()),
                "u_outputTex": Res.storageTexture(storageTex.storageView, "rgba8unorm", "write")
            },
            `
                let dims = textureDimensions(u_inputTex);
                if (global_id.x >= dims.x || global_id.y >= dims.y) { return; }

                let coords = vec2<i32>(global_id.xy);
                let srcColor = textureLoad(u_inputTex, coords, 0);

                // Compute Effect: Invert colors + add dynamic plasma wave grid overlay
                let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
                let wave = sin(uv.x * 20.0) * cos(uv.y * 20.0) * 0.25 + 0.25;

                let finalColor = vec4<f32>(
                    srcColor.r + wave,
                    1.0 - srcColor.g,
                    srcColor.b + wave * 0.5,
                    1.0
                );

                textureStore(u_outputTex, coords, finalColor);
            `,
            [16, 16, 1]
        );

        // Dispatch compute pass every frame
        this.always(() => {
            const cmd = computeKernel.dispatch(this.device, 32, 32, 1);
            this.addCompute(cmd);
        });

        // 5. BUILD A 3D TV CASING & MAP THE COMPUTED STORAGE TEXTURE ONTO THE SCREEN
        const tvCasing = new Model(Math3D.createCube(6));
        tvCasing.transform.setScale([1.0, 1.0, 0.05]);
        tvCasing.material.color = new Color(0.12, 0.12, 0.15, 1.0).rgba;

        // Map storageTex.texture (the compute shader output) onto the 3D TV screen sprite
        const tvScreen = new Sprite(6, 6, storageTex.texture);
        tvScreen.transform.position.z = 3.05;
        tvScreen.transform.setScale([0.9, 0.9, 1.0]);
        tvCasing.add(tvScreen);

        this.add(tvCasing);

        // Spin the 3D TV casing continuously
        this.always(() => {
            tvCasing.transform.rotateWorldY(this.dt * 0.0008);
            tvCasing.transform.rotateWorldX(this.dt * 0.0004);
            this.invalidate();
        });
    }
}
