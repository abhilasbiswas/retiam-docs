import { demoBackground } from "../../shared/presentation";
import { CameraController, Color, Create3D, Math3D, MathShape3D, OrbitCameraController, Scene, ThreeDAxes, Vec3 } from "retiam";

export default class AestheticMath3DScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Orbit Camera Setup
        this.camera.position.set([0, 15, 10]);
        this.camera.pitch = -0.4;
        new OrbitCameraController(this, this.camera, { radius: 15 });

        // 2. Generate a complex 3D Parametric Math Surface (Saddle)
        const segments = 20;
        const positions: number[] = [];
        const indices: number[] = [];

        for (let i = 0; i <= segments; i++) {
            const u = -3 + (i / segments) * 6; // X bounds
            for (let j = 0; j <= segments; j++) {
                const v = -3 + (j / segments) * 6; // Z bounds

                // Math function: z = x^2 - y^2 (Saddle)
                const y = (u * u - v * v) * 0.3;
                positions.push(u, y, v);
            }
        }

        // Generate grid faces
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = i * (segments + 1) + j + 1;
                const c = (i + 1) * (segments + 1) + j + 1;
                const d = (i + 1) * (segments + 1) + j;

                indices.push(a, d, b);
                indices.push(b, d, c);
            }
        }

        // Convert to GPU Mesh
        const mathMesh = Math3D.computeSmoothShading(
            new Float32Array(positions),
            new Uint32Array(indices)
        );

        // 3. Wrap in MathShape3D (Automatically extracts wireframes!)
        const saddleShape = new MathShape3D(mathMesh, {
            fill: new Color(0.8, 0.1, 0.5, 1.0), // Magenta Glass
            stroke: new Color(1.0, 1.0, 1.0, 0.5), // White grid lines
            strokeWidth: 0.02,
            fillOpacity: 0.5,
            transmission: 0.1, // Super glassy!
            roughness: 0.5
        });

        // Make it spin slowly
        this.always(() => {
            saddleShape.transform.rotateWorldY(this.dt * 0.0003);
            this.invalidate();
        });

        // 4. Trigger the Beautiful 3D Creation Animation!
        await this.wait(500); // Breathe before start

        await this.play(new Create3D(saddleShape, {
            wireframeDuration: 2500, // Grid takes 2.5s to draw
            surfaceDuration: 1500,   // Glass takes 1.5s to fade in afterward
            // staggerLines: 1         // Milliseconds between each grid line shooting out
        }));

        await this.wait(2000);
    }
}
