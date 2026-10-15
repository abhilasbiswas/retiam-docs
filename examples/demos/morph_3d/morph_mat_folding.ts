import { CENTER, Color, Morph, MorphMode, OrbitCameraController, ParametricModel, Rate, Scene, SDFText, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MorphMatFoldingDemo extends Scene {
    public async run() {
        this.camera.position.set([11, 13, 19]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 1.5, 0), radius: 20 });
        this.clearColor(demoBackground());

        // UI Header
        const title = new SDFText("3D Sheet & Mat Folding Kinematics", {
            anchor: CENTER,
            position: [0, 42, 0],
            fontSize: 5.6
        });
        title.paint.fill = new Color(0.95, 0.95, 1.0, 1.0);
        this.add(title);
        title.setAsUI();

        const badge = new SDFText("State 1: Flat Extended Sheet  |  Unfolded Planar Mat", {
            anchor: CENTER,
            position: [0, 37, 0],
            fontSize: 4.0
        });
        badge.paint.fill = Color.fromHex("#29ABCA");
        this.add(badge);
        badge.setAsUI();

        const gridResU = 80;
        const gridResV = 36;
        const L = 14.0; // Mat length (along U)
        const W = 7.0;  // Mat width (along V)

        // -------------------------------------------------------------
        // State 1: Flat Unfolded Mat resting on the floor
        // -------------------------------------------------------------
        const flatMatFunc = (u: number, v: number): Vec3 => {
            const x = (u - 0.5) * L;
            const y = 0.0;
            const z = (v - 0.5) * W;
            return new Vec3(x, y, z);
        };

        const flatMat = new ParametricModel(flatMatFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#29ABCA"),
            label: "Flat Mat"
        });
        this.add(flatMat);

        // -------------------------------------------------------------
        // State 2: Accordion / Z-Pleated Origami Fold (Map Fold)
        // -------------------------------------------------------------
        const accordionFunc = (u: number, v: number): Vec3 => {
            const z = (v - 0.5) * W;
            const pleats = 4.5;
            const compress = 0.32; // Horizontal compression factor
            const x = (u - 0.5) * L * compress;
            // Rounded triangular pleats
            const wave = Math.sin(u * pleats * Math.PI * 2);
            const y = Math.sign(wave) * Math.pow(Math.abs(wave), 0.75) * 2.2 + 2.2;
            return new Vec3(x, y, z);
        };

        const accordionMat = new ParametricModel(accordionFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#5CD0B3"),
            label: "Accordion Fold"
        });

        // -------------------------------------------------------------
        // State 3: 180° Transverse Book / Flap Fold
        // Right half lifts and folds flat over the left half
        // -------------------------------------------------------------
        const bookFoldFunc = (u: number, v: number): Vec3 => {
            const z = (v - 0.5) * W;
            const hinge = 0.5;
            const Rh = 0.55;
            const arcLen = Math.PI * Rh;

            if (u <= hinge) {
                const x = (u - hinge) * L;
                return new Vec3(x, 0.0, z);
            } else {
                const s = (u - hinge) * L;
                if (s < arcLen) {
                    const phi = s / Rh; // 0 to pi
                    const x = Rh * Math.sin(phi);
                    const y = Rh * (1.0 - Math.cos(phi));
                    return new Vec3(x, y, z);
                } else {
                    const rem = s - arcLen;
                    const x = -rem;
                    const y = 2.0 * Rh;
                    return new Vec3(x, y, z);
                }
            }
        };

        const bookFoldMat = new ParametricModel(bookFoldFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#F4D03F"),
            label: "Book Fold"
        });

        // -------------------------------------------------------------
        // State 4: Archimedean Spiral Roll-Up (Yoga Mat / Cylinder Scroll)
        // Rolled smoothly from the right edge into a compact spiral
        // -------------------------------------------------------------
        const spiralRollFunc = (u: number, v: number): Vec3 => {
            const z = (v - 0.5) * W;
            const flatRatio = 0.25;
            const rollStartX = (flatRatio - 0.5) * L;

            if (u <= flatRatio) {
                const x = (u - 0.5) * L;
                return new Vec3(x, 0.0, z);
            } else {
                const s = (u - flatRatio) * L;
                const R0 = 0.65;
                const c = 0.065;
                // Solve: 0.5*c*theta^2 + R0*theta - s = 0
                const theta = (-R0 + Math.sqrt(R0 * R0 + 2.0 * c * s)) / c;
                const R = R0 + c * theta;
                const x = rollStartX + R * Math.sin(theta);
                const y = R * (1.0 - Math.cos(theta));
                return new Vec3(x, y, z);
            }
        };

        const spiralRollMat = new ParametricModel(spiralRollFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#9A72DE"),
            label: "Spiral Roll"
        });

        // -------------------------------------------------------------
        // State 5: Double Scroll (Papyrus Scroll Rolled from Both Ends)
        // -------------------------------------------------------------
        const doubleScrollFunc = (u: number, v: number): Vec3 => {
            const z = (v - 0.5) * W;
            const R0 = 0.5;
            const c = 0.055;

            if (u >= 0.42 && u <= 0.58) {
                // Flat center bridge
                const x = (u - 0.5) * L;
                return new Vec3(x, 0.0, z);
            } else if (u < 0.42) {
                // Left inward roll
                const s = (0.42 - u) * L;
                const theta = (-R0 + Math.sqrt(R0 * R0 + 2.0 * c * s)) / c;
                const R = R0 + c * theta;
                const bridgeX = (0.42 - 0.5) * L;
                const x = bridgeX - R * Math.sin(theta);
                const y = R * (1.0 - Math.cos(theta));
                return new Vec3(x, y, z);
            } else {
                // Right inward roll
                const s = (u - 0.58) * L;
                const theta = (-R0 + Math.sqrt(R0 * R0 + 2.0 * c * s)) / c;
                const R = R0 + c * theta;
                const bridgeX = (0.58 - 0.5) * L;
                const x = bridgeX + R * Math.sin(theta);
                const y = R * (1.0 - Math.cos(theta));
                return new Vec3(x, y, z);
            }
        };

        const doubleScrollMat = new ParametricModel(doubleScrollFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#E06868"),
            label: "Double Scroll"
        });

        // -------------------------------------------------------------
        // State 6: Smooth Traveling Drape Wave
        // -------------------------------------------------------------
        const waveDrapeFunc = (u: number, v: number): Vec3 => {
            const x = (u - 0.5) * L * 0.92;
            const wave = Math.sin(u * Math.PI * 3.0) * 1.6;
            const z = (v - 0.5) * W;
            return new Vec3(x, wave + 1.6, z);
        };

        const waveDrapeMat = new ParametricModel(waveDrapeFunc, {
            uSegments: gridResU,
            vSegments: gridResV,
            color: Color.fromHex("#FF8C42"),
            label: "Wave Drape"
        });

        // -------------------------------------------------------------
        // Transformation Stages Sequence
        // -------------------------------------------------------------
        const stages = [
            { from: flatMat, to: waveDrapeMat, text: "State 2: Wave Undulation  |  Flexible Drape Dynamic", color: "#FF8C42" },
            { from: waveDrapeMat, to: accordionMat, text: "State 3: Accordion Pleated Fold  |  Multi-Crease Z-Compression", color: "#5CD0B3" },
            { from: accordionMat, to: bookFoldMat, text: "State 4: Transverse Half-Fold  |  180° Hinge Flap Closure", color: "#F4D03F" },
            { from: bookFoldMat, to: spiralRollMat, text: "State 5: Spiral Roll-Up  |  Archimedean Scroll Cylinder", color: "#9A72DE" },
            { from: spiralRollMat, to: doubleScrollMat, text: "State 6: Double Scroll  |  Dual Papyrus Rolls", color: "#E06868" },
            { from: doubleScrollMat, to: flatMat, text: "State 1: Flat Extended Sheet  |  Unfolded Planar Mat", color: "#29ABCA" },
        ];

        await this.wait(1500);

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
