import { frameStage } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: Entity-Level Gaussian Blur
// USE CASE: Depth-of-field, frosted glass, glowing UI panels, drop shadows,
//           and isolated entity blur without scene-wide post-processing.
// =============================================================================

import {
    CENTER,
    Scene,
    Color,
    Circle,
    Rect,
    Sprite,
    RenderTarget,
    SDFText,
    OrbitCameraController,
    Camera2DController,
    Sphere
} from "retiam";

export default class BlurDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 1000]);
        frameStage(this, 1350, 820, 0);
        new Camera2DController(this, this.camera)

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        // ---------------------------------------------------------------------
        // 1. UNBLURRED TARGET (Reference)
        // ---------------------------------------------------------------------
        const sharpTarget = new RenderTarget(this, "SharpTarget", {
            width: 400,
            height: 400,
            type: "offscreen"
        });

        const sharpCircle1 = new Circle(60);
        sharpCircle1.paint.fill = new Color(1.0, 0.2, 0.4, 1.0);
        sharpCircle1.transform.position.set([-60, 40, 0]);

        const sharpCircle2 = new Circle(45);
        sharpCircle2.paint.fill = new Color(0.1, 0.8, 0.9, 0.85);
        sharpCircle2.transform.position.set([50, -30, 0]);

        const sharpRect = new Rect(70, 70);
        sharpRect.paint.fill = new Color(1.0, 0.85, 0.2, 0.9);
        sharpRect.transform.position.set([10, 50, 0]);

        sharpTarget.add(sharpCircle1, sharpCircle2, sharpRect);

        // Display sprite for sharp target
        const sharpSprite = sharpTarget.toSprite(360, 360);
        sharpSprite.transform.position.set([-420, 0, 0]);
        this.add(sharpSprite);

        // Label for sharp
        const sharpLabel = new SDFText("Sharp (Blur: 0)", { anchor: CENTER, fontSize: 24 });
        sharpLabel.paint.fill = new Color(0.9, 0.9, 0.9, 1.0);
        sharpLabel.transform.position.set([-420, -220, 0]);
        this.add(sharpLabel);

        // ---------------------------------------------------------------------
        // 2. STATIC BLUR TARGET (radius = 12, 1 iteration)
        // ---------------------------------------------------------------------
        const staticBlurTarget = new RenderTarget(this, "StaticBlurTarget", {
            width: 400,
            height: 400,
            type: "offscreen",
            blur: 10,
            blurIterations: 1
        });

        const staticCircle1 = new Sphere(60);
        staticCircle1.paint.fill = new Color(1.0, 0.2, 0.4, 1.0);
        staticCircle1.transform.position.set([-60, 40, 0]);

        const staticCircle2 = new Circle(45);
        staticCircle2.paint.fill = new Color(0.1, 0.8, 0.9, 0.85);
        staticCircle2.transform.position.set([50, -30, 0]);

        const staticRect = new Rect(70, 70);
        staticRect.paint.fill = new Color(1.0, 0.85, 0.2, 0.9);
        staticRect.transform.position.set([10, 50, 0]);

        staticBlurTarget.add(staticCircle1, staticCircle2, staticRect);

        // Display sprite for static blur
        const staticSprite = staticBlurTarget.toSprite(360, 360);
        staticSprite.transform.position.set([0, 0, 0]);
        this.add(staticSprite);

        // Label for static blur
        const staticLabel = new SDFText("Static Blur (Radius: 20)", { anchor: CENTER, fontSize: 24 });
        staticLabel.paint.fill = new Color(0.9, 0.9, 0.9, 1.0);
        staticLabel.transform.position.set([0, -220, 0]);
        this.add(staticLabel);

        // ---------------------------------------------------------------------
        // 3. DYNAMIC BLUR TARGET (Radius oscillating dynamically 0 -> 24)
        // ---------------------------------------------------------------------
        const dynamicBlurTarget = new RenderTarget(this, "DynamicBlurTarget", {
            width: 400,
            height: 400,
            type: "offscreen",
            blur: 4
        });

        const dynCircle1 = new Circle(60);
        dynCircle1.paint.fill = new Color(0.4, 0.9, 0.3, 1.0);
        dynCircle1.transform.position.set([-50, 30, 0]);

        const dynCircle2 = new Circle(50);
        dynCircle2.paint.fill = new Color(0.9, 0.3, 0.9, 0.85);
        dynCircle2.transform.position.set([40, -40, 0]);

        const dynRect = new Rect(70, 70);
        dynRect.paint.fill = new Color(0.2, 0.6, 1.0, 0.9);
        dynRect.transform.position.set([10, 40, 0]);

        dynamicBlurTarget.add(dynCircle1, dynCircle2, dynRect);

        // Display sprite for dynamic blur
        const dynamicSprite = dynamicBlurTarget.toSprite(360, 360);
        dynamicSprite.transform.position.set([420, 0, 0]);
        this.add(dynamicSprite);

        // Dynamic label
        const dynamicLabel = new SDFText("Dynamic Blur", { anchor: CENTER, fontSize: 24 });
        dynamicLabel.paint.fill = new Color(0.9, 0.9, 0.9, 1.0);
        dynamicLabel.transform.position.set([420, -220, 0]);
        this.add(dynamicLabel);

        // Title text
        const title = new SDFText("Retiam Entity-Level Blur (RenderTarget + BlurPass)", { anchor: CENTER, fontSize: 32 });
        title.paint.fill = new Color(1.0, 1.0, 1.0, 1.0);
        title.transform.position.set([0, 260, 0]);
        this.add(title);

        // ---------------------------------------------------------------------
        // 4. ANIMATION LOOP
        // ---------------------------------------------------------------------
        this.always(() => {
            const t = this.time * 0.002;

            // Rotate inner shapes within targets
            sharpRect.transform.rotateWorldZ(0.015);
            staticRect.transform.rotateWorldZ(0.015);
            dynRect.transform.rotateWorldZ(0.015);

            // Orbit shapes
            const ox = Math.cos(t) * 30;
            const oy = Math.sin(t) * 30;
            sharpCircle1.transform.position.set([-60 + ox, 40 + oy, 0]);
            staticCircle1.transform.position.set([-60 + ox, 40 + oy, 0]);
            dynCircle1.transform.position.set([-50 + ox, 30 + oy, 0]);

            // Dynamically modulate blur radius between 0 and 24
            const dynamicRadius = (Math.sin(t * 1.5) * 0.5 + 0.5) * 24;
            dynamicBlurTarget.blur = dynamicRadius;
            dynamicLabel.text = `Dynamic Blur: ${dynamicRadius.toFixed(1)}px`;
        });
    }
}
