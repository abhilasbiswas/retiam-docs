import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, InteractionManager, CameraController, Plane, Color, Box, Vec3, Sphere } from "retiam";

export default class ShadowTransparencyScene extends Scene {
    private interactiveModels: any[] = [];

    public async run() {
        // 1. Setup Camera & Interactions
        this.camera.position.set([0, 15, 60]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Transparent shadow casting", "Solid, open and translucent forms share the same light");
        this.interactionManager = new InteractionManager(this);

        // 2. Add Ground Plane to receive shadows
        const ground = new Plane(150, 150);
        ground.transform.position = [0, -10, 0];
        ground.material.color = new Color(0.8, 0.8, 0.8, 1.0); // Light gray to see shadows clearly
        ground.material.roughness = 0.9;
        this.add(ground);

        // =====================================================================
        // 3. CREATE DYNAMIC ALPHA-CUTOUT TEXTURES
        // =====================================================================
        const grateTexture = this.createGrateTexture();
        const leafTexture = this.createLeafTexture();

        // =====================================================================
        // 4. SCENE OBJECTS
        // =====================================================================

        // A. The Grate Box (Hollow box with bars)
        const grateBox = new Box(12, 12, 12);
        grateBox.transform.position = new Vec3(-15, 2, 0);
        grateBox.setTextureMap(grateTexture);
        // Important: Ensure the base color has full alpha so the texture alpha dictates transparency
        grateBox.material.color = new Color(1.0, 1.0, 1.0, 1.0);
        this.add(grateBox);
        this.interactiveModels.push(grateBox);

        // B. The Standing Leaf Cutout (Standing Plane)
        const leafPlane = new Plane(16, 16);
        leafPlane.transform.position = new Vec3(15, 2, 0);
        // Rotate 90 degrees on X to stand it up like a billboard
        leafPlane.transform.rotateWorldX(Math.PI / 2);
        leafPlane.setTextureMap(leafTexture);
        leafPlane.material.color = new Color(1.0, 1.0, 1.0, 1.0);
        // Disable backface culling implicitly by applying it as a thin plane
        this.add(leafPlane);
        this.interactiveModels.push(leafPlane);

        // C. Solid Sphere (To cast solid shadows ONTO the transparent objects)
        const sphere = new Sphere(5, { widthSegments: 32, heightSegments: 32 });
        sphere.transform.position = new Vec3(0, 12, 15);
        sphere.material.color = new Color(1.0, 0.2, 0.2, 1.0);
        sphere.material.roughness = 0.2;
        this.add(sphere);
        this.interactiveModels.push(sphere);

        // =====================================================================
        // 5. ADD INTERACTIVITY (Drag to test shadows!)
        // =====================================================================
        this.interactiveModels.forEach(model => {
            const originalScale = model.transform.getScale().clone();

            model
                .setDraggable(true)
                .setEvent("pointerover", () => {
                    model.transform.setScale(originalScale.scale(1.1));
                    model.material.emStrength = 0.5; // Slight glow on hover
                    this.invalidate();
                })
                .setEvent("pointerout", () => {
                    model.transform.setScale(originalScale);
                    model.material.emStrength = 0.0;
                    this.invalidate();
                });
        });

        // =====================================================================
        // 6. RENDER LOOP
        // =====================================================================
        this.always(() => {
            const rotSpeed = this.dt * 0.0005;

            this.interactiveModels.forEach((model) => {
                // Keep them rotating so you can see the shadow shape change,
                // but pause rotation when the user grabs one.
                if (model !== (this.interactionManager as any).activeDraggedEntity) {
                    model.transform.rotateWorldY(rotSpeed);

                    // Box rotates on multiple axes, plane and sphere just spin on Y
                    if (model instanceof Box) {
                        model.transform.rotateWorldX(rotSpeed * 0.5);
                        model.transform.rotateWorldZ(rotSpeed * 0.3);
                    }
                }
            });

            this.invalidate();
        });
    }

    /**
     * Generates a metal grate/fence texture.
     * Pixels between the bars are completely transparent (Alpha = 0).
     */
    private createGrateTexture(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Ensure background is perfectly transparent
        ctx.clearRect(0, 0, size, size);

        // Draw the iron bars
        ctx.fillStyle = "#555555";
        const thickness = 40;
        const spacing = 128;

        for (let i = 0; i <= size; i += spacing) {
            ctx.fillRect(i, 0, thickness, size); // Vertical bars
            ctx.fillRect(0, i, size, thickness); // Horizontal bars
        }

        // Outer frame
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, size - 30, size - 30);

        return canvas;
    }

    /**
     * Generates an organic leaf shape.
     * Everything outside the leaf is completely transparent (Alpha = 0).
     */
    private createLeafTexture(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Ensure background is perfectly transparent
        ctx.clearRect(0, 0, size, size);

        // Draw an organic leaf shape
        ctx.fillStyle = "#22cc55";
        ctx.beginPath();
        ctx.moveTo(256, 450); // Bottom stem
        ctx.bezierCurveTo(450, 400, 450, 100, 256, 50); // Right curve
        ctx.bezierCurveTo(50, 100, 50, 400, 256, 450);  // Left curve
        ctx.fill();

        // Draw some transparent veins cutting through the leaf!
        // Because we use globalCompositeOperation = 'destination-out',
        // these lines will ERACE the green pixels, making them transparent again.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";

        // Main center vein
        ctx.beginPath();
        ctx.moveTo(256, 430);
        ctx.lineTo(256, 80);
        ctx.stroke();

        // Side veins
        for (let y = 150; y <= 350; y += 60) {
            ctx.beginPath();
            ctx.moveTo(256, y);
            ctx.lineTo(256 + 100 - (y * 0.1), y - 50);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(256, y);
            ctx.lineTo(256 - 100 + (y * 0.1), y - 50);
            ctx.stroke();
        }

        // Restore composite operation just in case
        ctx.globalCompositeOperation = 'source-over';

        return canvas;
    }
}
