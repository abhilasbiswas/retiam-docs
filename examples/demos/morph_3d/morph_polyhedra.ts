import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphPolyhedraDemo extends Scene {
    public async run() {
        this.camera.position.set([8, 9, 15]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("Polyhedra & Prisms Metamorphosis", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.8
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("Shape: Cube (Hexahedron)  |  6 Faces, 8 Vertices", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.4
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridRes = 72;

        /**
         * Calculates exact inradius-to-perimeter distance for any regular N-gon.
         * By aligning face centers with coordinate axes, edges follow exact grid lines without sawtooth artifacts.
         */
        const getPolyRadius = (theta: number, N: number, inradius: number): number => {
            const delta = (Math.PI * 2) / N;
            const mod = (((theta + delta * 0.5) % delta) + delta) % delta;
            const rel = mod - delta * 0.5;
            return inradius / Math.max(Math.cos(rel), 1e-4);
        };

        const getFaceNormal = (theta: number, N: number): Vec3 => {
            const delta = (Math.PI * 2) / N;
            const k = Math.round(theta / delta);
            const faceAngle = k * delta;
            return new Vec3(Math.cos(faceAngle), 0, Math.sin(faceAngle));
        };

        // 1. Regular Cube (N = 4, Height = 7.0, Inradius = 3.5)
        const sCube = 3.5;
        const hCube = 7.0;
        const cubeFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const rPoly = getPolyRadius(theta, 4, sCube);

            if (v < 0.25) {
                // Bottom Cap (Flat horizontal square face)
                const t = v / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), -sCube, r * Math.sin(theta));
            } else if (v <= 0.75) {
                // 4 Vertical Planar Square Faces
                const t = (v - 0.25) / 0.5;
                const y = -sCube + t * hCube;
                return new Vec3(rPoly * Math.cos(theta), y, rPoly * Math.sin(theta));
            } else {
                // Top Cap (Flat horizontal square face)
                const t = (1.0 - v) / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), sCube, r * Math.sin(theta));
            }
        };

        const cubeNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            if (v < 0.25) return new Vec3(0, -1, 0);
            if (v > 0.75) return new Vec3(0, 1, 0);
            return getFaceNormal(theta, 4);
        };

        const cube = new ParametricModel(cubeFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: cubeNormal,
            color: Color.fromHex("#29ABCA"),
            label: "Cube"
        });
        this.add(cube);

        // 2. Regular Tetrahedron (N = 3, triangular base + apex)
        const rTet = 4.2;
        const hTet = 7.5;
        const yBaseTet = -hTet / 3;
        const yApexTet = (2 * hTet) / 3;

        const tetFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const rPoly = getPolyRadius(theta, 3, rTet);

            if (v < 0.25) {
                // Bottom Cap (Equilateral triangle base)
                const t = v / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), yBaseTet, r * Math.sin(theta));
            } else {
                // 3 Slanted Triangular Faces tapering to apex
                const t = (v - 0.25) / 0.75;
                const y = yBaseTet + t * (yApexTet - yBaseTet);
                const w = 1.0 - t;
                const r = w * rPoly;
                return new Vec3(r * Math.cos(theta), y, r * Math.sin(theta));
            }
        };

        const tetNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            if (v < 0.25) return new Vec3(0, -1, 0);
            const sideNorm = getFaceNormal(theta, 3);
            return new Vec3(sideNorm.x * 0.8, 0.4, sideNorm.z * 0.8).normalize();
        };

        const tetrahedron = new ParametricModel(tetFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: tetNormal,
            color: Color.fromHex("#F4D03F"),
            label: "Tetrahedron"
        });

        // 3. Regular Triangular Prism (N = 3, Height = 7.0, Inradius = 3.6)
        const rTri = 3.6;
        const hTri = 7.0;
        const halfHTri = hTri * 0.5;

        const triPrismFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const rPoly = getPolyRadius(theta, 3, rTri);

            if (v < 0.25) {
                const t = v / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), -halfHTri, r * Math.sin(theta));
            } else if (v <= 0.75) {
                const t = (v - 0.25) / 0.5;
                const y = -halfHTri + t * hTri;
                return new Vec3(rPoly * Math.cos(theta), y, rPoly * Math.sin(theta));
            } else {
                const t = (1.0 - v) / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), halfHTri, r * Math.sin(theta));
            }
        };

        const triPrismNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            if (v < 0.25) return new Vec3(0, -1, 0);
            if (v > 0.75) return new Vec3(0, 1, 0);
            return getFaceNormal(theta, 3);
        };

        const triPrism = new ParametricModel(triPrismFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: triPrismNormal,
            color: Color.fromHex("#5CD0B3"),
            label: "Triangular Prism"
        });

        // 4. Regular Octahedron (N = 4, Double Pyramid Bipyramid)
        const rOct = 4.8;
        const hOct = 8.5;
        const halfHOct = hOct * 0.5;

        const octFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const rPoly = getPolyRadius(theta, 4, rOct);

            if (v <= 0.5) {
                // Lower 4 Triangular Faces tapering to bottom apex
                const t = v / 0.5;
                const y = -halfHOct + t * halfHOct;
                const w = t;
                const r = w * rPoly;
                return new Vec3(r * Math.cos(theta), y, r * Math.sin(theta));
            } else {
                // Upper 4 Triangular Faces tapering to top apex
                const t = (v - 0.5) / 0.5;
                const y = t * halfHOct;
                const w = 1.0 - t;
                const r = w * rPoly;
                return new Vec3(r * Math.cos(theta), y, r * Math.sin(theta));
            }
        };

        const octNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const sideNorm = getFaceNormal(theta, 4);
            const ny = v <= 0.5 ? -0.55 : 0.55;
            return new Vec3(sideNorm.x * 0.8, ny, sideNorm.z * 0.8).normalize();
        };

        const octahedron = new ParametricModel(octFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: octNormal,
            color: Color.fromHex("#E06868"),
            label: "Octahedron"
        });

        // 5. Regular Hexagonal Prism (N = 6, Height = 7.0, Inradius = 3.6)
        const rHex = 3.6;
        const hHex = 7.0;
        const halfHHex = hHex * 0.5;

        const hexPrismFunc = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            const rPoly = getPolyRadius(theta, 6, rHex);

            if (v < 0.25) {
                const t = v / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), -halfHHex, r * Math.sin(theta));
            } else if (v <= 0.75) {
                const t = (v - 0.25) / 0.5;
                const y = -halfHHex + t * hHex;
                return new Vec3(rPoly * Math.cos(theta), y, rPoly * Math.sin(theta));
            } else {
                const t = (1.0 - v) / 0.25;
                const r = t * rPoly;
                return new Vec3(r * Math.cos(theta), halfHHex, r * Math.sin(theta));
            }
        };

        const hexPrismNormal = (u: number, v: number): Vec3 => {
            const theta = u * Math.PI * 2;
            if (v < 0.25) return new Vec3(0, -1, 0);
            if (v > 0.75) return new Vec3(0, 1, 0);
            return getFaceNormal(theta, 6);
        };

        const hexPrism = new ParametricModel(hexPrismFunc, {
            uSegments: gridRes,
            vSegments: gridRes,
            normalFunc: hexPrismNormal,
            color: Color.fromHex("#9A72DE"),
            label: "Hexagonal Prism"
        });

        // Transformation Stages
        const stages = [
            { from: cube, to: tetrahedron, text: "Platonic Solid: Tetrahedron  |  4 Faces, 4 Vertices", color: "#F4D03F" },
            { from: tetrahedron, to: triPrism, text: "Polyhedron: Triangular Prism  |  5 Faces, 6 Vertices", color: "#5CD0B3" },
            { from: triPrism, to: octahedron, text: "Platonic Solid: Regular Octahedron  |  8 Faces, 6 Vertices", color: "#E06868" },
            { from: octahedron, to: hexPrism, text: "Prism: Hexagonal Prism  |  8 Faces, 12 Vertices", color: "#9A72DE" },
            { from: hexPrism, to: cube, text: "Platonic Solid: Cube (Hexahedron)  |  6 Faces, 8 Vertices", color: "#29ABCA" },
        ];

        await this.wait(4000);

        while (true) {
            for (const stage of stages) {
                badge.setText(stage.text);
                badge.paint.fill = Color.fromHex(stage.color);

                await this.play(Morph(stage.from, stage.to, {
                    mode: MorphMode.NAIVE,
                    duration: 2600,
                    rate_func: Rate.easeInOutCubic()
                }));

                await this.wait(1200);
            }
        }
    }
}
