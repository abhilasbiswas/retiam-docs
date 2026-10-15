import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/recreation/deformed_frog.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    NumberPlane,
    PixelGrid,
    HomotopyAnimation,
    Field,
    Vec3,
    Color,
    BLACK,
    Rate
} from "retiam";

export default class DeformedFrogScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground());

        // 1. Setup Camera
        this.camera.position.set([0, 0, 10]);
        new Camera2DController(this, this.camera, { zoom: 10 });
        frameStage(this, 14, 11);
        demoCaption(this, "A deforming pixel surface", "A texture follows the animated mesh");

        // ----------------------------------------------------
        // 2. Color Palette (3Blue1Brown aesthetic)
        // ----------------------------------------------------
        const B = 0; // Sky Blue (ambient grid / background)
        const G = 1; // Green (frog skin)
        const L = 2; // Lime / Yellow-Green (belly & mouth)
        const K = 3; // Black (pupils, borders, mouth crease)
        const W = 4; // White (eye sclera)
        const D = 5; // Deep Blue (grid shading)

        const colorMap: Record<number, Color> = {
            [B]: new Color(0.20, 0.65, 0.98, 1.0),
            [D]: new Color(0.12, 0.48, 0.85, 1.0),
            [G]: new Color(0.38, 0.76, 0.22, 1.0),
            [L]: new Color(0.72, 0.82, 0.18, 1.0),
            [K]: new Color(0.08, 0.08, 0.08, 1.0),
            [W]: new Color(1.00, 1.00, 1.00, 1.0),
        };

        // ----------------------------------------------------
        // 3. Frog Pixel Matrix (18 x 18)
        // ----------------------------------------------------
        const frogMatrix: number[][] = [
            [B, B, B, B, B, D, G, G, B, B, G, G, D, B, B, B, B, B],
            [B, B, B, B, D, G, G, G, B, B, G, G, G, D, B, B, B, B],
            [B, B, B, D, G, W, W, K, G, G, W, W, K, G, D, B, B, B],
            [B, B, B, G, G, W, K, K, G, G, W, K, K, G, G, B, B, B],
            [B, B, D, G, G, W, K, K, G, G, W, K, K, G, G, D, B, B],
            [B, B, G, G, G, G, W, G, G, G, G, W, G, G, G, G, B, B],
            [B, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, B],
            [B, G, G, G, K, K, K, K, K, K, K, K, K, K, G, G, G, B],
            [B, G, G, K, L, L, L, L, L, L, L, L, L, L, K, G, G, B],
            [B, D, G, K, L, L, L, L, L, L, L, L, L, L, K, G, D, B],
            [B, B, D, K, L, L, L, L, L, L, L, L, L, L, K, D, B, B],
            [B, B, G, K, L, L, L, L, L, L, L, L, L, L, K, G, B, B],
            [B, B, G, G, K, K, K, K, K, K, K, K, K, K, G, G, B, B],
            [B, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, B],
            [B, G, G, D, B, B, G, G, G, G, G, G, B, B, D, G, G, B],
            [B, B, D, B, B, B, B, G, G, G, G, B, B, B, B, D, B, B],
        ];

        const tileSize = 0.28;
        const rows = frogMatrix.length;
        const cols = frogMatrix[0].length;
        const widthSpan = cols * tileSize;
        const heightSpan = rows * tileSize;

        // ----------------------------------------------------
        // 4. Create Deformable Coordinate Plane
        // ----------------------------------------------------
        const plane = new NumberPlane({
            xRange: [-widthSpan / 2, widthSpan / 2, tileSize],
            yRange: [-heightSpan / 2, heightSpan / 2, tileSize],
            width: widthSpan,
            height: heightSpan,
            subdivisions: 40,
            gridColor: new Color(1.0, 1.0, 1.0, 0.85),
            axisColor: new Color(1.0, 1.0, 1.0, 0.95),
            gridStrokeWidth: 0.018,
            axisStrokeWidth: 0.024,
            showAxes: false, // Continuous grid lines matching 3b1b aesthetic
            showGrid: true
        });

        // ----------------------------------------------------
        // 5. Create Deformable Frog PixelGrid
        // ----------------------------------------------------
        const frog = new PixelGrid({
            matrix: frogMatrix,
            colorMap: colorMap,
            tileSize: tileSize,
            edgeSubdivisions: 6,
            strokeColor: new Color(1.0, 1.0, 1.0, 0.9),
            strokeWidth: 0.014
        });

        this.add(plane);
        this.add(frog);

        // ----------------------------------------------------
        // 6. Composable Vector Fields (Layer 1 Math System)
        // ----------------------------------------------------

        // A. Wavy Periodic Field
        const waveField = Field.wave({ amplitude: 0.38, frequency: 2.4 });

        // B. Exponential Swirl / Vortex Field
        const swirlField = Field.swirl({ strength: 0.85, radius: 2.8 });

        // C. Conformal Complex Map: f(z) = z + 0.28 * sin(1.4 * z) with Complex class
        const conformalField = Field.conformal((z) => {
            return z.add(z.mul(1.4).sin().mul(0.28));
        });

        const targets = [plane, frog];

        // ----------------------------------------------------
        // 7. Interactive Homotopy Animation Loop
        // ----------------------------------------------------
        while (true) {
            // Stage 1: Wave Distortion (from flat -> wavy coordinate space)
            await this.play(
                new HomotopyAnimation(targets, waveField, {
                    duration: 3000,
                    rate_func: Rate.easeInOut(3)
                })
            );
            await this.wait(1000);

            // Stage 2: Restore to Flat Euclidean Coordinates
            await this.play(
                new HomotopyAnimation(targets, waveField, {
                    duration: 2500,
                    fromProgress: 1.0,
                    toProgress: 0.0,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(600);

            // Stage 3: Conformal Complex Map
            await this.play(
                new HomotopyAnimation(targets, conformalField, {
                    duration: 3200,
                    rate_func: Rate.easeInOut(2.5)
                })
            );
            await this.wait(1000);

            // Stage 4: Swirl / Vortex Deformation
            await this.play(
                new HomotopyAnimation(targets, swirlField, {
                    duration: 2800,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(1000);

            // Stage 5: Restore back to pristine Cartesian grid
            await this.play(
                new HomotopyAnimation(targets, swirlField, {
                    duration: 2200,
                    fromProgress: 1.0,
                    toProgress: 0.0,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(800);
        }
    }
}
