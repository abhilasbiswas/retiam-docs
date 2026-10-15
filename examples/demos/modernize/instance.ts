import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene, OrbitCameraController, VectorField3D, Vec3
} from "retiam";

export default class TestScene extends Scene {
    public async run() {
        this.composer!.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 12, 48]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Instanced vector field", "A moving vortex rendered with repeated arrows");

        // 1. Create a 3D Vector Field
        // This utilizes the Instanced class, which generates a 3D Arrow Model and maps it 1000 times
        const vectorField = new VectorField3D((p: Vec3, time: number) => {
            // Cool twisting fluid vortex math
            return new Vec3(
                Math.sin(p.z * 0.5 + time),
                Math.cos(p.x * 0.5 + time) * 0.5,
                Math.cos(p.y * 0.5 + time)
            );
        }, {
            xRange: [-10, 10, 2],
            yRange: [-10, 10, 2],
            zRange: [-10, 10, 2],
            arrowScale: 0.5
        });

        this.add(vectorField);

        // 2. Animate the field continuously
        this.always(() => {
            vectorField.updateField(this.time * 0.002);
        });
    }
}
