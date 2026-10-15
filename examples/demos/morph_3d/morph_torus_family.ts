import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphTorusFamilyDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 9, 28]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Torus Aperture Homotopy (Genus-1 to Genus-0)", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.6
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("Topology: Ring Torus (R > r)  |  Void Open", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.4
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridRes = 64;

        // Torus family parameterized by major radius R and minor radius r:
        // x = (R + r * cos(φ)) * cos(θ)
        // y = r * sin(φ)
        // z = (R + r * cos(φ)) * sin(θ)
        const createTorus = (R: number, r: number, colorHex: string, label: string) => {
            const posFunc = (u: number, v: number): Vec3 => {
                const theta = u * Math.PI * 2;
                const phi = (v - 0.5) * Math.PI * 2;
                return new Vec3(
                    (R + r * Math.cos(phi)) * Math.cos(theta),
                    r * Math.sin(phi),
                    (R + r * Math.cos(phi)) * Math.sin(theta)
                );
            };

            const normalFunc = (u: number, v: number): Vec3 => {
                const theta = u * Math.PI * 2;
                const phi = (v - 0.5) * Math.PI * 2;
                return new Vec3(
                    Math.cos(phi) * Math.cos(theta),
                    Math.sin(phi),
                    Math.cos(phi) * Math.sin(theta)
                );
            };

            return new ParametricModel(posFunc, {
                uSegments: gridRes,
                vSegments: gridRes,
                normalFunc,
                color: Color.fromHex(colorHex),
                label
            });
        };

        // 1. Ring Torus: R = 6.2, r = 2.4 (Open hole)
        const ringTorus = createTorus(6.2, 2.4, "#29ABCA", "Ring Torus");
        this.add(ringTorus);

        // 2. Horn Torus: R = 3.6, r = 3.6 (Hole pinches to a single singular point)
        const hornTorus = createTorus(3.6, 3.6, "#5CD0B3", "Horn Torus");

        // 3. Spindle Torus / Apple: R = 1.6, r = 4.8 (Dimpled apple with internal spindle)
        const spindleTorus = createTorus(1.6, 4.8, "#F4D03F", "Spindle Torus");

        // 4. Degenerate Limit (Near Sphere): R = 0.05, r = 5.6 (Hole fully closed)
        const sphereTorus = createTorus(0.05, 5.6, "#E06868", "Degenerate Sphere");

        const stages = [
            { from: ringTorus, to: hornTorus, text: "Topology: Horn Torus (R = r)  |  Hole Pinches Shut", color: "#5CD0B3" },
            { from: hornTorus, to: spindleTorus, text: "Topology: Spindle Torus (R < r)  |  Dimpled Apple", color: "#F4D03F" },
            { from: spindleTorus, to: sphereTorus, text: "Topology: Degenerate Limit (R -> 0)  |  Sphere Formed", color: "#E06868" },
            { from: sphereTorus, to: spindleTorus, text: "Expanding Spindle Core (R = 1.6, r = 4.8)", color: "#F4D03F" },
            { from: spindleTorus, to: hornTorus, text: "Opening Focal Singularity (R = 3.6, r = 3.6)", color: "#5CD0B3" },
            { from: hornTorus, to: ringTorus, text: "Topology: Ring Torus (R > r)  |  Void Open", color: "#29ABCA" },
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
