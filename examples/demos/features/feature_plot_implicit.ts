import { Scene, CameraController, Color, Axes, Vec3, ThreeDAxes, SurfaceViewStyle, Waiting, ImplicitCurve2DGPU } from "retiam";
import { ImplicitCurve2D } from "retiam";
import { ImplicitSurface3D } from "retiam";
import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";

export default class ImplicitMathScene extends Scene {
    public async run() {
        // 1. Setup Camera & Backdrop
        this.camera.position.set([0, 2, 22]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        // ====================================================
        // DEMO 1: 2D Implicit Curve (Folium of Descartes)
        // ====================================================
        const axes2D = new Axes({
            xRange: [-4, 4, 1],
            yRange: [-4, 4, 1],
            width: 15,
            height: 5,
            showGrid: true
        });
        axes2D.transform.position = new Vec3(0, 8, 0);
        this.add(axes2D);

        // Equation: x^3 + y^3 - 3*x*y = 0
        const equation2D = `
            return x*x*x + y*y*y - 3.0*x*y;
        `;

        const implicitCurve = new ImplicitCurve2DGPU(axes2D, equation2D, {
            stroke: new Color(0.1, 0.9, 0.9, 1.0), // Neon Cyan
            strokeWidth: 0.1
        });

        // Add as child to inherit alignment
        axes2D.add(implicitCurve);

        // ====================================================
        // DEMO 2: 3D Implicit Surface (Genus-1 G自由 Torus)
        // ====================================================
        const axes3D = new ThreeDAxes({
            xRange: [-4, 4, 1],
            yRange: [-4, 4, 1],
            zRange: [-4, 4, 1],
            showGrid: true
        });
        axes3D.transform.position = new Vec3(0, -4, 0);
        axes3D.transform.setRotationX(Math.PI / 8);
        this.add(axes3D);

        // Torus algebraic equation: (x^2 + y^2 + z^2 + R^2 - r^2)^2 - 4*R^2*(x^2 + y^2) = 0
        // With R=2.0 and r=0.8
        const equation3D = `
            let R2 = 4.0;
            let r2 = 0.64;
            let sumSq = x*x + y*y + z*z;
            let term = sumSq + R2 - r2;
            return term * term - 4.0 * R2 * (x*x + z*z); // Note WebGPU coordinates (Z is depth, mapped to Y math)
        `;

        const implicitSurface = new ImplicitSurface3D(axes3D, equation3D, {
            resolution: 48,
            viewStyle: SurfaceViewStyle.HEATMAP,
            color: Color.WHITE
        });

        // Add as child to align to coordinates
        axes3D.add(implicitSurface);
        frameContent(this, [axes2D, axes3D], 0.35);
        demoCaption(this, "Implicit curves and surfaces", "A folium of Descartes above an algebraic torus");

        this.always(() => { this.invalidate(); });

        // ==========================================
        // ANIMATION: Cycle view styles on the GPU
        // ==========================================
        const styles = [
            SurfaceViewStyle.HEATMAP,
            SurfaceViewStyle.CONTOUR,
            SurfaceViewStyle.DEPTH,
            SurfaceViewStyle.SOLID,
            SurfaceViewStyle.WIREFRAME
        ];

        let index = 0;
        while (true) {
            await this.play(new Waiting({ duration: 3000 }));
            index = (index + 1) % styles.length;
            implicitSurface.applyViewStyle(styles[index]);
        }
    }
}
