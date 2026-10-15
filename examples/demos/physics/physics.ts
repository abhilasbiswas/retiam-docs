import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, Color, Vec3, Box, OrbitCameraController } from "retiam";
import { Physics3D } from "retiam/physics";

export default class PhysicsScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 2;
        this.camera.position.set([0, 10, 30]);

        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Falling rigid bodies", "Gravity, rotation and contact on a static floor");

        // 1. Initialize Physics3D (automatically manages Rapier3D World & render loop stepping)
        const physics = new Physics3D(this, { gravity: [0, -9.82, 0] });

        // 2. Create a static ground box (auto-added to Scene & Physics)
        const ground = new Box(50, 0.1, 50, {
            materialColor: new Color(0.10, 0.14, 0.21, 1.0)
        });
        ground.transform.position = new Vec3(0, -0.05, 0);
        physics.add(ground, 'static');

        // 3. Create falling boxes
        for (let i = 0; i < 15; i++) {
            const box = new Box(2, 2, 2, {
                materialColor: new Color(0.2 + Math.random() * 0.6, 0.5, 1.0, 1.0)
            });
            box.transform.position = new Vec3(Math.random() * 4 - 2, 10 + i * 2.5, Math.random() * 4 - 2);
            box.transform.setRotationY(Math.random() * Math.PI);
            physics.add(box, { type: 'dynamic', mass: 1, restitution: 0.3 });
        }
    }
}
