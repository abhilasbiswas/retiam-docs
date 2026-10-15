import { Scene, Vec3, CameraController, Color, ThreeDAxes, VectorField3D, Group, OrbitCameraController } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class VectorFieldScene extends Scene {
    public async run() {
        // 1. Setup Camera (Isometric looking down at origin)
        this.camera.position.set([12, 8, 18]);

        const target = new Vec3(0, 0, 0);
        const dir = target.sub(this.camera.position).normalize();
        this.camera.pitch = Math.asin(dir.y);
        this.camera.yaw = Math.atan2(-dir.x, -dir.z);

        new OrbitCameraController(this, this.camera, { radius: 20 });
        this.clearColor(demoBackground()); // Deep dark background

        // 2. Add 3D Axes with visible Grids
        const axes = new ThreeDAxes({
            xRange: [-6, 6, 2],
            yRange: [-6, 6, 2],
            zRange: [-6, 6, 2],
            fill: new Color(0.8, 0.8, 0.8, 1.0),
            showGrid: true,
            gridColor: new Color(0.3, 0.3, 0.3, 0.3),
            gridPlanes: ['xy', 'xz', 'yz'] // Render all three back-walls/floor
        });

        // 3. Create the 3D Vector Field
        // We will simulate a dynamic, orbiting magnetic dipole field
        const vectorField = new VectorField3D(
            (p: Vec3, time: number) => {
                // Orbiting magnetic poles
                const pole1 = new Vec3(Math.cos(time) * 3, Math.sin(time * 1.5) * 2, Math.sin(time) * 3);
                const pole2 = new Vec3(-Math.cos(time) * 3, -Math.sin(time * 1.5) * 2, -Math.sin(time) * 3);

                const r1 = p.sub(pole1);
                const r2 = p.sub(pole2);

                const dist1 = Math.max(r1.length(), 0.5);
                const dist2 = Math.max(r2.length(), 0.5);

                // Inverse square law for field strength
                const field1 = r1.scale(1.0 / (dist1 * dist1 * dist1));
                const field2 = r2.scale(-1.0 / (dist2 * dist2 * dist2));

                // Add a slight twisting curl force based on Y axis
                const curl = new Vec3(-p.z, 0, p.x).scale(0.05);

                return field1.add(field2).add(curl).scale(2.5);
            },
            {
                xRange: [-6, 6, 1.2],
                yRange: [-6, 6, 1.2],
                zRange: [-6, 6, 1.2],
                maxMagnitude: 4.0,   // Cap length of vectors near the poles
                arrowScale: 0.45,    // General thickness/size of the arrows
                opacity: 0.9
            }
        );

        // Group them so we can rotate the entire graph easily
        const plotGroup = new Group(axes, vectorField);
        this.add(axes, vectorField);

        // 4. Animate it!
        this.always(() => {
            const rotSpeed = this.dt * 0.0002;

            // Slowly rotate the entire coordinate system
            plotGroup.entities.forEach(ent => {
                ent.transform.rotateWorldY(rotSpeed);
            });

            // Update the vector field math function using the elapsed scene time
            const time = this.time * 0.0015;
            vectorField.updateField(time);

            this.invalidate(); // Request redraw
        });
    }
}
