import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, CameraModel, DOWN, Entity, GrowFromCenter, SDF2D, SDFBox, SDFEntity3D, SDFNode, SDFSphere, SDFTorus, SDFCapsule, SDFCylinder, SDFOctahedron, SDFMorph3D, SDF3DTransform } from "retiam";
import { demoBackground } from "../../shared/presentation";


export default class SDFMorphTestScene extends Scene {

    public async run() {
        this.camera.position.set([0, 2, 8]);
        this.camera.pitch = -0.15;
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // ==========================================
        // STATE A: A Ruby Red Rounded Cube
        // ==========================================
        const astA: SDFNode = new SDFBox(2, 2, 2).round(0.05);
        const stateA = new SDFEntity3D(astA);

        stateA.material.color = new Color(0.9, 0.1, 0.2, 1.0).rgba;
        stateA.material.roughness = 0.2;
        stateA.material.metallic = 0.1;

        this.add(stateA);

        // ==========================================
        // STATE B: Cyan Interlocking Rings
        // ==========================================
        const ring1 = new SDFTorus(1.0, 0.3).translate([-1, 0, 0]);
        const ring2 = new SDFTorus(1.0, 0.3).rotate(Math.PI / 2, 0, 0).translate([1, 0, 0]);

        const astB: SDFNode = ring1.union(ring2, 0.1);
        const stateB = new SDFEntity3D(astB);

        // Define target PBR materials AND a target rotation offset!
        stateB.material.color = new Color(0.2, 0.8, 1.0, 1.0).rgba;
        stateB.material.roughness = 0.5;
        stateB.material.metallic = 1.0;
        stateB.transform.rotateWorldZ(Math.PI / 2);

        // ==========================================
        // STATE C: Glowing Liquid Gold Droplets
        // ==========================================
        let astC: SDFNode = new SDFSphere(0.8).translate([-2, 1, 0]);
        astC = astC.union(new SDFSphere(0.8).translate([2, -1, 0]), 0.6);

        const stateC = new SDFEntity3D(astC);
        stateC.material.color = new Color(1.0, 0.8, 0.2, 1.0).rgba;
        stateC.material.emColor = new Color(1.0, 0.5, 0.0, 1.0).rgba;
        stateC.material.emStrength = 0.5;
        stateC.material.metallic = 1.0;
        stateC.material.roughness = 0.05;

        // ==========================================
        // ANIMATION TIMELINE
        // ==========================================
        await this.wait(1000);

        while (true) {
            // A -> B (Cube to Cyan Rings)
            await this.play(new SDF3DTransform(stateA, stateB, {
                duration: 2500, rate_func: Rate.easeInOutCubic()
            }));
            await this.wait(1000);

            // B -> C (Cyan Rings to Gold Drops)
            await this.play(new SDF3DTransform(stateB, stateC, {
                duration: 2500, rate_func: Rate.easeInOutCubic()
            }));
            await this.wait(1000);

            // C -> A (Gold Drops back to Red Cube)
            await this.play(new SDF3DTransform(stateC, stateA, {
                duration: 2500, rate_func: Rate.easeInOutCubic()
            }));
            await this.wait(1000);
        }
    }
}
