// examples/demos/swarm_morph.ts

import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Model } from "retiam";
import { Math3D } from "retiam";
import { MorphModel } from "retiam";
import { MorphMode, SwarmTrajectory } from "retiam";
import { CustomAnimation } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class SwarmMorphScene extends Scene {
    private morphModel!: MorphModel;

    public async run() {
        // 1. Setup Camera & Environment
        this.camera.position.set([0, 0, 60]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Deep dark blue background

        // 2. Add HUD Text (2D Overlay)
        const title = new SDFText("Swarm Compute Morph", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(1.0, 1.0, 1.0, 0.9);
        title.paint.stroke = new Color(0.0, 0.5, 1.0, 0.5);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]); // Center the heading above the morph
        this.add(title);

        // 3. Create Base Models
        // We use computeSmoothShading to generate the WebGPUMesh data
        const sphereMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(12, 64, 64).vertices,
            Math3D.createSphere(12, 64, 64).indices!
        );
        const sphereModel = new Model(sphereMesh);
        sphereModel.material.color = new Color(0.0, 0.8, 1.0, 1.0); // Neon Blue
        sphereModel.material.roughness = 0.2;
        sphereModel.material.metallic = 0.8;

        const cubeMesh = Math3D.computeSmoothShading(
            Math3D.createCube(18).vertices,
            Math3D.createCube(18).indices!
        );
        const cubeModel = new Model(cubeMesh);
        cubeModel.material.color = new Color(1.0, 0.0, 0.5, 1.0); // Neon Pink
        cubeModel.material.roughness = 0.5;
        cubeModel.material.metallic = 0.2;

        // We don't add the base models to the scene, only the MorphModel proxy.

        // 4. Setup the Swarm Morph Model
        this.morphModel = new MorphModel(sphereModel, cubeModel, {
            trajectory: SwarmTrajectory.LINEAR,
            mode: MorphMode.SWARM,
            particleCount: 40000,     // 40,000 independent GPU particles
            particleSize: 0.15,       // Radius of each Gaussian Splat
            noiseStrength: 4.5,       // Fluid turbulence intensity
            noiseFrequency: 1.2,      // Curl noise swirl size
            blendThreshold: 0.15      // Crossfade threshold between solid/particles
        });

        // Spin the morph model slightly so it looks dynamic
        this.morphModel.always(() => {
            this.morphModel.transform.rotateWorldY(this.dt * 0.0005);
            this.morphModel.transform.rotateWorldX(this.dt * 0.0002);
            this.invalidate(); // Keep rendering while rotating
        });

        this.add(this.morphModel);

        // 5. Infinite Animation Loop
        while (true) {
            // Morph: Sphere -> Cube
            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(t);
            }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

            await this.wait(1000);

            // Morph: Cube -> Sphere
            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(1.0 - t);
            }, { duration: 3500, rate_func: Rate.easeInOutCubic() }));

            await this.wait(1000);
        }
    }
}
