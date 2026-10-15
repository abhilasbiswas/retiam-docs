import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, InteractionManager, CameraController, Plane, Color, Box, Vec3, Sprite } from "retiam";

export default class CanvasTextureScene extends Scene {

    public async run() {
        // 1. Setup Camera & Interaction
        this.camera.position.set([0, 5, 40]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Live textures and shadows", "A canvas texture updates on rotating geometry");
        this.interactionManager = new InteractionManager(this);

        // 2. Setup Ground
        const ground = new Plane(100, 100);
        ground.transform.position = [0, -10, 0];
        ground.material.color = new Color(0.2, 0.2, 0.2, 1.0);
        this.add(ground);

        // =====================================================================
        // 3. CREATE THE CANVAS 2D TEXTURE
        // =====================================================================
        const myCanvasTexture = this.generateCustomCanvasTexture();

        // =====================================================================
        // 4. APPLY TO A 3D BOX
        // =====================================================================
        const box3D = new Box(12, 12, 12);
        box3D.transform.position = new Vec3(-10, 0, 0);
        box3D.material.roughness = 0.3;

        // Map the canvas directly as the Albedo Texture
        box3D.setTextureMap(myCanvasTexture);
        this.add(box3D);

        // Add Interactivity
        box3D.setDraggable(true)
            .setEvent("pointerover", () => {
                box3D.transform.setScale(1.1);
                box3D.material.emColor = new Color(1.0, 1.0, 1.0, 1.0);
                box3D.material.emStrength = 0.5; // Slight glow on hover
                this.invalidate();
            })
            .setEvent("pointerout", () => {
                box3D.transform.setScale(1.0);
                box3D.material.emStrength = 0.0;
                this.invalidate();
            });

        // =====================================================================
        // 5. APPLY TO A 2D SPRITE
        // =====================================================================
        // Sprites inherently accept Canvas elements as their source
        const sprite2D = new Sprite(12, 12, myCanvasTexture);
        sprite2D.transform.position = new Vec3(10, 0, 0);
        this.add(sprite2D);

        // Add Interactivity
        sprite2D.setDraggable(true)
            .setEvent("pointerover", () => {
                sprite2D.transform.setScale(1.1);
                this.invalidate();
            })
            .setEvent("pointerout", () => {
                sprite2D.transform.setScale(1.0);
                this.invalidate();
            });

        // =====================================================================
        // 6. RENDER LOOP
        // =====================================================================
        this.always(() => {
            const rotSpeed = this.dt * 0.0005;

            // Rotate the 3D Box
            box3D.transform.rotateWorldY(rotSpeed);
            box3D.transform.rotateWorldX(rotSpeed * 0.5);

            // Rotate the 2D Sprite on its Z-axis (keeps it flat facing the camera)
            sprite2D.transform.rotateWorldZ(-rotSpeed);

            this.invalidate();
        });
    }

    /**
     * Generates a dynamic procedural texture using the HTML5 Canvas 2D API.
     */
    private generateCustomCanvasTexture(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const size = 1024; // High-res texture
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d")!;
        const cx = size / 2;
        const cy = size / 2;

        // 1. Fill Background
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, size, size);

        // 2. Draw a Grid Pattern
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 4;
        for (let i = 0; i <= size; i += 64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
        }

        // 3. Draw Concentric Radar Circles
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 10;
        for (let r = 100; r <= 400; r += 100) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 4. Draw Crosshairs
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, size);
        ctx.moveTo(0, cy); ctx.lineTo(size, cy);
        ctx.stroke();

        // 5. Draw 2D Text in the center
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 80px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Add a nice drop shadow to the text
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.fillText("CANVAS 2D", cx, cy - 50);
        ctx.fillText("TEXTURE", cx, cy + 50);

        return canvas;
    }
}
