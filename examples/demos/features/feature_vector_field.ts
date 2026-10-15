import { Scene, Vec3, CameraController, Color, ThreeDAxes, VectorField3D, Group, CameraModel, Axes } from "retiam";
import { VectorField2D } from "retiam";
import { Text } from "retiam";
import { demoBackground } from "../../shared/presentation";

// --- 1. THE 3D MAGNETIC FIELD SCENE (Matches your 3D Reference Image) ---
class Magnetic3DScene extends Scene {
    public async run() {
        // Position camera to look down at the origin in a clear Isometric view
        this.camera.position.set([15, 12, 15]);
        const target = new Vec3(0, 0, 0);
        const dir = target.sub(this.camera.position).normalize();
        this.camera.pitch = Math.asin(dir.y);
        this.camera.yaw = Math.atan2(-dir.x, -dir.z);

        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark background

        // Add 3D Axes with grids on all 3 planes
        const axes = new ThreeDAxes({
            xRange: [-4, 4, 2],
            yRange: [-4, 4, 2],
            zRange: [-4, 4, 2],
            showGrid: true,
            gridPlanes: ['xy', 'xz', 'yz']
        });

        // Add the 3D Vector Field (Normalized Arrow Lengths)
        const vectorField = new VectorField3D(
            (p: Vec3, time: number) => {
                // Spinning magnetic dipoles
                const pole1 = new Vec3(Math.cos(time) * 3, Math.sin(time * 1.5) * 2, Math.sin(time) * 3);
                const pole2 = new Vec3(-Math.cos(time) * 3, -Math.sin(time * 1.5) * 2, -Math.sin(time) * 3);

                const r1 = p.sub(pole1);
                const r2 = p.sub(pole2);

                const field1 = r1.scale(1.0 / Math.pow(Math.max(r1.length(), 0.5), 3));
                const field2 = r2.scale(-1.0 / Math.pow(Math.max(r2.length(), 0.5), 3));

                return field1.add(field2).scale(4.0);
            },
            {
                xRange: [-5, 5, 1],
                yRange: [-5, 5, 1],
                zRange: [-5, 5, 1],
                normalize: true,     // <--- Forces all arrows to be exactly the same length!
                arrowScale: 0.75,    // <--- Length of the normalized arrows
                maxMagnitude: 3.0    // Maps color clamping
            }
        );

        const group = new Group(axes, vectorField);
        this.add(axes, vectorField);

        this.always(() => {
            // Rotate the entire grid slowly
            const rotSpeed = this.dt * 0.0001;
            group.entities.forEach(e => e.transform.rotateWorldY(rotSpeed));

            // Animate the vectors
            vectorField.updateField(this.time * 0.002);
            this.invalidate();
        });
    }
}

// --- 2. THE 2D FLUID SIMULATION SCENE (Matches your 2D Reference Image) ---
export default class Fluid2DScene extends Scene {
    public async run() {
        // Flat 2D Camera
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 14;
        this.camera.position.set([0, 0, 10]);
        this.clearColor(demoBackground());

        const axes = new Axes({
            xRange: [-7, 7, 1], yRange: [-4, 4, 1],
            width: 14, height: 8,
            axisColor: new Color(0.9, 0.9, 0.9, 1.0),
            gridColor: new Color(0.3, 0.3, 0.3, 0.4),
            showGrid: true
        });
        this.add(axes);

        const vectorField = new VectorField2D(
            axes,
            (x: number, y: number, time: number) => {
                // Swirling vortex + Moving waves
                const dx = -y + Math.sin(y * 1.5 - time) * 1.5;
                const dy = x + Math.cos(x * 1.5 + time) * 1.5;
                return [dx, dy];
            },
            {
                xStep: 0.5, yStep: 0.5,
                normalize: true,     // <--- All arrows same length
                arrowScale: 0.85,    // <--- Size relative to grid
                maxMagnitude: 6.0,
            }
        );
        this.add(vectorField);

        this.always(() => {
            vectorField.updateField(this.time * 0.002);
            this.invalidate();
        });
    }
}
