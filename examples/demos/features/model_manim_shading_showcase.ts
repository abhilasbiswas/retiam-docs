import { Box, CENTER, Color, Cylinder, OrbitCameraController, Scene, SDFText, Sphere, Torus, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ModelManimShadingShowcase extends Scene {
    public async run() {
        this.camera.position.set([0, 8, 22]);
        new OrbitCameraController(this, this.camera, { radius: 20 });
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Model Entity • Optional Manim Shading", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.6
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const subtitle = new SDFText("Box  •  Sphere  •  Cylinder  •  Torus  |  Double-Sided Studio Illumination", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 3.8
        });
        subtitle.paint.fill = Color.fromHex("#5CD0B3");
        this.add(subtitle);
        subtitle.setAsUI();

        const bottomNote = new SDFText("Box (Checkerboard)    •    Sphere (Solid)    •    Cylinder (Dual-Tone)    •    Torus (Ribbon)", {
            anchor: CENTER,
            position: [0, -40, 0],
            fontSize: 3.4
        });
        bottomNote.paint.fill = new Color(0.75, 0.8, 0.9, 1.0);
        this.add(bottomNote);
        bottomNote.setAsUI();

        // 1. Box with Manim Dual-Tone Checkerboard
        const box = new Box(3.0, 3.0, 3.0, {
            shading: "manim",
            color: Color.fromHex("#29ABCA"),
            uSegments: 6,
            vSegments: 6
        });
        box.transform.position = new Vec3(-7.5, 0, 0);
        this.add(box);

        // 2. Sphere with Solid Manim Shading (checkerboard: false)
        const sphere = new Sphere(1.8, {
            widthSegments: 36,
            heightSegments: 36,
            shading: "manim",
            checkerboard: false,
            color: Color.fromHex("#F4D03F")
        });
        sphere.transform.position = new Vec3(-2.5, 0, 0);
        this.add(sphere);

        // 3. Cylinder with Custom Checkerboard Colors
        const cylinder = new Cylinder(1.5, 1.5, 3.4, {
            radialSegments: 32,
            heightSegments: 12,
            openEnded: false,
            shading: "manim",
            checkerboardColors: [Color.fromHex("#5CD0B3"), Color.fromHex("#1F6F5E")],
            uSegments: 16,
            vSegments: 8
        });
        cylinder.transform.position = new Vec3(2.5, 0, 0);
        this.add(cylinder);

        // 4. Torus with Manim Shading (Purple)
        const torus = new Torus(1.6, 0.6, {
            radialSegments: 20,
            tubularSegments: 32,
            shading: "manim",
            color: Color.fromHex("#9A72DE"),
            uSegments: 24,
            vSegments: 12
        });
        torus.transform.position = new Vec3(7.5, 0, 0);
        this.add(torus);

        const models = [
            { entity: box, speedX: 0.0006, speedY: 0.0008, phase: 0 },
            { entity: sphere, speedX: 0.0004, speedY: 0.0006, phase: 1.5 },
            { entity: cylinder, speedX: 0.0005, speedY: 0.0007, phase: 3.0 },
            { entity: torus, speedX: 0.0008, speedY: 0.0005, phase: 4.5 }
        ];

        let elapsed = 0;

        // Continuous 3D rotation and floating hover
        this.always(() => {
            elapsed += this.dt * 0.001;

            for (const item of models) {
                item.entity.transform.rotateWorldY(this.dt * item.speedY);
                item.entity.transform.rotateWorldX(this.dt * item.speedX);
                item.entity.transform.position.y = Math.sin(elapsed * 1.5 + item.phase) * 0.35;
            }

            this.invalidate();
        });
    }
}
