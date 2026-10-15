import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphSuperquadricDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 8, 28]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Superquadric Metamorphosis", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 6.2
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("Shape: Sphere  |  e1 = 1.0, e2 = 1.0", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.6
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridRes = 64;
        const R = 6.8;

        // Superquadric auxiliary functions (Barr's Superellipsoid Formulation)
        const c = (t: number, e: number): number => {
            const cosVal = Math.cos(t);
            return Math.sign(cosVal) * Math.pow(Math.abs(cosVal), e);
        };
        const s = (t: number, e: number): number => {
            const sinVal = Math.sin(t);
            return Math.sign(sinVal) * Math.pow(Math.abs(sinVal), e);
        };

        const createSuperquadric = (e1: number, e2: number, colorHex: string, label: string) => {
            const posFunc = (u: number, v: number): Vec3 => {
                const theta = (u - 0.5) * Math.PI * 2; // [-π, π]
                const phi = (v - 0.5) * Math.PI;       // [-π/2, π/2]
                return new Vec3(
                    R * c(phi, e1) * c(theta, e2),
                    R * s(phi, e1),
                    R * c(phi, e1) * s(theta, e2)
                );
            };

            const normalFunc = (u: number, v: number): Vec3 => {
                const theta = (u - 0.5) * Math.PI * 2;
                const phi = (v - 0.5) * Math.PI;
                const nx = c(phi, 2 - e1) * c(theta, 2 - e2);
                const ny = s(phi, 2 - e1);
                const nz = c(phi, 2 - e1) * s(theta, 2 - e2);
                const len = Math.hypot(nx, ny, nz);
                return len > 1e-6 ? new Vec3(nx / len, ny / len, nz / len) : new Vec3(0, 1, 0);
            };

            return new ParametricModel(posFunc, {
                uSegments: gridRes,
                vSegments: gridRes,
                normalFunc,
                color: Color.fromHex(colorHex),
                label
            });
        };

        // 1. Sphere: e1 = 1.0, e2 = 1.0 (Manim Blue)
        const sphere = createSuperquadric(1.0, 1.0, "#29ABCA", "Sphere");
        this.add(sphere);

        // 2. Rounded Cube: e1 = 0.2, e2 = 0.2 (Manim Gold)
        const cube = createSuperquadric(0.2, 0.2, "#F4D03F", "Supercube");

        // 3. Cylinder: e1 = 0.2, e2 = 1.0 (Manim Teal)
        const cylinder = createSuperquadric(0.2, 1.0, "#5CD0B3", "Cylinder");

        // 4. Diamond / Octahedral Astroid: e1 = 2.0, e2 = 2.0 (Manim Coral)
        const diamond = createSuperquadric(2.0, 2.0, "#E06868", "Diamond Star");

        // 5. Cushion / Pillow: e1 = 1.0, e2 = 0.2 (Manim Purple)
        const pillow = createSuperquadric(1.0, 0.2, "#9A72DE", "Pillow");

        // Shape stages definition
        const stages = [
            { from: sphere, to: cube, text: "Shape: Supercube  |  e1 = 0.2, e2 = 0.2", color: "#F4D03F" },
            { from: cube, to: cylinder, text: "Shape: Cylinder  |  e1 = 0.2, e2 = 1.0", color: "#5CD0B3" },
            { from: diamond, to: pillow, text: "Shape: Pillow  |  e1 = 1.0, e2 = 0.2", color: "#9A72DE" },
            { from: cylinder, to: diamond, text: "Shape: Diamond Star  |  e1 = 2.0, e2 = 2.0", color: "#E06868" },
            { from: pillow, to: sphere, text: "Shape: Sphere  |  e1 = 1.0, e2 = 1.0", color: "#29ABCA" },
        ];

        await this.wait(1000);

        while (true) {
            for (const stage of stages) {
                badge.setText(stage.text);
                badge.paint.fill = Color.fromHex(stage.color);

                await this.play(Morph(stage.from, stage.to, {
                    mode: MorphMode.NAIVE,
                    duration: 2500,
                    rate_func: Rate.easeInOutCubic()
                }));

                await this.wait(1200);
            }
        }
    }
}
