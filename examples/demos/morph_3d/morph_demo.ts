import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene } from "retiam";
import { MorphModel } from "retiam";
import { MorphMode } from "retiam";
import { Model } from "retiam";
import { Math3D } from "retiam";
import { CustomAnimation } from "retiam";
import { Rate } from "retiam";
import { Color } from "retiam";
import { CameraController } from "retiam";

export default class TestAnimation extends Scene {
    private morphModel!: MorphModel;

    public async run() {
        this.camera.position.set([0, 0, 60]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Volumetric morphing", "A continuous transition between solid surfaces");

        // 1. Create Models (Solid Mode)
        const rawCube = Math3D.createCube(15);
        // const meshA = Geometry3D.computeSmoothShading(rawCube.vertices, rawCube.indices);
        const solidA = new Model(rawCube);

        // const solidA = await OBJLoader.load("/res/model/model.obj");

        solidA.material.color = new Color(0.1, 0.5, 0.9, 1.0); // Blueish
        solidA.material.roughness = 1.0;
        this.add(solidA);

        const rawSphere = Math3D.createSphere(10, 64, 64);
        const meshB = Math3D.computeSmoothShading(rawSphere.vertices, rawSphere.indices!);
        const solidB = new Model(meshB);



        solidB.material.color = new Color(0.0, 0.2, 1, 1.0); // Redish
        solidB.material.roughness = 0.8;
        this.add(solidB);

        // 2. Setup Morph Model (The new constructor takes the two Models!)
        this.morphModel = new MorphModel(solidA, solidB, {
            mode: MorphMode.DUAL_CONTOURING,
            sdfResolution: 64,
            particleCount: 10000,
            particleSize: 0.2,
            noiseStrength: 0,    // <--- LOWERED from 25.0 to 3.5
            noiseFrequency: 1.2,   // <--- Tightened the curl noise
            blendThreshold: 0.1
        });
        this.add(this.morphModel);

        while (true) {
            // Animate A -> B
            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(t); // Automatically handles opacities & colors!
            }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

            await this.wait(1000);

            // Animate B -> A
            await this.play(new CustomAnimation((t) => {
                this.morphModel.setWeight(1.0 - t);
            }, { duration: 4000, rate_func: Rate.easeInOutCubic() }));

            await this.wait(1000);
        }
    }
}
