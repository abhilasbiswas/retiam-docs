import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { SDFEntity3D } from "retiam";
import { SDFSphere, SDFTorus, SDFBox } from "retiam";
import { Morph } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class SdfRaymarchingMorphDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Viewport
        this.camera.position.set([0, 3, 16]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Annotations
        const title = new SDFText("Analytic SDF Raymarch Morph", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(0.4, 0.8, 1.0, 0.95);
        title.paint.stroke = new Color(0.1, 0.3, 0.8, 0.6);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]);
        this.add(title);

        const subtitle = new SDFText("Procedural Signed Distance Field raymarching with analytical polynomial blending", { fontSize: 1.6, anchor: CENTER });
        subtitle.paint.fill = new Color(0.7, 0.85, 0.95, 0.8);
        subtitle.setAsUI().move([0, 36, 0]);
        this.add(subtitle);

        // 3. Define the Analytic SDF Entities
        // Shape A: Glowing Cyan SDF Sphere
        const sphereSDF = new SDFEntity3D(new SDFSphere(2.5), { padding: 0.8 });
        sphereSDF.material.color = new Color(0.1, 0.8, 1.0, 1.0);
        sphereSDF.material.metallic = 0.8;
        sphereSDF.material.roughness = 0.15;
        sphereSDF.material.emColor = new Color(0.0, 0.4, 0.8, 1.0);
        sphereSDF.material.emStrength = 0.35;

        // Shape B: Electric Amethyst SDF Torus
        const torusSDF = new SDFEntity3D(new SDFTorus(2.2, 0.75), { padding: 0.8 });
        torusSDF.material.color = new Color(0.85, 0.15, 0.95, 1.0);
        torusSDF.material.metallic = 0.85;
        torusSDF.material.roughness = 0.2;
        torusSDF.material.emColor = new Color(0.5, 0.05, 0.7, 1.0);
        torusSDF.material.emStrength = 0.4;

        // Shape C: Gilded Amber SDF Box
        const boxSDF = new SDFEntity3D(new SDFBox(3.5, 3.5, 3.5), { padding: 0.8 });
        boxSDF.material.color = new Color(1.0, 0.7, 0.1, 1.0);
        boxSDF.material.metallic = 0.9;
        boxSDF.material.roughness = 0.15;
        boxSDF.material.emColor = new Color(0.6, 0.35, 0.0, 1.0);
        boxSDF.material.emStrength = 0.3;

        this.add(sphereSDF);

        // Keep volumes rotating dynamically
        this.always(() => {
            const rotY = this.dt * 0.0006;
            const rotX = this.dt * 0.00025;
            sphereSDF.transform.rotateWorldY(rotY);
            sphereSDF.transform.rotateWorldX(rotX);
            torusSDF.transform.rotateWorldY(rotY);
            torusSDF.transform.rotateWorldX(rotX);
            boxSDF.transform.rotateWorldY(rotY);
            boxSDF.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        const morphConfig = {
            duration: 3000,
            rate_func: Rate.easeInOutCubic()
        };

        // 4. Raymarched Analytic Morph Cycle
        while (true) {
            await this.wait(1200);

            // Sphere -> Torus
            await this.play(Morph(sphereSDF, torusSDF, morphConfig));
            await this.wait(1200);

            // Torus -> Box
            await this.play(Morph(torusSDF, boxSDF, morphConfig));
            await this.wait(1200);

            // Box -> Sphere
            await this.play(Morph(boxSDF, sphereSDF, morphConfig));
        }
    }
}
