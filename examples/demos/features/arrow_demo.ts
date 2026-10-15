import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";
import { Scene, Color, SDFText, Text, Create, Group, Arrow, Rate, Circle, CameraLookAt, CameraOrbit, Axes, CameraController, CustomAnimation, Vec3, Path, Write, ArrowTipType, CameraDollyZoom, Create3D, Math3D, MathShape3D, Model, MorphMode, MorphModel, State, StateAnimation, Arrow3D, Sphere, ThreeDAxes, OrbitCameraController } from "retiam";

export default class ArrowDemo extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Camera & Environment
        this.camera.position.set([0, 5, 25]);
        new OrbitCameraController(this, this.camera);

        const axes = new ThreeDAxes({
            xRange: [-10, 10, 2],
            yRange: [-10, 10, 2],
            zRange: [-10, 10, 2],
            showGrid: true,
            gridPlanes: ['xz']
        });
        this.add(axes);
        frameContent(this, axes, 0.32);
        demoCaption(this, "Arrows in two and three dimensions", "Straight paths, smooth curves and a tracking arrow");

        // ==========================================
        // 2D ARROWS (Placed on the left)
        // ==========================================

        // A. Standard Stealth Arrow (Straight)
        const arrow2D_stealth = new Arrow([-8, 8, 0], [-2, 8, 0], {
            color: Color.RED,
            strokeWidth: 0.15,
            tipType: 'stealth'
        });

        // B. Triangle Arrow (Smooth Curve)
        const arrow2D_smooth = new Arrow(undefined, undefined, {
            points: [[-8, 5, 0], [-6, 3, 0], [-4, 6, 0], [-2, 4, 0]],
            isSmooth: true,
            color: Color.YELLOW,
            strokeWidth: 0.15,
            tipType: 'triangle'
        });

        // C. Line Arrow (Straight)
        const arrow2D_line = new Arrow([-8, 1, 0], [-2, 1, 0], {
            color: Color.GREEN,
            strokeWidth: 0.15,
            tipType: 'line'
        });

        // ==========================================
        // 3D ARROWS (Placed on the right)
        // ==========================================

        // A. Standard 3D Arrow
        const arrow3D_straight = new Arrow3D([2, 8, -5], [8, 8, 5], {
            color: new Color(0.2, 0.6, 1.0, 1.0),
            strokeWidth: 0.1,
            headRadius: 0.25,
            headLength: 0.6
        });

        // B. Smooth 3D Spline Arrow
        const arrow3D_smooth = new Arrow3D(undefined, undefined, {
            points: [[2, 2, -5], [4, 6, -2], [6, 1, 2], [8, 5, 5]],
            isSmooth: true,
            color: new Color(1.0, 0.2, 0.8, 1.0),
            strokeWidth: 0.1,
            headRadius: 0.25
        });

        // ==========================================
        // DYNAMIC TRACKING ARROW
        // ==========================================

        const targetSphere = new Sphere(0.05);
        targetSphere.material.color = Color.CYAN.rgba;
        targetSphere.material.emColor = Color.CYAN.rgba;
        targetSphere.material.emStrength = 1.0;
        this.add(targetSphere);

        const trackingArrow = new Arrow3D(undefined, undefined, {
            color: Color.CYAN,
            strokeWidth: 0.08,
            headRadius: 0.3
        });
        this.add(trackingArrow);

        // Continuously update the sphere's position and make the arrow track it!
        this.always(() => {
            const t = this.time * 0.002;
            targetSphere.transform.position = new Vec3(
                Math.cos(t) * 8,
                Math.sin(t * 1.5) * 4 + 4,
                Math.sin(t) * 8
            );

            // Put the start at the origin, and the end at the moving sphere
            trackingArrow.putStartAndEndOn([0, 0, 0], targetSphere.transform.position);
        });

        // ==========================================
        // ANIMATION SEQUENCE
        // ==========================================

        // Hide all static arrows initially by setting their drawing parameter (t2) to 0
        const staticArrows = [arrow2D_stealth, arrow2D_smooth, arrow2D_line, arrow3D_straight, arrow3D_smooth];
        staticArrows.forEach(arr => {
            arr.transform.t2 = 0;
            this.add(arr);
        });

        // 1. Draw 2D Arrows
        await this.play([
            arrow2D_stealth.animate.setT2(1.0),
            arrow2D_smooth.animate.setT2(1.0),
            arrow2D_line.animate.setT2(1.0)
        ], { duration: 1500, rate_func: Rate.easeInOutSine(), lagRatio: 0.2 });

        await this.wait(500);

        // 2. Draw 3D Arrows
        await this.play([
            arrow3D_straight.animate.setT2(1.0),
            arrow3D_smooth.animate.setT2(1.0)
        ], { duration: 2000, rate_func: Rate.easeInOutCubic(), lagRatio: 0.2 });

        // Let the tracking arrow dance indefinitely
        await this.wait(100000);
    }
}
