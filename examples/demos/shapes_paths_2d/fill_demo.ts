import { CENTER, Scene, Vec3, Text, CameraController, Color, ThreeDAxes, VectorField3D, Group, CameraModel, Axes, Builder, DrawBorderThenFill, Path, PathEffect, Rate, FillEffect } from "retiam";
import { demoBackground } from "../../shared/presentation";


export default class FillDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera
        this.camera.position.set([0, 0, 35]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark background

        // ==========================================
        // SHAPE 1: Linear Gradient Hexagon
        // ==========================================
        let b1 = new Builder();
        b1.polygon([
            [0, 4], [3.46, 2], [3.46, -2],
            [0, -4], [-3.46, -2], [-3.46, 2]
        ]);
        let hex = new Path(
            b1.toString(),
            {
                strokeShader: PathEffect.Solid(),
                fillShader: FillEffect.LinearGradient([Color.RED, Color.YELLOW], -3.46, -4, 3.46, 4)
            }
        );
        hex.paint.fill = Color.WHITE; // Base alpha multiplier
        hex.paint.stroke = Color.YELLOW;
        hex.paint.strokeWidth = 0.1;
        hex.transform.position = new Vec3(-10, 0, 0);

        let lbl1 = new Text("Linear", { anchor: CENTER, fontSize: 2 });
        lbl1.paint.fill = Color.WHITE;
        lbl1.transform.position = new Vec3(-10, -6, 0);

        // ==========================================
        // SHAPE 2: Radial Gradient Circle
        let b2 = new Builder();
        b2.circle(0, 0, 4);

        // Force the alpha to 1.0 so it doesn't fall back to transparent
        let customCyan = new Color(0.0, 1.0, 1.0, 1.0);
        let customBlue = new Color(0.0, 0.0, 1.0, 1.0);

        let circle = new Path(
            b2.toString(), {
            strokeShader: PathEffect.Glow(0.2),
            fillShader: FillEffect.RadialGradient([customCyan, Color.WHITE, customBlue], 0, 0, 4.0)
        }
        );
        circle.paint.fill = Color.WHITE;
        circle.paint.stroke = customCyan;
        circle.paint.strokeWidth = 0.4;
        circle.transform.position = new Vec3(0, 0, 0);

        let lbl2 = new Text("Radial", { anchor: CENTER, fontSize: 2 });
        lbl2.paint.fill = Color.WHITE;
        lbl2.transform.position = new Vec3(0, -6, 0);

        // ==========================================
        // SHAPE 3: Checkerboard Rectangle
        // ==========================================
        let b3 = new Builder();
        b3.roundedRect(-3.5, -3.5, 7, 7, 1);
        let rect = new Path(
            b3.toString(),
            {
                strokeShader: PathEffect.Dashed(0.5, 0.3), // Dashed stroke!
                fillShader: FillEffect.Checkerboard(new Color(1, 0, 1, 1), new Color(0.1, 0.1, 0.1, 1), 1.0)
            }
        );
        rect.paint.fill = Color.WHITE;
        rect.paint.stroke = new Color(1, 0, 1, 1); // magenta
        rect.paint.strokeWidth = 0.15;
        rect.transform.position = new Vec3(10, 0, 0);

        let lbl3 = new Text("Checkerboard", { anchor: CENTER, fontSize: 2 });
        lbl3.paint.fill = Color.WHITE;
        lbl3.transform.position = new Vec3(10, -6, 0);

        // Add everything to scene
        this.add(hex, circle, rect, lbl1, lbl2, lbl3);

        // Hide labels initially
        lbl1.paint.opacity = 0; lbl2.paint.opacity = 0; lbl3.paint.opacity = 0;


        // ==========================================
        // ANIMATION SEQUENCE
        // ==========================================

        // 1. Draw the borders, then fade in the complex fills
        await this.play(new DrawBorderThenFill([hex, circle, rect], {
            duration: 2500,
            lagRatio: 0.1,
            rate_func: Rate.easeOutCubic()
        }));

        // 2. Fade in labels
        await this.play([
            lbl1.animate.setOpacity(1.0).getAnim(),
            lbl2.animate.setOpacity(1.0).getAnim(),
            lbl3.animate.setOpacity(1.0).getAnim()
        ], { duration: 1000 });

        // 3. Continuous gentle spin
        this.always(() => {
            hex.transform.rotateWorldZ(this.dt * 0.0005);
            rect.transform.rotateWorldZ(-this.dt * 0.0005);
            this.invalidate(); // Force redraw while rotating
        });

        // 4. Hang out and admire
        await this.wait(10000);
    }
}
