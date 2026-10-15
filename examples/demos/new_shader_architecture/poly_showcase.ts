import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate } from "retiam";

export default class PolyShowcaseScene extends Scene {
    public async run() {
        // 1. Setup Camera
        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        frameStage(this, 84, 86);
        demoCaption(this, "A programmable path stroke", "An animated star with custom fragment shading");

        // 2. Generate a complex Star shape using basic Math
        const points: Vec2[] = [];
        const numPoints = 5;
        const outerRadius = 30;
        const innerRadius = 12;

        for (let i = 0; i <= numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / numPoints - (Math.PI / 2);
            points.push(new Vec2(Math.cos(angle) * radius, Math.sin(angle) * radius));
        }

        // 3. Create the Poly Entity
        // We use a custom shader to color the stroke like a glowing rainbow
        const customPathEffect = `
            fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
                // Generate a rainbow effect along the length of the path (t goes 0 to 1)
                let r = sin(t * 6.28 + 0.0) * 0.5 + 0.5;
                let g = sin(t * 6.28 + 2.0) * 0.5 + 0.5;
                let b = sin(t * 6.28 + 4.0) * 0.5 + 0.5;

                // Add a glowing core to the stroke based on width 'w'
                let core = smoothstep(0.5, 1.0, 1.0 - abs(w));
                let rgb = mix(vec3f(r, g, b), vec3f(1.0), core * 0.8);

                return vec4f(rgb, col.a);
            }
        `;

        const star = new Poly(points, { strokeShader: customPathEffect, isClosed: true });

        // Setup Paint Properties
        star.paint.fill = new Color(0.8, 0.5, 1.0, 0.9); // Semi-transparent Blue Fill
        star.paint.stroke = new Color(1.0, 1.0, 1.0, 1.0); // Required to activate the pass
        star.paint.strokeWidth = 2.0; // 3 pixels wide
        star.paint.opacity = 0.5;

        this.add(star);

        // 4. Infinite Drawing Animation Loop
        while (true) {
            // Un-draw the star
            await this.play(new CustomAnimation((t) => {
                star.transform.t2 = 1.0 - t;
            }, { duration: 1500, rate_func: Rate.easeInOutCubic() }));

            await this.wait(500);

            // Re-draw the star
            await this.play(new CustomAnimation((t) => {
                star.transform.t2 = t;
            }, { duration: 2500, rate_func: Rate.easeInOutCubic() }));

            await this.wait(1000);
        }
    }
}
