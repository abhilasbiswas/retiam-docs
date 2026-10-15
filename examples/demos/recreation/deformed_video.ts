import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/recreation/deformed_video.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    NumberPlane,
    MeshSprite,
    Sprite,
    HomotopyAnimation,
    Field,
    Color,
    BLACK,
    Rate
} from "retiam";

export default class DeformedVideoScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground());

        // 1. Setup Camera
        this.camera.position.set([0, 0, 10]);
        new Camera2DController(this, this.camera, { zoom: 10 });
        frameStage(this, 14, 11);
        demoCaption(this, "Video on a moving mesh", "Live footage and wireframe share the same deformation");

        // 2. 16:9 Coordinate Boundaries
        const widthSpan = 9.6;
        const heightSpan = 5.4;
        const xRange: [number, number] = [-widthSpan / 2, widthSpan / 2];
        const yRange: [number, number] = [-heightSpan / 2, heightSpan / 2];
        const step = 0.6;

        // 3. Create Sprite instance with Live Playing Video
        const videoSprite = new Sprite("/res/media/nature.mp4");

        // 4. Project the Video Sprite onto a Continuous MeshSprite
        const videoMesh = new MeshSprite({
            source: videoSprite,
            xRange: xRange,
            yRange: yRange,
            gridResolution: [48, 27],
            opacity: 0.95
        });

        // 5. Create Deformable Coordinate Grid (3Blue1Brown Iso-curves)
        const plane = new NumberPlane({
            xRange: [xRange[0], xRange[1], step],
            yRange: [yRange[0], yRange[1], step],
            width: widthSpan,
            height: heightSpan,
            subdivisions: 40,
            gridColor: new Color(1.0, 1.0, 1.0, 0.75),
            axisColor: new Color(0.2, 0.85, 1.0, 0.95),
            gridStrokeWidth: 0.016,
            axisStrokeWidth: 0.024,
            showAxes: true,
            showGrid: true,
            accuracy: 8
        });

        // Layer ordering: video underneath the glowing grid lines
        videoMesh.z_index = -0.01;
        plane.z_index = 0.01;

        this.add(videoMesh);
        this.add(plane);
        videoMesh.play();

        const targets = [plane, videoMesh];

        // ----------------------------------------------------
        // 6. Composable Vector Fields
        // ----------------------------------------------------

        // A. Sinusoidal Coordinate Wave Field
        const waveField = Field.wave({ amplitude: 0.38, frequency: 2.2 });

        // B. Swirl / Vortex Space Field
        const swirlField = Field.swirl({ strength: 0.95, radius: 2.8 });

        // C. Conformal Complex Map: f(z) = z + 0.26 * sin(1.4 * z) with Complex class
        const conformalField = Field.conformal((z) => {
            return z.add(z.mul(1.4).sin().mul(0.26));
        });

        // ----------------------------------------------------
        // 7. Interactive 1:1 Live Video Deformation Loop
        // ----------------------------------------------------
        while (true) {
            // Stage 1: Wave Distortion (video continues playing at 60 FPS while warping)
            await this.play(
                new HomotopyAnimation(targets, waveField, {
                    duration: 3200,
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

            // Stage 3: Complex Conformal Map (preserving local angles on the live video stream)
            await this.play(
                new HomotopyAnimation(targets, conformalField, {
                    duration: 3500,
                    rate_func: Rate.easeInOut(2.5)
                })
            );
            await this.wait(1200);

            // Stage 4: Swirl / Vortex Deformation (twisting live video playback around origin)
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
