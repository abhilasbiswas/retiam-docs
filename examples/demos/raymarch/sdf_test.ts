import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, CameraModel, DOWN, Entity, GrowFromCenter, SDF2D, SDFEntity3D, SDFBox, SDFCylinder, SDFNode, SDFSphere, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";
export default class SDFTestScene extends Scene {
    private metaball!: SDFEntity3D;
    private cheeseCube!: SDFEntity3D;
    private coreCapsule!: SDFEntity3D;

    public async run() {
        // 1. Setup Camera and Environment
        this.camera.position.set([0, 2, 10]);
        this.camera.pitch = -0.1;
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark studio background

        // ==========================================
        // OBJECT 1: The Liquid Metaball (Smooth Unions)
        // ==========================================

        // Base sphere
        let metaAST: SDFNode = new SDFSphere(1.0);

        // Add orbiting satellite blobs using Smooth Union (k = 0.4)
        metaAST = metaAST.union(new SDFSphere(0.5).translate([1.2, 0.8, 0.0]), 0.4);
        metaAST = metaAST.union(new SDFSphere(0.4).translate([-1.0, -0.9, 0.5]), 0.4);
        metaAST = metaAST.union(new SDFSphere(0.6).translate([0.0, 1.2, -0.8]), 0.4);

        // Test AST scaling
        metaAST = metaAST.scale(0.8);

        this.metaball = new SDFEntity3D(metaAST, { padding: 0.5 });
        this.metaball.transform.position = new Vec3(-3.5, 0, 0);

        // Give it a beautiful frosted glass PBR material
        this.metaball.material.color = new Color(0.2, 0.8, 1.0, 1.0).rgba;
        this.metaball.material.transmission = 0.85; // Glass refraction
        this.metaball.material.ior = 1.45;
        this.metaball.material.roughness = 0.15;
        this.metaball.material.metallic = 0.0;
        this.add(this.metaball);


        // ==========================================
        // OBJECT 2: The Swiss Cheese Cube (Subtractions)
        // ==========================================

        let cheeseAST: SDFNode = new SDFBox(2, 2, 2);

        // Hollow out the exact center
        cheeseAST = cheeseAST.subtract(new SDFSphere(1.1));

        // Punch holes in the corners
        cheeseAST = cheeseAST.subtract(new SDFSphere(0.7).translate([1, 1, 1]));
        cheeseAST = cheeseAST.subtract(new SDFSphere(0.7).translate([-1, -1, 1]));
        cheeseAST = cheeseAST.subtract(new SDFSphere(0.7).translate([1, -1, -1]));
        cheeseAST = cheeseAST.subtract(new SDFSphere(0.7).translate([-1, 1, -1]));

        this.cheeseCube = new SDFEntity3D(cheeseAST, { padding: 0.1 });
        this.cheeseCube.transform.position = new Vec3(0, 0, 0);

        // Give it a brushed gold PBR material
        this.cheeseCube.material.color = new Color(1.0, 0.8, 0.2, 1.0).rgba;
        this.cheeseCube.material.roughness = 0.3;
        this.cheeseCube.material.metallic = 1.0;
        this.add(this.cheeseCube);


        // ==========================================
        // OBJECT 3: The Core Capsule (Intersections & Smooth Subtractions)
        // ==========================================

        // Start with a tall cylinder
        let coreAST: SDFNode = new SDFCylinder(1.0, 2.5);

        // Intersect it with a Box to flatten the rounded sides
        coreAST = coreAST.intersect(new SDFBox(1.5, 3.0, 1.5), 0.2); // 0.2 smooth intersection rounds the cuts

        // Smoothly subtract a ring from the middle
        coreAST = coreAST.subtract(new SDFCylinder(1.2, 0.5).translate([0, 0, 0]), 0.3);

        // Add a floating glowing core in the middle
        let glowingCore = new SDFSphere(0.4);
        coreAST = coreAST.union(glowingCore); // Note: Strict union keeps them as one mesh but separate bodies

        this.coreCapsule = new SDFEntity3D(coreAST, { padding: 0.4 });
        this.coreCapsule.transform.position = new Vec3(3.5, 0, 0);

        // Give it a dark, glossy, slightly glowing material
        this.coreCapsule.material.color = new Color(0.1, 0.1, 0.1, 1.0).rgba;
        this.coreCapsule.material.roughness = 0.1;
        this.coreCapsule.material.metallic = 0.8;

        // Global emissive glow (SDFs share 1 material by default unless split into multiple SDFEntities)
        this.coreCapsule.material.emColor = new Color(1.0, 0.2, 0.4, 1.0).rgba;
        this.coreCapsule.material.emStrength = 0.5;
        this.add(this.coreCapsule);


        // ==========================================
        // ANIMATION LOOP
        // ==========================================

        // Continously rotate all 3 objects using the engine's built-in standard Transform module
        // This proves that the static WGSL AST respects dynamic world-space transformations!
        this.always(() => {
            const rotSpeed = this.dt * 0.001;

            // Orbiting liquid
            this.metaball.transform.rotateWorldY(rotSpeed);
            this.metaball.transform.rotateWorldX(rotSpeed * 0.5);

            // Tumbling cube
            this.cheeseCube.transform.rotateWorldY(-rotSpeed);
            this.cheeseCube.transform.rotateWorldZ(rotSpeed * 0.8);

            // Spinning capsule
            this.coreCapsule.transform.rotateWorldX(rotSpeed);

            // Invalidate to notify the engine that matrices have updated
            this.invalidate();
        });
    }
}
