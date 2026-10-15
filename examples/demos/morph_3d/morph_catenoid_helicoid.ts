import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphCatenoidHelicoidDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 8, 28]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Isometric Catenoid-Helicoid Homotopy", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.8
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("Surface: Helicoid  |  alpha = 0 (Minimal Surface)", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.4
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridRes = 64;
        const scale = 2.6;

        // Bonnet Associate Family of Minimal Surfaces:
        // x(u, v, alpha) = scale * (cos(alpha)*sinh(u)*sin(v) + sin(alpha)*cosh(u)*cos(v))
        // y(u, v, alpha) = scale * (cos(alpha)*(-sinh(u)*cos(v)) + sin(alpha)*cosh(u)*sin(v))
        // z(u, v, alpha) = scale * (u*sin(alpha) + v*cos(alpha))
        // All surfaces in this family have identical first fundamental form (zero metric distortion)
        const createMinimalSurface = (alpha: number, colorHex: string, label: string) => {
            const posFunc = (uNorm: number, vNorm: number): Vec3 => {
                const u = (uNorm - 0.5) * 2.6; // [-1.3, 1.3]
                const v = (vNorm - 0.5) * Math.PI * 2; // [-pi, pi]

                const cosA = Math.cos(alpha);
                const sinA = Math.sin(alpha);

                const sinhU = Math.sinh(u);
                const coshU = Math.cosh(u);
                const sinV = Math.sin(v);
                const cosV = Math.cos(v);

                const x = scale * (cosA * sinhU * sinV + sinA * coshU * cosV);
                const y = scale * (-cosA * sinhU * cosV + sinA * coshU * sinV);
                const z = scale * (u * sinA + v * cosA);

                // Rotate slightly so vertical axis aligns with Y
                return new Vec3(x, z, y);
            };

            return new ParametricModel(posFunc, {
                uSegments: gridRes,
                vSegments: gridRes,
                color: Color.fromHex(colorHex),
                label
            });
        };

        // 1. Helicoid (alpha = 0)
        const helicoid = createMinimalSurface(0, "#29ABCA", "Helicoid");
        this.add(helicoid);

        // 2. Intermediate Minimal Surface (alpha = pi/4)
        const intermediate1 = createMinimalSurface(Math.PI / 4, "#5CD0B3", "Intermediate-1");

        // 3. Catenoid (alpha = pi/2)
        const catenoid = createMinimalSurface(Math.PI / 2, "#F4D03F", "Catenoid");

        // 4. Intermediate Minimal Surface (alpha = 3pi/4)
        const intermediate2 = createMinimalSurface((3 * Math.PI) / 4, "#E06868", "Intermediate-2");

        // 5. Conjugate Helicoid (alpha = pi)
        const conjHelicoid = createMinimalSurface(Math.PI, "#9A72DE", "Conjugate Helicoid");

        const stages = [
            { from: helicoid, to: intermediate1, text: "Bending without stretching...  |  alpha = pi/4", color: "#5CD0B3" },
            { from: intermediate1, to: catenoid, text: "Surface: Catenoid (Hourglass)  |  alpha = pi/2", color: "#F4D03F" },
            { from: catenoid, to: intermediate2, text: "Unrolling to conjugate helicoid...  |  alpha = 3pi/4", color: "#E06868" },
            { from: intermediate2, to: conjHelicoid, text: "Surface: Conjugate Helicoid  |  alpha = pi", color: "#9A72DE" },
            { from: conjHelicoid, to: intermediate2, text: "Reversing deformation...  |  alpha = 3pi/4", color: "#E06868" },
            { from: intermediate2, to: catenoid, text: "Surface: Catenoid (Hourglass)  |  alpha = pi/2", color: "#F4D03F" },
            { from: catenoid, to: intermediate1, text: "Rolling into spiral ramp...  |  alpha = pi/4", color: "#5CD0B3" },
            { from: intermediate1, to: helicoid, text: "Surface: Helicoid (Spiral Ramp)  |  alpha = 0", color: "#29ABCA" },
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
