import { frameStage, demoCaption } from "../../shared/presentation";

// ====================================================================
// A self-contained Scene with its own infinite animation loop

import { CameraController, Color, CustomAnimation, Rate, Rect, Scene, Sprite } from "retiam";
import { SubScene } from "retiam";

// ====================================================================
class BouncingBoxScene extends Scene {
    public async run() {
        // Give it a slightly different background color (visible if rendered to a portal)

        const box = new Rect(20, 20);
        box.paint.fill = new Color(1.0, 0.3, 0.3, 1.0);
        this.add(box);

        // Infinite loop - runs entirely in its own local time!
        while (true) {
            await this.play(new CustomAnimation(t => {
                box.transform.position = [-30 + t * 60, 0, 0];
                box.transform.setRotationZ(t * Math.PI);
            }, { duration: 1000, rate_func: Rate.easeInOutQuad() }));

            await this.play(new CustomAnimation(t => {
                box.transform.position = [30 - t * 60, 0, 0];
                box.transform.setRotationZ((1 + t) * Math.PI);
            }, { duration: 1000, rate_func: Rate.easeInOutQuad() }));
        }
    }
}

// ====================================================================
// The Master Scene
// ====================================================================

let count = 3;
export default class MainScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 150]);
        new CameraController(this, this.camera);
        frameStage(this, 190, 160);
        demoCaption(this, "Scenes within scenes", "Independent timelines and live render-to-texture portals");
        // this.clearColor(new Color(0.05, 0.05, 0.08, 1.0));

        // ----------------------------------------------------
        // METHOD 1: INLINE SUBSCENE (Prefab)
        // ----------------------------------------------------
        // Shares the parent camera, but runs its own internal time & animations!

        const inlineGroup = new SubScene(new BouncingBoxScene());
        inlineGroup.transform.position = [0, 40, 0];
        inlineGroup.transform.setScale(1.5); // Scale the whole prefab
        this.add(inlineGroup);


        // ----------------------------------------------------
        // METHOD 2: PORTAL SUBSCENE (Render to Texture)
        // ----------------------------------------------------
        // Completely isolated renderer, projected onto a 2D Sprite!
        if (count > 0) {
            count--;
            const portalCanvas = new OffscreenCanvas(512, 512);
            const portalScene = new MainScene();
            portalScene.clearColor(new Color(0.1, 0.1, 0.1, 0.3));
            // Boot up the isolated scene independently
            await portalScene.start(portalCanvas);

            // Map the output canvas to a Sprite
            const tvScreen = new Sprite(60, 60, portalCanvas);
            tvScreen.transform.position = [0, -10, 0];
            this.add(tvScreen);

            // Animate the TV Screen spinning in 3D
            this.always(() => {
                tvScreen.transform.rotateWorldY(this.dt * 0.0005);
                tvScreen.refresh(); // Upload the latest portal pixels to the GPU
                this.invalidate();
            });
        }
    }
}
