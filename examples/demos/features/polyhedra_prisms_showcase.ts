import { CENTER, Color, MathShape3D, OrbitCameraController, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class PolyhedraPrismsShowcase extends Scene {
    public async run() {
        this.camera.position.set([0, 1, 26]);
        new OrbitCameraController(this, this.camera, { radius: 22 });
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Geometric Polyhedra & Prisms Showcase", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.6
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const subtitle = new SDFText("Cube  •  Tetrahedron  •  Triangular Prism  •  Octahedron  •  Hexagonal Prism", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 3.8
        });
        subtitle.paint.fill = Color.fromHex("#5CD0B3");
        this.add(subtitle);
        subtitle.setAsUI();

        // 1. Cubic Shape (Cube / Hexahedron) - Manim Blue
        const cube = MathShape3D.Box(3.0, 3.0, 3.0, {
            fill: Color.fromHex("#29ABCA"),
            stroke: new Color(0.6, 0.9, 1.0, 1.0),
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.12
        });
        cube.transform.position = new Vec3(-9.6, 0, 0);
        this.add(cube);

        // 2. Regular Tetrahedron - Manim Gold
        const tetrahedron = MathShape3D.Tetrahedron(2.7, {
            fill: Color.fromHex("#F4D03F"),
            stroke: new Color(1.0, 0.95, 0.6, 1.0),
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.12
        });
        tetrahedron.transform.position = new Vec3(-4.8, 0, 0);
        this.add(tetrahedron);

        // 3. Regular Triangular Prism - Manim Teal
        const triPrism = MathShape3D.Prism(3, 2.3, 3.4, {
            fill: Color.fromHex("#5CD0B3"),
            stroke: new Color(0.7, 1.0, 0.9, 1.0),
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.12
        });
        triPrism.transform.position = new Vec3(0, 0, 0);
        this.add(triPrism);

        // 4. Regular Octahedron - Manim Coral
        const octahedron = MathShape3D.Octahedron(2.6, {
            fill: Color.fromHex("#E06868"),
            stroke: new Color(1.0, 0.8, 0.8, 1.0),
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.12
        });
        octahedron.transform.position = new Vec3(4.8, 0, 0);
        this.add(octahedron);

        // 5. Hexagonal Prism - Manim Purple
        const hexPrism = MathShape3D.Prism(6, 2.3, 3.4, {
            fill: Color.fromHex("#9A72DE"),
            stroke: new Color(0.9, 0.75, 1.0, 1.0),
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.12
        });
        hexPrism.transform.position = new Vec3(9.6, 0, 0);
        this.add(hexPrism);

        const shapes = [
            { entity: cube, baseY: 0, speedY: 0.0007, speedX: 0.0003, phase: 0 },
            { entity: tetrahedron, baseY: 0, speedY: -0.0006, speedX: 0.0004, phase: 1.2 },
            { entity: triPrism, baseY: 0, speedY: 0.0008, speedX: 0.0002, phase: 2.4 },
            { entity: octahedron, baseY: 0, speedY: -0.0007, speedX: 0.0003, phase: 3.6 },
            { entity: hexPrism, baseY: 0, speedY: 0.0006, speedX: 0.0004, phase: 4.8 },
        ];

        let elapsed = 0;

        // Smooth continuous 3D rotation & hover
        this.always(() => {
            elapsed += this.dt * 0.001;

            for (const item of shapes) {
                item.entity.transform.rotateWorldY(this.dt * item.speedY);
                item.entity.transform.rotateWorldX(this.dt * item.speedX);
                item.entity.transform.position.y = item.baseY + Math.sin(elapsed * 1.5 + item.phase) * 0.28;
            }

            this.invalidate();
        });
    }
}
