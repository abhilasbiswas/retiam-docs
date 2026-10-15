import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/recreation/deformed_texture.ts
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
    Rate,
    Vec3
} from "retiam";

export default class DeformedTextureScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground());

        // 1. Setup Camera
        this.camera.position.set([0, 0, 10]);
        new Camera2DController(this, this.camera, { zoom: 10 });
        frameStage(this, 14, 11);
        demoCaption(this, "A spherical texture deformation", "The UV map follows the changing surface");

        // 2. Coordinate Boundaries (2:1 Equirectangular World Map projection)
        const widthSpan = 9.6;
        const heightSpan = 4.8;
        const xRange: [number, number] = [-widthSpan / 2, widthSpan / 2];
        const yRange: [number, number] = [-heightSpan / 2, heightSpan / 2];
        const step = 0.6;

        // 3. Create Sprite instance with Earth / World Map Texture
        const earthSprite = new Sprite("/res/media/earth.jpg");

        // 4. Project the Sprite onto a Continuous MeshSprite
        const earthMesh = new MeshSprite({
            source: earthSprite,
            xRange: xRange,
            yRange: yRange,
            gridResolution: [48, 24],
            opacity: 0.95
        });

        // 5. Create Coordinate Grid (Latitude & Longitude Iso-lines)
        const plane = new NumberPlane({
            xRange: [xRange[0], xRange[1], step],
            yRange: [yRange[0], yRange[1], step],
            width: widthSpan,
            height: heightSpan,
            subdivisions: 40,
            gridColor: new Color(0.2, 0.7, 1.0, 0.45),
            axisColor: new Color(1.0, 0.85, 0.2, 0.95), // Equator and Prime Meridian
            gridStrokeWidth: 0.016,
            axisStrokeWidth: 0.024,
            showAxes: true,
            showGrid: true,
            accuracy: 8
        });

        // Layer ordering: texture underneath the glowing grid lines
        earthMesh.z_index = -0.01;
        plane.z_index = 0.01;

        this.add(earthMesh);
        this.add(plane);

        const targets = [plane, earthMesh];

        // ----------------------------------------------------
        // 6. Mathematical Map Projections & Spatial Fields
        // ----------------------------------------------------

        // A. Sinusoidal Equal-Area Map Projection: x' = x * cos(y * scale)
        const sinusoidalMap = (p: Vec3, t: number = 1.0): Vec3 => {
            const latFactor = Math.cos((p.y / (heightSpan / 2)) * (Math.PI / 2.2));
            const targetX = p.x * latFactor;
            return new Vec3(
                p.x + (targetX - p.x) * t,
                p.y,
                p.z
            );
        };

        // B. Coriolis Atmospheric Vortex (Spiral rotation over the equator)
        const vortexField = Field.swirl({
            center: [0, 0],
            strength: 1.1,
            radius: 3.2
        });

        // C. Conformal Complex Map: f(z) = z + 0.25 * sin(1.35 * z) with Complex class
        const conformalField = Field.conformal((z) => {
            return z.add(z.mul(1.35).sin().mul(0.25));
        });

        // ----------------------------------------------------
        // 7. Interactive 1:1 Texture Deformation Loop
        // ----------------------------------------------------
        while (true) {
            // Stage 1: Sinusoidal Equal-Area Projection
            await this.play(
                new HomotopyAnimation(targets, sinusoidalMap, {
                    duration: 3200,
                    rate_func: Rate.easeInOut(3)
                })
            );
            await this.wait(1200);

            // Stage 2: Restore to Flat Equirectangular Space
            await this.play(
                new HomotopyAnimation(targets, sinusoidalMap, {
                    duration: 2400,
                    fromProgress: 1.0,
                    toProgress: 0.0,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(600);

            // Stage 3: Complex Conformal Mapping (Preserves local angles and landmass shapes)
            await this.play(
                new HomotopyAnimation(targets, conformalField, {
                    duration: 3400,
                    rate_func: Rate.easeInOut(2.5)
                })
            );
            await this.wait(1200);

            // Stage 4: Atmospheric Coriolis Vortex (Twists landmasses and coordinates around origin)
            await this.play(
                new HomotopyAnimation(targets, vortexField, {
                    duration: 3000,
                    rate_func: Rate.smooth()
                })
            );
            await this.wait(1200);

            // Stage 5: Restore back to Euclidean coordinates
            await this.play(
                new HomotopyAnimation(targets, vortexField, {
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
