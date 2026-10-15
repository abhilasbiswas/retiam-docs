import { CENTER, Scene, CameraController, Color, SDFText, Tex, Rate, Vec3, Text } from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class TextShowcaseScene extends Scene {
    public async run() {
        // 1. Setup Camera and Environment
        this.camera.position.set([0, 0, 120]);
        frameStage(this, 180, 110);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark sleek background

        // ==========================================
        // 2. CREATE TEXT ENTITIES
        // ==========================================

        // A. Title (MSDF Font)
        const title = new SDFText("WebGPU Text Systems", { fontSize: 6, anchor: CENTER });
        title.transform.move([0, 30, 0]);
        title.paint.fill = new Color(0.0, 0.9, 1.0, 1.0); // Neon Cyan
        title.paint.setStroke(0.1, new Color(1.0, 1.0, 1.0, 0.5));
        title.paint.opacity = 0; // Hide initially
        this.add(title);

        // B. Standard SVG Text (Solid Fill)
        const svgSolid = new Text("1. OpenType.js SVG (Solid Fill)", { fontSize: 4, anchor: CENTER });
        svgSolid.transform.move([0, 15, 0]);
        svgSolid.paint.fill = new Color(1.0, 0.35, 0.2, 1.0); // Coral
        svgSolid.paint.opacity = 0;
        this.add(svgSolid);

        // C. Standard SVG Text (Stroked)
        const svgStroked = new Text("2. OpenType.js SVG (Outlined)", { fontSize: 4, anchor: CENTER });
        svgStroked.transform.move([0, 5, 0]);
        svgStroked.paint.fill = Color.NONE; // Transparent body
        svgStroked.paint.setStroke(0.2, new Color(0.6, 1.0, 0.4, 1.0)); // Lime Stroke
        svgStroked.paint.opacity = 0;
        this.add(svgStroked);

        // D. MSDF Text (Scaling Test)
        const msdfText = new SDFText("3. MSDF (Infinite Crisp Scaling)", { fontSize: 4, anchor: CENTER });
        msdfText.transform.move([0, -5, 0]);
        msdfText.paint.fill = new Color(1.0, 0.0, 1.0, 1.0); // Magenta
        msdfText.paint.opacity = 0;
        this.add(msdfText);



        // E. MathJax LaTeX Equation (Path Drawing Animation)
        const equation = "\\mathcal{F}\\{f\\}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\,dx";
        const latexTex = new Tex(equation, { fontSize: 4, anchor: CENTER });
        latexTex.transform.move([0, -25, 0]);

        // Setup for drawing animation
        latexTex.paint.fill = Color.NONE;
        latexTex.paint.setStroke(0.15, new Color(1.0, 0.85, 0.0, 1.0)); // Gold
        latexTex.transform.setT1(0.0).setT2(0.0); // Hide path progress completely
        latexTex.paint.opacity = 1.0;
        this.add(latexTex);


        // ==========================================
        // 3. ANIMATION SEQUENCE
        // ==========================================

        // Phase 1: Bring in the Title
        await this.play(
            title.animate.setOpacity(1.0).move([0, 35, 0]).getAnim(),
            { duration: 1200, rate_func: Rate.easeOutCubic() }
        );

        // Phase 2: Bring in the SVG text lines simultaneously
        await this.play([
            svgSolid.animate.setOpacity(1.0).move([0, 18, 0]).getAnim(),
            svgStroked.animate.setOpacity(1.0).move([0, 8, 0]).getAnim(),
        ], { duration: 1000, rate_func: Rate.easeOutCubic() });

        // Phase 3: Bring in MSDF text
        await this.play(
            msdfText.animate.setOpacity(1.0).move([0, -2, 0]).getAnim(),
            { duration: 800, rate_func: Rate.easeOutCubic() }
        );

        await this.wait(500);

        // Phase 4: Demonstrate MSDF Crisp Scaling
        // let baseScale = msdfText.transform.getScale().x;

        // Scale up 2x relative to its base scale, then back down
        await this.play(
            msdfText.animate.setScale(2.0).move([0, -5, 0]).getAnim(),
            { duration: 1500, rate_func: Rate.easeInOutSine() }
        );
        await this.play(
            msdfText.animate.setScale(1).move([0, -2, 0]).getAnim(),
            { duration: 1200, rate_func: Rate.easeInOutSine() }
        );

        await this.wait(500);

        // Phase 5: The "Self-Drawing" Math Equation
        // Animate the path 't' progress from 0% to 100%
        await this.play(
            latexTex.animate.setT2(1.0).setT1(0.0).getAnim(),
            { duration: 4500, rate_func: Rate.easeInOutCubic() }
        );

        // Cross-fade the golden fill color inside the strokes
        await this.play(
            latexTex.animate.setFill(new Color(1.0, 0.85, 0.0, 1.0)).getAnim(),
            { duration: 1000, rate_func: Rate.easeOutQuad() }
        );

        // ==========================================
        // 4. CONTINUOUS EFFECTS
        // ==========================================

        // Add a gentle floating/breathing effect to the title and equation
        this.always(() => {
            const t = this.time * 0.002;

            // Subtly shift world position up and down based on sine wave
            title.transform.shiftWorld(new Vec3(0, Math.sin(t) * 0.03, 0));
            latexTex.transform.shiftWorld(new Vec3(0, Math.cos(t) * 0.03, 0));

            // Keep the scene awake
            this.invalidate();
        });
    }
}
