import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Instanced, Model, Scene, CameraController, Color, Math3D, Vec3 } from "retiam";

export default class GarbageCollectionTest extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 150]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "100,000 moving instances", "A particle field updated with reused buffers");

        const COUNT = 100000;

        // Use a simple pyramid as a particle
        const baseMesh = Math3D.createCube(1.0);
        const template = new Model(baseMesh);
        template.material.roughness = 0.5;

        const swarm = new Instanced(template, COUNT);
        this.add(swarm);

        // Pre-allocate tracking arrays
        const positions = new Float32Array(COUNT * 3);
        const velocities = new Float32Array(COUNT * 3);
        const color = new Color(0, 0, 0, 1);

        for (let i = 0; i < COUNT; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

            swarm.setInstanceScale(i, 0.5);
        }

        // We use a pre-allocated Vec3 to pipe data directly into the instance setter
        // to avoid triggering `Vec3.cast` allocations inside the engine!
        const tempVec = new Vec3();

        this.always(() => {
            // Because our Math and Timing primitives no longer allocate,
            // this loop runs entirely using pre-allocated memory!
            for (let i = 0; i < COUNT; i++) {
                const ix = i * 3;
                positions[ix + 0] += velocities[ix + 0] * this.dt;
                positions[ix + 1] += velocities[ix + 1] * this.dt;
                positions[ix + 2] += velocities[ix + 2] * this.dt;

                tempVec.x = positions[ix + 0];
                tempVec.y = positions[ix + 1];
                tempVec.z = positions[ix + 2];

                swarm.setInstancePosition(i, tempVec);

                // Polling the color updates
                color.r = Math.abs(Math.sin(this.time * 0.001 + i));
                color.g = Math.abs(Math.cos(this.time * 0.002 + i));
                color.b = 1.0;

                // Color.getData() now safely returns a reference, not a new Array!
                swarm.setInstanceColor(i, color);
            }
            swarm.updateInstances();
            this.invalidate();
        });
    }
}
