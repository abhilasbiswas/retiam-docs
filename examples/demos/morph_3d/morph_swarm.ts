import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { Sphere } from "retiam";
import { Box } from "retiam";
import { Torus } from "retiam";
import { Morph } from "retiam";
import { MorphMode, SwarmTrajectory } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class SwarmMorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Viewport
        this.camera.position.set([0, 8, 45]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Title & Subtitle
        const title = new SDFText("Swarm Compute Morph", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(0.2, 0.9, 1.0, 0.95);
        title.paint.stroke = new Color(0.0, 0.4, 0.8, 0.6);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]);
        this.add(title);

        const subtitle = new SDFText("35,000 GPU Gaussian Splat particles with 3D curl-noise vortex flocking", { fontSize: 1.6, anchor: CENTER });
        subtitle.paint.fill = new Color(0.65, 0.75, 0.9, 0.8);
        subtitle.setAsUI().move([0, 36, 0]);
        this.add(subtitle);

        // 3. Define the 3D Target Meshes with Rich PBR Materials
        // Shape A: Glowing Cyan Torus
        const torus = new Torus(8.0, 2.5, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(0.05, 0.85, 1.0, 1.0);
        torus.material.metallic = 0.85;
        torus.material.roughness = 0.2;
        torus.material.emColor = new Color(0.0, 0.5, 0.9, 1.0);
        torus.material.emStrength = 0.4;

        // Shape B: Electric Magenta Sphere
        const sphere = new Sphere(9.0, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(1.0, 0.08, 0.55, 1.0);
        sphere.material.metallic = 0.4;
        sphere.material.roughness = 0.25;
        sphere.material.emColor = new Color(0.9, 0.0, 0.4, 1.0);
        sphere.material.emStrength = 0.5;

        // Shape C: Gilded Amber Cube
        const cube = new Box(12.0, 12.0, 12.0);
        cube.material.color = new Color(1.0, 0.75, 0.1, 1.0);
        cube.material.metallic = 0.95;
        cube.material.roughness = 0.15;
        cube.material.emColor = new Color(0.8, 0.5, 0.0, 1.0);
        cube.material.emStrength = 0.3;

        // 4. Initial Scene Setup
        this.add(torus);

        // Keep shapes smoothly rotating
        this.always(() => {
            const rotY = this.dt * 0.0006;
            const rotX = this.dt * 0.00025;
            torus.transform.rotateWorldY(rotY);
            torus.transform.rotateWorldX(rotX);
            sphere.transform.rotateWorldY(rotY);
            sphere.transform.rotateWorldX(rotX);
            cube.transform.rotateWorldY(rotY);
            cube.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        // 5. Morphing Animation Sequence using Morph() API
        const swarmConfig = {
            mode: MorphMode.SWARM,
            trajectory: SwarmTrajectory.SPIRAL,
            particleCount: 35000,
            particleSize: 0.18,
            noiseStrength: 4.5,
            noiseFrequency: 1.1,
            blendThreshold: 0.12,
            duration: 3200,
            rate_func: Rate.easeInOutCubic()
        };

        while (true) {
            await this.wait(1200);

            // Torus -> Sphere
            await this.play(Morph(torus, sphere, swarmConfig));
            await this.wait(1200);

            // Sphere -> Cube
            await this.play(Morph(sphere, cube, swarmConfig));
            await this.wait(1200);

            // Cube -> Torus
            await this.play(Morph(cube, torus, swarmConfig));
        }
    }
}
