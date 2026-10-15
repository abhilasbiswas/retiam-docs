import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/recreation/deformed_image.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    NumberPlane,
    MeshSprite,
    HomotopyAnimation,
    Field,
    Color,
    BLACK,
    Rate
} from "retiam";

export default class DeformedImageScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground());

        // 1. Setup Camera
        this.camera.position.set([0, 0, 10]);
        new Camera2DController(this, this.camera, { zoom: 10 });
        frameStage(this, 14, 11);
        demoCaption(this, "An image on a flexible mesh", "The grid makes the deformation visible");

        // 2. Coordinate Boundaries (16:9 aspect ratio)
        const widthSpan = 9.6;
        const heightSpan = 5.4;
        const xRange: [number, number] = [-widthSpan / 2, widthSpan / 2];
        const yRange: [number, number] = [-heightSpan / 2, heightSpan / 2];
        const step = 0.6;

        // 3. Create Continuous Deformable Mesh Sprite (Green Leaves with Dewdrops)
        const image = new MeshSprite({
            source: "/res/media/image.jpg",
            xRange: xRange,
            yRange: yRange,
            gridResolution: [48, 27],
            opacity: 0.92,
        });

        // 4. Create Deformable Coordinate Grid (3Blue1Brown Iso-curves)
        const plane = new NumberPlane({
            xRange: [xRange[0], xRange[1], step],
            yRange: [yRange[0], yRange[1], step],
            width: widthSpan,
            height: heightSpan,
            subdivisions: 40,
            gridColor: new Color(1.0, 1.0, 1.0, 0.75),
            axisColor: new Color(0.3, 0.9, 1.0, 0.95),
            gridStrokeWidth: 0.016,
            axisStrokeWidth: 0.024,
            showAxes: true,
            showGrid: true,
            accuracy: 10
        });

        // Render image underneath the coordinate grid lines
        image.z_index = -0.01;
        plane.z_index = 0.01;

        this.add(image);
        this.add(plane);

        const targets = [plane, image];

        // ----------------------------------------------------
        // 5. Composable Vector Fields
        // ----------------------------------------------------

        // A. Sinusoidal Coordinate Wave Field
        const waveField = Field.wave({ amplitude: 0.35, frequency: 2.2 });

        // B. Swirl / Vortex Space Field
        const swirlField = Field.swirl({ strength: 0.9, radius: 3.0 });

        // C. Conformal Complex Map: f(z) = z + 0.25 * sin(1.35 * z) using Complex class
        const conformalField = Field.conformal((z) => {
            return z.add(z.mul(1.35).sin().mul(0.25));
        });

        // ----------------------------------------------------
        // 6. Interactive 1:1 Deformation Loop
        // ----------------------------------------------------
        while (true) {
            // Stage 1: Wave Distortion (image & grid ripple in 1:1 sync)
            await this.play(
                new HomotopyAnimation(targets, waveField, {
                    duration: 3000,
                    rate_func: Rate.easeInOut(3)
                })
            );
            await this.wait(1200);

            // Stage 2: Restore to Flat Cartesian Space
            await this.play(
                new HomotopyAnimation(targets, waveField, {
                    duration: 2500,
                    fromProgress: 1.0,
                    toProgress: 0.0,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(600);

            // Stage 3: Complex Conformal Map (preserving local angles on the leaf)
            await this.play(
                new HomotopyAnimation(targets, conformalField, {
                    duration: 3400,
                    rate_func: Rate.easeInOut(2.5)
                })
            );
            await this.wait(1200);

            // Stage 4: Swirl / Vortex Deformation (twisting space around origin)
            await this.play(
                new HomotopyAnimation(targets, swirlField, {
                    duration: 3000,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(1200);

            // Stage 5: Restore back to pristine coordinates
            await this.play(
                new HomotopyAnimation(targets, swirlField, {
                    duration: 2400,
                    fromProgress: 1.0,
                    toProgress: 0.0,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(800);
        }
    }
}
