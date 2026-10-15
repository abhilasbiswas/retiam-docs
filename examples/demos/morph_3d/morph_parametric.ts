import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphParametricDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 8, 30]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI
        const title = new SDFText("Manim-Style Parametric Morph", { anchor: CENTER, position: [0, 40, 0] });
        title.paint.fill = new Color(1.0, 0.4, 0.6, 1.0);
        this.add(title);
        title.setAsUI();


        // Grid resolution for smooth mathematical surfaces
        const gridRes = 60;

        // Shape 1: Parametric Sphere (Classic Manim Blue #29ABCA)
        // Parameterized as surface of revolution: u = azimuth [0, 2π], v = latitude [-π/2, π/2]
        const sphereFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const phi = (v - 0.5) * Math.PI;
            const radius = 7.0;
            return new Vec3(
                radius * Math.cos(phi) * Math.cos(theta),
                radius * Math.sin(phi),
                radius * Math.cos(phi) * Math.sin(theta)
            );
        };
        const sphereNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const phi = (v - 0.5) * Math.PI;
            return new Vec3(
                Math.cos(phi) * Math.cos(theta),
                Math.sin(phi),
                Math.cos(phi) * Math.sin(theta)
            );
        };

        const sphere = new ParametricModel(sphereFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: sphereNormal,
            color: Color.fromHex("#29ABCA")
        });
        this.add(sphere);

        // Shape 2: Parametric Cylinder (Manim Green #83C167)
        // Co-axial surface of revolution: u = azimuth [0, 2π], v = height [-H/2, H/2]
        const cylFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const radius = 5.5;
            const height = 14.0;
            const y = (v - 0.5) * height;
            return new Vec3(
                radius * Math.cos(theta),
                y,
                radius * Math.sin(theta)
            );
        };
        const cylNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            return new Vec3(Math.cos(theta), 0, Math.sin(theta));
        };

        const cylinder = new ParametricModel(cylFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: cylNormal,
            color: Color.fromHex("#83C167")
        });

        // Shape 3: Parametric Torus (Manim Red #E06868)
        // Co-axial surface of revolution: u = azimuth [0, 2π], v = tube circle [-π, π]
        const torusFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const phi = (v - 0.5) * Math.PI * 2;
            const R = 6.0;
            const r = 2.5;
            return new Vec3(
                (R + r * Math.cos(phi)) * Math.cos(theta),
                r * Math.sin(phi),
                (R + r * Math.cos(phi)) * Math.sin(theta)
            );
        };
        const torusNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const phi = (v - 0.5) * Math.PI * 2;
            return new Vec3(
                Math.cos(phi) * Math.cos(theta),
                Math.sin(phi),
                Math.cos(phi) * Math.sin(theta)
            );
        };

        const torus = new ParametricModel(torusFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: torusNormal,
            color: Color.fromHex("#E06868")
        });

        // Wait before animation starts
        await this.wait(1000);

        // Continuous Animation Loop: Sphere -> Cylinder -> Torus -> Sphere
        while (true) {
            // Morph Sphere -> Cylinder
            await this.play(Morph(sphere, cylinder, {
                mode: MorphMode.NAIVE,
                duration: 2500,
                rate_func: Rate.easeInOutCubic()
            }));

            await this.wait(1000);

            // Morph Cylinder -> Torus
            await this.play(Morph(cylinder, torus, {
                mode: MorphMode.NAIVE,
                duration: 2500,
                rate_func: Rate.easeInOutCubic()
            }));

            await this.wait(1000);

            // Morph Torus -> Sphere
            await this.play(Morph(torus, sphere, {
                mode: MorphMode.NAIVE,
                duration: 2500,
                rate_func: Rate.easeInOutCubic()
            }));

            await this.wait(1000);
        }
    }
}
