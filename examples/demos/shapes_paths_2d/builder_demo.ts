import { Scene, CameraController, Builder, JointType, CapType, Color, Text, CENTER } from "retiam";
import { frameStage } from "../../shared/presentation";

export default class BuilderShowcase extends Scene {
    public async run() {
        // 1. Setup Camera and Environment
        this.camera.position.set([0, 0, 120]);
        frameStage(this, 156, 104, 5);
        new CameraController(this, this.camera);

        // 2. DYNAMICALLY LOAD OPENTYPE & ROBOTO FONT FROM CDN
        // This guarantees the example works out-of-the-box in any project setup!
        try {
            // Ensure opentype is loaded globally
            // const ot: any = await new Promise((resolve, reject) => {
            //     if ((window as any).opentype) {
            //         resolve((window as any).opentype);
            //         return;
            //     }
            //     const script = document.createElement('script');
            //     script.src = "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";
            //     script.onload = () => resolve((window as any).opentype);
            //     script.onerror = (err) => reject(new Error("Failed to load opentype.js from CDN"));
            //     document.head.appendChild(script);
            // });

            // // Fetch the Roboto font
            // const fontUrl = "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
            // const loadedFont = await new Promise<any>((resolve, reject) => {
            //     ot.load(fontUrl, (err, font) => {
            //         if (err || !font) reject(err || new Error("Failed to load font file"));
            //         else resolve(font);
            //     });
            // });

            // Inject the font into the engine's static class properties
            // (Text as any).font = loadedFont;
            // (Text as any).is_loaded = true;

            console.log("Opentype.js and Google Font successfully loaded from CDN.");
        } catch (e) {
            console.error("Failed to load CDN assets for Builder.text():", e);
        }

        // =======================================================
        // EXAMPLE 1: The Star (Parametric shapes)
        // =======================================================
        const star = new Builder()
            .star(-40, 30, 5, 15, 6) // cx, cy, points, outerRadius, innerRadius
            .build();

        star.paint.fill = new Color(1.0, 0.8, 0.1, 1.0);     // Gold Fill
        star.paint.stroke = new Color(1.0, 0.5, 0.0, 1.0);   // Orange Stroke
        star.paint.strokeWidth = 1.5;
        star.paint.joint = JointType.ROUND;


        // =======================================================
        // EXAMPLE 2: UI Badge (Rounded Rect + Embedded Text)
        // =======================================================
        // Chaining text directly to the rounded rectangle path
        const badge = new Builder()
            .roundedRect(10, 20, 60, 20, [6, 6, 6, 6])
            .build();

        badge.paint.fill = new Color(0.2, 0.6, 1.0, 1.0);
        badge.paint.stroke = Color.WHITE;
        badge.paint.strokeWidth = 1.0;

        // Builder.text uses 120-unit glyphs; fit the lettering inside the badge.
        const badgeText = new Builder().text("WebGPU API", 0, 0).build({
            anchor: CENTER, fill: Color.WHITE, stroke: Color.NONE,
        });
        badgeText.transform.setScale([0.065, -0.065, 1]);
        badgeText.move([40, 30, 0]);
        badge.add(badgeText);


        // =======================================================
        // EXAMPLE 3: Mathematical Spline
        // =======================================================
        const spline = new Builder()
            .spline([[-50, -10], [-30, 10], [-10, -20], [10, 0], [30, -15]], 0.5)
            .build();

        spline.paint.stroke = new Color(0.1, 1.0, 0.6, 1.0); // Neon Green
        spline.paint.strokeWidth = 2.0;
        spline.paint.fill = Color.NONE;
        spline.paint.cap = CapType.ROUND;


        // =======================================================
        // EXAMPLE 4: Dash Lines & Arrows
        // =======================================================
        const connection = new Builder()
            .dashedLine(-40, 10, -40, -10, 3, 4)         // Drop down from the star
            .arrow(-40, -10, -48, -10, 5, Math.PI / 6)   // Point left towards the spline
            .build();

        connection.paint.stroke = new Color(0.8, 0.8, 0.8, 1.0);
        connection.paint.strokeWidth = 1.0;


        // =======================================================
        // EXAMPLE 5: Complex Composite Path (A Cloud)
        // =======================================================
        const cloud = new Builder()
            .moveTo(40, -20)
            .arc(40, -20, 8, Math.PI, Math.PI * 2)
            .arc(52, -24, 12, Math.PI, Math.PI * 2.2)
            .arc(64, -20, 8, Math.PI * 1.2, Math.PI * 2.5)
            .lineTo(64, -12)
            .lineTo(32, -12)
            .closePath()
            .build();

        cloud.paint.fill = new Color(0.9, 0.9, 0.95, 1.0);
        cloud.paint.stroke = new Color(0.5, 0.5, 0.6, 1.0);
        cloud.paint.strokeWidth = 1.5;
        cloud.paint.joint = JointType.ROUND;


        // 3. Add everything to the Scene
        this.add(star, badge, spline, connection, cloud);

        // 4. Add a quick animation to show they are standard transformable Entities
        this.always(() => {
            // star.transform.rotateWorldInPlaceZ(this.dt * 0.001);
            cloud.transform.position.y = Math.sin(this.time * 0.002) * 3;
            this.invalidate(); // Force scene redraw
        });
    }
}
