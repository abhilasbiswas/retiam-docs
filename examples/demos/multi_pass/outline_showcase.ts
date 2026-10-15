import { CameraController, Color, Math3D, Model, OrbitCameraController, Scene, Vec3 } from "retiam";
import { demoBackground } from "../../shared/presentation";
import { OutlinePlugin } from "retiam";


export default class OutlineShowcase extends Scene {

    public async run() {
        // ---------------------------------------------------------
        // 1. REGISTER THE PLUGIN
        // ---------------------------------------------------------
        this.use(new OutlinePlugin({ thickness: 1.5 }));

        // ---------------------------------------------------------
        // 2. SCENE SETUP
        // ---------------------------------------------------------
        this.clearColor(demoBackground());
        this.camera.position.set([0, 18, 32]);
        const targetCenter = new Vec3(0, 1.5, 0);
        this.camera.lookAt(targetCenter);
        new OrbitCameraController(this, this.camera, { targetCenter, radius: 36 });

        // Add a floor
        const floor = new Model(Math3D.createCube(20));
        floor.transform.setScale([1.0, 0.05, 1.0]);
        floor.material.color = new Color(0.2, 0.8, 0.4, 1.0).rgba;
        this.add(floor);

        // Add some overlapping geometries to showcase the depth edge-detection
        const cube1 = new Model(Math3D.createCube(4));
        cube1.transform.position.set([-3, 2.05, 2]);
        cube1.material.color = Color.RED.rgba;

        const cube2 = new Model(Math3D.createCube(4));
        cube2.transform.position.set([2, 2.05, -2]);
        cube2.material.color = Color.CYAN.rgba;

        const sphere = new Model(Math3D.createSphere(2, 32, 32));
        sphere.transform.position.set([1, 2, 4]);
        sphere.material.color = Color.YELLOW.rgba;

        this.add(cube1, cube2, sphere);

        // Animate them to see the outlines update dynamically in screen space
        this.always(() => {
            cube1.transform.rotateWorldY(this.dt * 0.001);
            cube2.transform.rotateWorldX(this.dt * 0.002);
            this.invalidate(); // Keep render loop spinning
        });
    }
}
