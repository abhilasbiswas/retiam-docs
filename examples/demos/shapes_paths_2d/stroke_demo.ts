import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Vec2 } from "retiam";
import { Vec3 } from "retiam";
import { JointType } from "retiam";

import { Circle } from "retiam";
import { Arc } from "retiam";
import { Poly } from "retiam";
import { Line3D } from "retiam";
import { Rate } from "retiam";
import { CustomAnimation } from "retiam";
import { PathEffect } from "retiam";
import { frameStage, demoCaption } from "../../shared/presentation";

// --- CUSTOM SHADER 1: Physically Accurate Dashed Lines ---
// Uses `total_arc_len` to ensure dashes are exactly 5 units long,
// no matter how big the shape is. Also animates using state.offset/time!
const dashedShader = `
    fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
        let dash_length = 5.0; // 5 units physical length
        let distance_along_path = t * total_arc_len;

        // Scroll the dashes using time (passed via view.time)
        let scroll = view.time * 0.05;

        // Create the dashed pattern
        let pattern = fract((distance_along_path - scroll) / (dash_length * 2.0));

        if (pattern > 0.5) {
            discard; // Creates the empty gap
        }

        return col;
    }
`;

// --- CUSTOM SHADER 2: T-Based Rainbow Gradient ---
// Uses `t` to smoothly transition colors from Start to End
const rainbowShader = `
    fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
        // HSL to RGB approximation based on 't'
        let r = abs(t * 6.0 - 3.0) - 1.0;
        let g = 2.0 - abs(t * 6.0 - 2.0);
        let b = 2.0 - abs(t * 6.0 - 4.0);

        let rainbow = clamp(vec3f(r, g, b), vec3f(0.0), vec3f(1.0));

        // Pulsate opacity slightly using time
        let pulse = sin(view.time * 0.005) * 0.2 + 0.8;

        return vec4f(rainbow, 1.0) * col.a * pulse;
    }
`;

export default class StrokeDemoScene extends Scene {
    public async run() {
        // 1. Setup Scene & Camera
        this.camera.position.set([0, 0, 151]);
        frameStage(this, 192, 174);
        new CameraController(this, this.camera);
        demoCaption(this, "Animated path strokes", "Dashes and gradients follow circles, arcs and computed paths");

        // ==========================================
        // TEST 1: CIRCLE (Exact Math Length)
        // ==========================================
        let circle = new Circle(19, { strokeShader: PathEffect.Dashed(5.0, 2.0) });
        circle.paint.stroke = Color.YELLOW;
        circle.paint.strokeWidth = 2.0;
        circle.paint.fill.a = 0.0; // Transparent fill
        circle.transform.move([-40, 40, 0]);
        this.add(circle);

        // ==========================================
        // TEST 2: ARC (Ramanujan Ellipse Length)
        // ==========================================
        let arc = new Arc(40, 30, 0, Math.PI * 2, { strokeShader: rainbowShader });
        arc.paint.stroke = Color.WHITE;
        arc.paint.strokeWidth = 3.0;
        arc.paint.fill.a = 0.0;
        arc.transform.move([40, 40, 0]);
        this.add(arc);

        // ==========================================
        // TEST 3: POLY / MESH (GPU Computed Length)
        // ==========================================
        let starPoints = [
            new Vec2(0, 20), new Vec2(5, 5), new Vec2(20, 5),
            new Vec2(8, -4), new Vec2(12, -20), new Vec2(0, -10),
            new Vec2(-12, -20), new Vec2(-8, -4), new Vec2(-20, 6),
            new Vec2(-5, 5), new Vec2(0, 20) // Close the star
        ];
        let poly = new Poly(starPoints, { strokeShader: rainbowShader, isClosed: true });
        poly.paint.joint = JointType.ROUND; // Forces compute shader generation
        poly.paint.stroke = Color.WHITE;
        poly.paint.strokeWidth = 2.5;
        poly.paint.fill = Color.fromHex("#17273c");
        poly.transform.move([-40.0, -40, 0]);
        this.add(poly);

        // ==========================================
        // TEST 4: LINE 3D (GPU Computed Length)
        // ==========================================
        let spiralPoints: Vec3[] = [];
        for (let i = 0; i < 500; i++) {
            let t = i / 500.0;
            let angle = t * Math.PI * 10; // 5 full turns
            spiralPoints.push(new Vec3(
                Math.cos(angle) * (10 + t * 20),
                (t - 0.5) * 60,
                Math.sin(angle) * (10 + t * 20)
            ));
        }
        let line3d = new Line3D(spiralPoints, { shader: dashedShader });
        line3d.paint.stroke = Color.GREEN;
        line3d.paint.strokeWidth = 1.5;
        line3d.transform.move([40, -39, 0]);
        this.add(line3d);

        // ==========================================
        // FETCH AND LOG COMPUTED LENGTHS
        // ==========================================
        // Wait briefly to allow the Compute pass to execute and write to the GPU buffers
        await this.wait(50);

        console.log("=========================================");
        console.log(" GPU & CPU ARC LENGTH QUERY RESULTS");
        console.log("=========================================");

        // Synchronous exact math
        console.log(`[Circle] Perimeter (CPU Math): ${(await circle.getTotalLength()).toFixed(2)}`);
        console.log(`[Arc] Perimeter (Ramanujan Approx): ${(await arc.getTotalLength()).toFixed(2)}`);

        // Asynchronous GPU Buffer Reads!
        let polyLen = await poly.getTotalLength();
        console.log(`[Poly Star] Total Length (GPU Compute): ${polyLen.toFixed(2)}`);

        let line3DLen = await line3d.getTotalLength();
        console.log(`[Line 3D Spiral] Total Length (GPU Compute): ${line3DLen.toFixed(2)}`);
        console.log("=========================================");

        // ==========================================
        // ANIMATION LOOP (Testing T1 / T2 drawing)
        // ==========================================
        while (true) {
            // Draw in (0 to 1)
            await this.play([
                circle.animate.setT2(1.0).setT1(0.0).getAnim(),
                arc.animate.setT2(1.0).setT1(0.0).getAnim(),
                poly.animate.setT2(1.0).setT1(0.0).getAnim(),
                line3d.animate.setT2(1.0).setT1(0.0).getAnim()
            ], { duration: 2000, rate_func: Rate.easeInOutCubic() });

            await this.wait(500);

            // Erase out (1 to 1 - shrinking tail)
            await this.play([
                circle.animate.setT2(1.0).setT1(1.0).getAnim(), // t1 -> 1, t2 -> 1
                arc.animate.setT2(1.0).setT1(1.0).getAnim(),
                poly.animate.setT2(1.0).setT1(1.0).getAnim(),
                line3d.animate.setT2(1.0).setT1(1.0).getAnim()
            ], { duration: 2000, rate_func: Rate.easeInOutCubic() });

            // Reset back to hidden
            circle.transform.t1 = 0; circle.transform.t2 = 0;
            arc.transform.t1 = 0; arc.transform.t2 = 0;
            poly.transform.t1 = 0; poly.transform.t2 = 0;
            line3d.transform.t1 = 0; line3d.transform.t2 = 0;
            this.invalidate();

            await this.wait(500);
        }
    }
}
