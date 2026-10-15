import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { CENTER, Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText } from "retiam";

export default class TextShowcaseScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 175, 100);
        demoCaption(this, "MSDF typography", "Scalable glyphs with animated text and size");
        // this.clearColor(new Color(0.08, 0.08, 0.12, 1.0));

        // Create MSDF Text
        const text = new SDFText("Vector MSDF Text", { anchor: CENTER });
        text.transform.position = [0, 0, 0];

        // Style parameters
        text.paint.fill = new Color(0.0, 0.8, 1.0, 1.0);   // Neon Blue Fill
        text.paint.stroke = new Color(1.0, 1.0, 1.0, 1.0); // White Outline
        text.paint.strokeWidth = 0.1; // Dynamic stroke width!

        this.add(text);

        // Infinite Animation Loop
        while (true) {
            // Outline fade-out and scale-up
            await this.play([
                new CustomAnimation((t) => {
                    // text.paint.strokeWidth = (1.0 - t) * 3.0;
                    text.transform.setScale(1.0 + t * 0.5);
                }, { duration: 1500, rate_func: Rate.easeInOutQuad() })
            ]);

            await this.wait(300);

            // Change Text dynamically & Outline fade-in
            text.setText("Pure WebGPU");
            await this.play([
                new CustomAnimation((t) => {
                    // text.paint.strokeWidth = t * 3.0;
                    text.transform.setScale(1.5 - t * 0.5);
                }, { duration: 1500, rate_func: Rate.easeInOutQuad() })
            ]);

            await this.wait(500);

            // Back to initial
            text.setText("Vector MSDF Text");
        }
    }
}
