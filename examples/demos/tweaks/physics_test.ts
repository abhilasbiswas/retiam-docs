import { CENTER } from "retiam";
import { demoBackground, framePerspective } from "../../shared/presentation";
import { Scene, CameraController, Box, Color, SDFText, Vec3 } from "retiam";
import { Physics3D } from "retiam/physics";

export default class PhysicsStressTest extends Scene {
    private physics!: Physics3D;

    // Profiling & UI Elements
    private profilerLabel!: SDFText;
    private frameCounter: number = 0;
    private accumulatedPhysicsTime: number = 0;

    public async run() {
        this.camera.position.set([0, 40, 135]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);

        // 1. Setup the UI Profiler Label in the top-left corner
        this.profilerLabel = new SDFText("Physics (Rapier WASM): 0.00 ms", { anchor: CENTER, fontSize: 3.2 });
        this.profilerLabel.setAsUI();
        this.profilerLabel.transform.position = [0, 42, 0];
        this.add(this.profilerLabel);

        // 2. Setup Physics3D (manual stepping for exact profiling)
        this.physics = new Physics3D(this, {
            gravity: [0, -9.82, 0],
            autoStep: false,
        });

        // Ground Box
        const ground = new Box(50, 0.1, 50, {
            materialColor: new Color(0.2, 0.25, 0.3, 1.0),
        });
        ground.transform.position = new Vec3(0, 0, 0);
        this.physics.add(ground, 'static');

        const COUNT = 1000;

        // Spawn falling boxes
        for (let i = 0; i < COUNT; i++) {
            const size = 1.0;
            const box = new Box(size, size, size);
            box.material.color = Color.random();
            box.transform.position = new Vec3(
                (Math.random() - 0.5) * 20,
                8 + Math.floor(i / 25) * 1.9,
                (Math.random() - 0.5) * 20
            );
            this.physics.add(box, { type: 'dynamic', mass: 1.0 });
        }

        this.always(() => {
            // Measure the exact execution time of the physics solver step
            const t0 = performance.now();
            this.physics.step(1.0 / 60.0);
            const dtPhysics = performance.now() - t0;

            this.accumulatedPhysicsTime += dtPhysics;
            this.frameCounter++;

            if (this.frameCounter >= 10) {
                const avgPhysicsTime = this.accumulatedPhysicsTime / 10;
                this.profilerLabel.setText(`Physics (Rapier WASM): ${avgPhysicsTime.toFixed(2)} ms`);
                this.frameCounter = 0;
                this.accumulatedPhysicsTime = 0;
            }

            this.invalidate();
        });
    }
}
