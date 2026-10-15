import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { Box } from "retiam";
import { Sphere } from "retiam";
import { Torus } from "retiam";
import { Morph } from "retiam";
import { MorphMode } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class DualContouringMorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Viewport
        this.camera.position.set([0, 7, 36]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Annotations
        const title = new SDFText("Dual Contouring Volumetric Morph", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(0.95, 0.75, 0.2, 0.95);
        title.paint.stroke = new Color(0.7, 0.4, 0.0, 0.6);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]);
        this.add(title);

        const subtitle = new SDFText("Sharp feature-preserving volumetric dual contouring with QEF solver", { fontSize: 1.6, anchor: CENTER });
        subtitle.paint.fill = new Color(0.85, 0.8, 0.65, 0.8);
        subtitle.setAsUI().move([0, 36, 0]);
        this.add(subtitle);

        // 3. Define the Models
        // Shape A: Golden Polyhedral Cube (sharp 90-degree edges)
        const cube = new Box(11.0, 11.0, 11.0);
        cube.material.color = new Color(1.0, 0.7, 0.1, 1.0);
        cube.material.metallic = 0.9;
        cube.material.roughness = 0.2;

        // Shape B: Deep Cobalt Torus
        const torus = new Torus(6.5, 2.2, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(0.1, 0.45, 1.0, 1.0);
        torus.material.metallic = 0.8;
        torus.material.roughness = 0.25;

        // Shape C: Crimson Ruby Sphere
        const sphere = new Sphere(7.5, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(0.95, 0.1, 0.3, 1.0);
        sphere.material.metallic = 0.85;
        sphere.material.roughness = 0.2;

        this.add(cube);

        // Continuous rotational dynamics
        this.always(() => {
            const rotY = this.dt * 0.0005;
            const rotX = this.dt * 0.0002;
            cube.transform.rotateWorldY(rotY);
            cube.transform.rotateWorldX(rotX);
            torus.transform.rotateWorldY(rotY);
            torus.transform.rotateWorldX(rotX);
            sphere.transform.rotateWorldY(rotY);
            sphere.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        const dcConfig = {
            mode: MorphMode.DUAL_CONTOURING,
            sdfResolution: 40,
            noiseStrength: 0.0,
            duration: 3200,
            rate_func: Rate.easeInOutCubic()
        };

        // 4. Volumetric Morph Cycle
        while (true) {
            await this.wait(1200);

            // Cube -> Torus (sharp edges morph into organic hole)
            await this.play(Morph(cube, torus, dcConfig));
            await this.wait(1200);

            // Torus -> Sphere (hole closes smoothly)
            await this.play(Morph(torus, sphere, dcConfig));
            await this.wait(1200);

            // Sphere -> Cube (sharp edges and vertices re-crystallize)
            await this.play(Morph(sphere, cube, dcConfig));
        }
    }
}
