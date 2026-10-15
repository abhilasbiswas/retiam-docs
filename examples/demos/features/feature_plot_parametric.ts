import { Scene, CameraController, Color, ThreeDAxes, Vec3, SurfaceViewStyle, Waiting, OrbitCameraController, ParametricColorMode } from "retiam";
import { ParametricCurve3D } from "retiam";
import { ParametricSurface3D } from "retiam";
import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";

export default class ParametricScene extends Scene {
    public async run() {
        // 1. Setup Camera & Presentation Backdrop
        this.camera.position.set([0, 0, 20]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. Setup 3D Coordinate Grid
        const axes3D = new ThreeDAxes({
            xRange: [-5, 5, 2],
            yRange: [-5, 5, 2],
            zRange: [-5, 5.1, 2],
            showGrid: true
        });
        axes3D.transform.position = new Vec3(0, -2, 0);
        axes3D.transform.setRotationX(Math.PI / 7.8); // Tilted presentation angle
        this.add(axes3D);

        // ==========================================
        // 3D Parametric Curve (Spiraling Helix)
        // ==========================================
        const helixFunc = (t: number) => {
            const radius = 3.5;
            const heightFactor = 0.95;
            return new Vec3(
                Math.cos(t) * radius,
                t * heightFactor - 2.5, // Center Y vertically
                Math.sin(t) * radius
            );
        };

        // Custom Neon/Glowing Path Effect Shader
        const neonGlow = `
            fn pathEffect(t: f32, total_arc_len: f32, w: f32, col: vec4f) -> vec4f {
                // Taper the head and tail smoothly
                let core = 0.55;
                let falloff = smoothstep(1.0, core, abs(w));

                // Color transition along curve (Green to Teal)
                let c = mix(vec3f(0.0, 1.0, 0.5), vec3f(0.0, 0.6, 1.0), t);
                return vec4f(c, col.a * falloff);
            }
        `;

        const curve = new ParametricCurve3D(helixFunc, {
            tRange: [0, Math.PI * 8.0], // 4 full turns
            samples: 250.0,
            strokeWidth: 0.15,
            pathEffect: neonGlow
        });
        axes3D.add(curve);

        // ==========================================
        // 3D Parametric Surface (Torus Manifold)
        // ==========================================
        const R = 3.0; // Major radius
        const r = 1.0; // Minor radius (tube)

        const torusFunc = (u: number, v: number) => {
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const z = (R + r * Math.cos(v)) * Math.sin(u);
            const y = r * Math.sin(v);
            return new Vec3(x, y, z);
        };

        const torus = new ParametricSurface3D(torusFunc, {
            uRange: [0, Math.PI * 2],
            vRange: [0, Math.PI * 2],
            uSegments: 80,
            vSegments: 40,
            viewStyle: SurfaceViewStyle.HEATMAP,
            colorMode: ParametricColorMode.U_COORDINATE // Color mapping along major rotation
        });

        // Offset the torus slightly to the side to showcase beside the helix
        torus.transform.position = new Vec3(0, 1.5, 0);
        axes3D.add(torus);
        frameContent(this, axes3D, 0.35);
        demoCaption(this, "Parametric geometry", "A helix and torus with changing surface treatments");

        // Force continuous redraw for tracking
        this.always(() => { this.invalidate(); });

        // ==========================================
        // ANIMATION: Cycle Color Modes and View Styles
        // ==========================================
        while (true) {
            // Cycle 1: Color by U (major rotation)
            torus.applyColorMode(ParametricColorMode.U_COORDINATE);
            torus.applyViewStyle(SurfaceViewStyle.HEATMAP);
            await this.play(new Waiting({ duration: 3000 }));

            // Cycle 2: Color by V (tube rotation)
            torus.applyColorMode(ParametricColorMode.V_COORDINATE);
            await this.play(new Waiting({ duration: 3000 }));

            // Cycle 3: Switch to Contour View Style
            torus.applyViewStyle(SurfaceViewStyle.CONTOUR);
            await this.play(new Waiting({ duration: 3000 }));

            // Cycle 4: Switch to wireframe
            torus.applyViewStyle(SurfaceViewStyle.WIREFRAME);
            await this.play(new Waiting({ duration: 3000 }));
        }
    }
}
