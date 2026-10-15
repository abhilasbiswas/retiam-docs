import { demoBackground, demoCaption } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: type = "feedback"
// USE CASE: Motion blur, trails, infinite mirror zoom, temporal effects
//
// Feedback captures the PREVIOUS frame's final rendered output as a texture.
// You can display it via a Sprite, creating an infinite recursion / mirror
// effect, or use it as input for motion blur / ghosting post-processes.
// =============================================================================
import { Scene, Color, Circle, CameraModel, RenderTarget, Sprite, Vec3, FunctionGraph2D, Axes, Create, Rect } from "retiam";

export default class FeedbackDemo extends Scene {
    public async run() {
        // 2D orthographic camera
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);
        this.clearColor(demoBackground());
        demoCaption(this, "Frame feedback", "A live inset samples the rendered scene");

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        // --- 1. CREATE FEEDBACK RENDER TARGET ---
        // This captures the previous frame's final rendered image
        const feedback = new RenderTarget(this, "FrameFeedback", {
            type: "feedback"
        });

        // --- 2. SCENE CONTENT ---
        // Background graph
        const w = this.canvas.width * 0.8;
        const h = this.canvas.height * 0.6;
        const axes = new Axes({
            xRange: [-5, 5, 1], yRange: [-3, 3, 1],
            width: w, height: h, showGrid: true, strokeWidth: 0.5
        });
        axes.z_index = 0;

        const curve = new FunctionGraph2D(axes, (x) => Math.sin(x) * 2, {
            stroke: new Color(0.2, 0.8, 0.5, 1.0),
            strokeWidth: 1.0
        });

        this.add(axes, curve);

        // Orbiting dot
        const orbitDot = new Circle(12);
        orbitDot.paint.fill = new Color(1.0, 0.4, 0.3, 1.0);
        orbitDot.paint.stroke = new Color(1, 1, 1, 0.8);
        orbitDot.paint.strokeWidth = 2;
        orbitDot.z_index = 1;
        this.add(orbitDot);

        // Second orbiting dot
        const dot2 = new Circle(8);
        dot2.paint.fill = new Color(0.3, 0.7, 1.0, 1.0);
        dot2.z_index = 1;
        this.add(dot2);

        // --- 3. DISPLAY PREVIOUS FRAME IN A "MIRROR" WINDOW ---
        // We wait one frame for the feedback texture to become available
        this.always(() => {
            const fbTex = feedback.texture;
            if (!fbTex) return;

            // The first time the texture is ready, create the mirror sprite
            if (!(this as any)._mirrorCreated) {
                (this as any)._mirrorCreated = true;

                // Shrunk-down version of the previous frame displayed top-right
                const mirrorWidth = this.canvas.width * 0.35;
                const mirrorHeight = this.canvas.height * 0.35;
                const mirror = new Sprite(mirrorWidth, mirrorHeight, fbTex);
                mirror.transform.position.set([
                    this.canvas.width * 0.3,
                    this.canvas.height * 0.3,
                    0
                ]);
                mirror.z_index = 2;
                this.add(mirror);
                (this as any)._mirror = mirror;

                // Border for the mirror
                const mirrorFrame = new Rect(mirrorWidth, mirrorHeight);
                mirrorFrame.paint.fill = Color.NONE;
                mirrorFrame.paint.stroke = new Color(1.0, 0.3, 0.5, 0.8);
                mirrorFrame.paint.strokeWidth = 2;
                mirrorFrame.transform.position = mirror.transform.position;
                mirrorFrame.z_index = 3;
                this.add(mirrorFrame);
            } else if ((this as any)._mirror) {
                if ((this as any)._mirror.getTexture() !== fbTex) {
                    (this as any)._mirror.setSource(fbTex);
                }
            }
        });

        // --- 4. ANIMATE ---
        this.always(() => {
            const t = this.time * 0.001;

            // Orbit the dots
            const radius = Math.min(w, h) * 0.35;
            orbitDot.transform.position.set([
                Math.cos(t) * radius,
                Math.sin(t * 2) * radius * 0.6,
                0
            ]);

            dot2.transform.position.set([
                Math.sin(t * 1.5) * radius * 0.7,
                Math.cos(t * 0.8) * radius * 0.5,
                0
            ]);

            // Color shift
            orbitDot.paint.fill.g = Math.sin(t * 0.5) * 0.5 + 0.5;
            dot2.paint.fill.r = Math.sin(t * 0.3) * 0.5 + 0.5;
        });

        // Initial creation animation
        await this.play([
            new Create(axes, { duration: 800 }),
            new Create(curve, { duration: 1000 })
        ]);
    }
}
