import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphMobiusDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 10, 26]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Ribbon Twist Homotopy & Mobius Strip", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.6
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("Topology: Cylindrical Band  |  N = 0 Twists (Orientable)", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.4
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridRes = 72;
        const R = 7.0;
        const width = 2.8;

        // Parametric N-half-twist ribbon band:
        // x(u, v) = (R + t * cos(N * θ / 2)) * cos(θ)
        // y(u, v) = t * sin(N * θ / 2)
        // z(u, v) = (R + t * cos(N * θ / 2)) * sin(θ)
        // where θ = u * 2π, t = (v - 0.5) * width
        const createRibbon = (N: number, colorHex: string, label: string) => {
            const posFunc = (u: number, v: number): Vec3 => {
                const theta = u * Math.PI * 2;
                const t = (v - 0.5) * width;
                const twist = (N * theta) / 2;

                const rEffective = R + t * Math.cos(twist);
                return new Vec3(
                    rEffective * Math.cos(theta),
                    t * Math.sin(twist),
                    rEffective * Math.sin(theta)
                );
            };

            return new ParametricModel(posFunc, {
                uSegments: gridRes,
                vSegments: 24,
                color: Color.fromHex(colorHex),
                label
            });
        };

        // 1. Untwisted Cylindrical Band (N = 0, Manim Blue)
        const band = createRibbon(0, "#29ABCA", "Cylindrical Band");
        this.add(band);

        // 2. Mobius Strip (N = 1, Manim Gold) - Classic non-orientable surface
        const mobius = createRibbon(1, "#F4D03F", "Mobius Strip");

        // 3. Full-Twist Ribbon (N = 2, Manim Teal) - Orientable 360° twist
        const fullTwist = createRibbon(2, "#5CD0B3", "Full-Twist Ribbon");

        // 4. Trefoil Strip (N = 3, Manim Coral) - 540° chiral twist
        const trefoil = createRibbon(3, "#E06868", "Trefoil Strip");

        const stages = [
            { from: band, to: mobius, text: "Topology: Mobius Strip  |  N = 1 Half-Twist (Non-Orientable)", color: "#F4D03F" },
            { from: mobius, to: fullTwist, text: "Topology: Full-Twist Ribbon  |  N = 2 Half-Twists (Orientable)", color: "#5CD0B3" },
            { from: fullTwist, to: trefoil, text: "Topology: Trefoil Ribbon  |  N = 3 Half-Twists (Chiral)", color: "#E06868" },
            { from: trefoil, to: fullTwist, text: "Untwisting: N = 2 Half-Twists", color: "#5CD0B3" },
            { from: fullTwist, to: mobius, text: "Topology: Mobius Strip  |  N = 1 Half-Twist", color: "#F4D03F" },
            { from: mobius, to: band, text: "Topology: Cylindrical Band  |  N = 0 Twists (Orientable)", color: "#29ABCA" },
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
