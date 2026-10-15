import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { Sphere } from "retiam";
import { Torus } from "retiam";
import { Box } from "retiam";
import { Morph } from "retiam";
import { MorphMode } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class SdfVolumetricMorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Environment
        this.camera.position.set([0, 6, 36]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Annotations
        const title = new SDFText("SDF Volumetric Marching Cubes", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(0.8, 0.9, 1.0, 0.95);
        title.paint.stroke = new Color(0.3, 0.5, 0.9, 0.6);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]);
        this.add(title);

        const subtitle = new SDFText("GPU Marching Cubes isosurface extraction for liquid-metal organic topological morphing", { fontSize: 1.6, anchor: CENTER });
        subtitle.paint.fill = new Color(0.7, 0.8, 0.95, 0.8);
        subtitle.setAsUI().move([0, 36, 0]);
        this.add(subtitle);

        // 3. Define Models with Liquid Chrome & Molten Metal Materials
        // Shape A: Liquid Chrome Sphere
        const sphere = new Sphere(7.5, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(0.9, 0.92, 0.98, 1.0);
        sphere.material.metallic = 0.98;
        sphere.material.roughness = 0.1;
        sphere.material.emColor = new Color(0.1, 0.2, 0.4, 1.0);
        sphere.material.emStrength = 0.2;

        // Shape B: Molten Gold Torus
        const torus = new Torus(6.5, 2.2, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(1.0, 0.82, 0.2, 1.0);
        torus.material.metallic = 0.95;
        torus.material.roughness = 0.12;
        torus.material.emColor = new Color(0.5, 0.3, 0.0, 1.0);
        torus.material.emStrength = 0.25;

        // Shape C: Iridescent Violet Box
        const cube = new Box(11.0, 11.0, 11.0);
        cube.material.color = new Color(0.75, 0.25, 0.95, 1.0);
        cube.material.metallic = 0.92;
        cube.material.roughness = 0.15;
        cube.material.emColor = new Color(0.4, 0.1, 0.6, 1.0);
        cube.material.emStrength = 0.25;

        this.add(sphere);

        // Slow cinematic spin
        this.always(() => {
            const rotY = this.dt * 0.0005;
            const rotX = this.dt * 0.0002;
            sphere.transform.rotateWorldY(rotY);
            sphere.transform.rotateWorldX(rotX);
            torus.transform.rotateWorldY(rotY);
            torus.transform.rotateWorldX(rotX);
            cube.transform.rotateWorldY(rotY);
            cube.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        const sdfConfig = {
            mode: MorphMode.SDF_VOLUMETRIC,
            sdfResolution: 40,
            duration: 3400,
            rate_func: Rate.easeInOutCubic()
        };

        // 4. Infinite Liquid Morph Cycle
        while (true) {
            await this.wait(1200);

            // Sphere -> Torus (organic melting and hole opening)
            await this.play(Morph(sphere, torus, sdfConfig));
            await this.wait(1200);

            // Torus -> Cube (liquid fusion into solid block)
            await this.play(Morph(torus, cube, sdfConfig));
            await this.wait(1200);

            // Cube -> Sphere (surface tension rounding back into droplet)
            await this.play(Morph(cube, sphere, sdfConfig));
        }
    }
}
