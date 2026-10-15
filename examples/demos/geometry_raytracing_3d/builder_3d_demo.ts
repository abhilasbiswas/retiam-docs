import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: src/main.ts
// =========================================================================

import {
    Scene,
    InteractionManager,
    CameraController,
    Plane,
    Sphere,
    Color,
    Vec3,
    Builder3D
} from "retiam";

export default class Interactive2DShadowsScene extends Scene {
    private sceneModels: any[] = [];

    public async run() {
        // 1. Establish Camera & Interactions
        this.camera.position.set([0, 15, 60]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Procedural geometry builder", "Curves, text and solids with real-time shadows");
        this.interactionManager = new InteractionManager(this);

        // 2. Set Up Ground to Catch Shadows
        const ground = new Plane(150, 150);
        ground.transform.position = [0, -10, 0];
        ground.material.color = new Color(0.8, 0.8, 0.8, 1.0); // Light gray to show off shadows
        ground.material.roughness = 0.9;
        this.add(ground);

        // =====================================================================
        // SECTION A: 2D "Models" (Flat Planes with Alpha Textures Casting Shadows)
        // =====================================================================

        // 1. 2D Typographic Text Model
        const textTex = this.createTextTexture("2D SHADOW");
        const textModel = new Plane(24, 12); // Width, Height

        textModel.transform.position = new Vec3(-15, 5, 10);
        textModel.transform.rotateWorldX(Math.PI / 2); // Stand it upright
        textModel.setTextureMap(textTex);
        this.setupMaterialAndInteraction(textModel, new Color(1.0, 0.2, 0.4, 1.0));

        // 2. 2D Hollow Shape Model (e.g., A gear/ring)
        const shapeTex = this.createShapeTexture();
        const shapeModel = new Plane(12, 12);
        shapeModel.transform.position = new Vec3(-15, 5, -10);
        shapeModel.transform.rotateWorldX(Math.PI / 2); // Stand it upright
        shapeModel.setTextureMap(shapeTex);
        this.setupMaterialAndInteraction(shapeModel, new Color(0.2, 0.8, 1.0, 1.0));

        // =====================================================================
        // SECTION B: Solid 3D Primitives & Builder3D Meshes
        // =====================================================================

        // 3. Standard 3D Sphere
        const sphereModel = new Sphere(5, { widthSegments: 32, heightSegments: 32 });
        sphereModel.transform.position = new Vec3(10, 5, 10);
        this.setupMaterialAndInteraction(sphereModel, new Color(0.9, 0.8, 0.1, 1.0));

        // 4. Builder3D Extruded Star Tube
        const starBuilder = new Builder3D();
        starBuilder.star(0, 0, 0, 5, 5, 2);
        const starModel = starBuilder.buildModel(0.6, 12); // Extrude with radius 0.6
        starModel.transform.position = new Vec3(10, 5, -10);
        this.setupMaterialAndInteraction(starModel, new Color(0.1, 0.9, 0.3, 1.0));

        // =====================================================================
        // Global Update & Rendering Loop
        // =====================================================================
        this.always(() => {
            const rotSpeed = this.dt * 0.0005;

            this.sceneModels.forEach((model, index) => {
                // Ignore model rotation if it is currently being dragged
                if (model !== (this.interactionManager as any).activeDraggedEntity) {
                    model.transform.rotateWorldY(rotSpeed * (index % 2 === 0 ? 1 : -1));

                    // Only tumble the 3D objects, keep the 2D planes strictly upright
                    if (model instanceof Sphere || model.LABEL === "Model") {
                        model.transform.rotateWorldX(rotSpeed * 0.5);
                    }
                }
            });

            this.invalidate();
        });
    }

    /**
     * Helper to apply PBR Materials and bind hover/drag events
     */
    private setupMaterialAndInteraction(model: any, color: Color) {
        model.material.color = color;
        model.material.emColor = color;
        model.material.emStrength = 0.5; // Baseline glow
        model.material.roughness = 0.2;  // Shiny
        model.material.metallic = 0.1;

        // Ensure models cast and receive shadows
        model.CAST_SHADOW = true;
        model.RECEIVE_SHADOW = true;

        this.add(model);
        this.sceneModels.push(model);

        // Capture base scale explicitly to prevent matrix decomposition flipping
        const baseScale = model.transform.getScale().clone();

        model
            .setDraggable(true)
            .setEvent("pointerover", () => {
                model.transform.setScale(baseScale.scale(1.1));
                model.material.emStrength = 2.5; // High glow on hover
                this.invalidate();
            })
            .setEvent("pointerout", () => {
                model.transform.setScale(baseScale);
                model.material.emStrength = 0.5; // Return to baseline glow
                this.invalidate();
            })
            .setEvent("dragstart", () => {
                model.material.color = new Color(1, 1, 1, 1); // Flash white while dragging
                this.invalidate();
            })
            .setEvent("dragend", () => {
                model.material.color = color; // Restore original color
                this.invalidate();
            });
    }

    // =========================================================================
    // 2D Canvas Texture Generators for Alpha Cutout Shadows
    // =========================================================================

    /**
     * Renders bold text onto a transparent canvas.
     * The white pixels will be tinted by `material.color` in the fragment shader.
     */
    private createTextTexture(text: string): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Perfectly transparent background

        ctx.fillStyle = "white";
        ctx.font = "bold 150px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        return canvas;
    }

    /**
     * Renders a hollow gear/ring shape onto a transparent canvas.
     */
    private createShapeTexture(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.fillStyle = "white";
        ctx.beginPath();
        // Outer circle
        ctx.arc(cx, cy, 220, 0, Math.PI * 2);
        // Inner circle (drawn in reverse to create a hole using the nonzero winding rule)
        ctx.arc(cx, cy, 120, 0, Math.PI * 2, true);
        ctx.fill();

        // Draw spokes
        ctx.lineWidth = 40;
        ctx.strokeStyle = "white";
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy - 220);
            ctx.lineTo(cx, cy + 220);
            ctx.stroke();
            // Rotate the context for the next spoke
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-cx, -cy);
        }

        return canvas;
    }
}
