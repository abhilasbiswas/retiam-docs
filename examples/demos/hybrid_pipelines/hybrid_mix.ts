import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// examples/demos/hybrid_mix.ts

import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Model } from "retiam";
import { Math3D } from "retiam";
import { RenderConfig } from "retiam";
import { Path } from "retiam";
import { light } from "retiam";
import { env } from "retiam";
import { Plane } from "retiam";

export default class HybridMixScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = false;
        this.renderConfig.raytraceEnabled = true;
        light.position.set([-50, 50, 50]);
        light.color = new Color(100, 100, 100);
        env.intensity = 1.0;

        this.camera.position.set([0, 10, 80]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Hybrid rendering", "Raytraced geometry, raster geometry and vector paths");
        // this.clearColor(new Color(0.02, 0.02, 0.03, 1.0));


        // Add a floor plane to catch shadows
        const floor = new Plane(200, 200);
        floor.transform.position = [0, -10, 0];
        floor.material.color = [0.3, 0.3, 0.3];
        this.add(floor);

        const sphereMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(10, 64, 64).vertices,
            Math3D.createSphere(10, 64, 64).indices!
        );

        // 1. Raytraced Glass Sphere (RT_ENABLE = true)
        const glassSphere = new Model(Math3D.createSphere(10, 64, 64));
        glassSphere.RT_ENABLE = true;
        glassSphere.transform.move([-20, 0, 0]);
        glassSphere.material.color = Color.GREEN;
        // glassSphere.material.transmission = 1.0; // Refractive glass
        glassSphere.material.ior = 1.52;
        glassSphere.material.roughness = 0.0;
        this.add(glassSphere);

        // 2. Rasterized Opaque Model (RT_ENABLE = false)
        // Rasterizer writes its depth first, allowing the glass sphere
        // to correctly refract it during the subsequent raytracing pass!
        const rasterCube = new Model(Math3D.createCube(15));
        rasterCube.RT_ENABLE = false;
        rasterCube.transform.move([20, 0, 0]);
        rasterCube.material.color = new Color(1.0, 0.2, 0.5); // Hot Pink
        rasterCube.material.roughness = 0.4;
        this.add(rasterCube);

        // 3. 2D Vector Path (Overlay)
        // A flat, vector-based 2D overlay path drawn cleanly on top of the composite scene.
        const path_d = "M-30,25Q0,40,30,25";
        const pathOverlay = new Path(path_d);
        pathOverlay.paint.stroke = new Color(0.0, 0.8, 1.0, 0.9); // Glowing Cyan
        pathOverlay.paint.strokeWidth = 3.0;
        pathOverlay.paint.fill = Color.NONE;
        pathOverlay.transform.move([0, -20, 10]);
        this.add(pathOverlay);

        // this.always(() => {
        //     rasterCube.transform.rotateWorldY(this.dt * 0.001);
        //     rasterCube.transform.rotateWorldX(this.dt * 0.0005);
        //     this.invalidate();
        // });
    }
}
