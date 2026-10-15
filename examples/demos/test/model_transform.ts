import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, Color, CameraController, Vec2, JointType, Path, Mesh2D, Box, MorphMode, OrbitCameraController, Rate, Sphere, SwarmTrajectory, Torus, Vec3, ModelTransform } from "retiam";

export default class MorphExampleScene extends Scene {
    public async run() {
        // 1. Setup Camera and Lighting
        this.camera.position.set([0, 5, 25]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A cycle of solid morphs", "Cube → sphere → torus");

        // 2. Create the shapes we want to morph between

        // Shape A: A glossy pink Cube
        const cube = new Box(7, 7, 7);
        cube.material.color = new Color(1.0, 0.1, 0.5, 1.0);
        cube.material.roughness = 0.2;
        cube.material.metallic = 0.1;

        // Shape B: A glowing cyan Sphere
        const sphere = new Sphere(5, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(0.1, 0.8, 1.0, 1.0);
        sphere.material.emColor = new Color(0.1, 0.8, 1.0, 1.0);
        sphere.material.emStrength = 1.5;
        sphere.material.roughness = 0.4;

        // Shape C: A golden metallic Torus
        const torus = new Torus(4.5, 1.5, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(1.0, 0.8, 0.1, 1.0);
        torus.material.metallic = 0.9;
        torus.material.roughness = 0.15;

        // 3. Mount the initial shape to the scene
        this.add(cube);

        // 4. Set up a continuous rotation loop so we can view them from all angles
        this.always(() => {
            // We rotate all three shapes simultaneously so they remain physically aligned
            // during the crossfading transition in the ModelTransform
            const rotSpeed = this.dt * 0.001;
            cube.transform.rotateWorldY(rotSpeed);
            sphere.transform.rotateWorldY(rotSpeed);
            torus.transform.rotateWorldY(rotSpeed);

            // Add a slight tilt
            cube.transform.rotateWorldX(rotSpeed * 0.5);
            sphere.transform.rotateWorldX(rotSpeed * 0.5);
            torus.transform.rotateWorldX(rotSpeed * 0.5);

            this.invalidate();
        });

        // 5. The Animation Loop
        while (true) {
            await this.wait(1500);

            // ---------------------------------------------------------
            // TRANSITION 1: SWARM (Particle Cloud Morph)
            // ---------------------------------------------------------
            // Dissolves the Cube into thousands of particles that flock
            // into the shape of the Sphere.
            await this.play(new ModelTransform(cube, sphere, {
                mode: MorphMode.SDF_VOLUMETRIC,
                duration: 3000,
                rate_func: Rate.easeInOutSine(),

                // SDF specific configurations
                sdfResolution: 48, // 48x48x48 voxel grid
            }));

            await this.wait(1500);

            // ---------------------------------------------------------
            // TRANSITION 2: SDF VOLUMETRIC (Liquid Metal Morph)
            // ---------------------------------------------------------
            // Uses Raymarching and Marching Cubes to melt the Sphere
            // fluidly into the Torus like liquid metal.
            await this.play(new ModelTransform(sphere, torus, {
                mode: MorphMode.SDF_VOLUMETRIC,
                duration: 3000,
                rate_func: Rate.easeInOutSine(),

                // SDF specific configurations
                sdfResolution: 48, // 48x48x48 voxel grid
            }));

            await this.wait(1500);

            // ---------------------------------------------------------
            // TRANSITION 3: SHRINK WRAP (Surface Projection Morph)
            // ---------------------------------------------------------
            // Casts rays from the Torus vertices to map them onto the
            // surface of the Cube, maintaining a solid, connected mesh.
            await this.play(new ModelTransform(torus, cube, {
                mode: MorphMode.SDF_VOLUMETRIC,
                duration: 3000,
                rate_func: Rate.easeInOutSine(),

                // SDF specific configurations
                sdfResolution: 48, // 48x48x48 voxel grid
            }));
        }
    }
}
