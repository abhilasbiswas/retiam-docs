// examples/demos/rt_media.ts

import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { OBJLoader } from "retiam";
import { RenderConfig } from "retiam";
import { Model } from "retiam";
import { Math3D } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class RTMediaScene extends Scene {
    public async run() {
        this.composer!.ALWAYS_UPDATE = false;
        this.renderConfig.raytraceEnabled = true;
        this.camera.position.set([0, 0, 120]);
        new CameraController(this, this.camera);

        // A moody dark environment so the emissive screens pop
        this.clearColor(demoBackground());

        try {
            const myModel = await OBJLoader.load("/res/model/raytraced-scene.obj", "smooth", true, true);
            myModel.transform.setScale(10);
            myModel.transform.move([0, -10, 0]);
            this.add(myModel);
        } catch (e) {
            console.warn("OBJ not found. Spawning fallback reflective spheres.");
            // Fallback: A highly reflective chrome sphere and a glass sphere
            const sphereMesh = Math3D.computeSmoothShading(Math3D.createSphere(15, 64, 64).vertices, Math3D.createSphere(15, 64, 64).indices!);

            const chromeSphere = new Model(sphereMesh);
            chromeSphere.transform.move([0, -5, 10]);
            chromeSphere.material.color = new Color(1.0, 1.0, 1.0);
            chromeSphere.material.metallic = 1.0;
            chromeSphere.material.roughness = 0.05; // Perfect mirror
            this.add(chromeSphere);

            const glassSphere = new Model(sphereMesh);
            glassSphere.transform.move([0, -5, -25]);
            glassSphere.material.color = new Color(1.0, 1.0, 1.0);
            glassSphere.material.transmission = 0.0; // Glass
            glassSphere.material.ior = 1.5;
            glassSphere.material.roughness = 0.0;
            this.add(glassSphere);
        }

    }
}
