import { Scene, Vec3, CameraController, Color, ThreeDAxes, ParametricSurface3D, Group, OrbitCameraController } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ParametricScene extends Scene {
    public async run() {
        // 1. Setup Camera (Isometric looking down at origin)
        this.camera.position.set([12, 10, 15]);
        const target = new Vec3(0, 0, 0);
        const dir = target.sub(this.camera.position).normalize();
        this.camera.pitch = Math.asin(dir.y);
        this.camera.yaw = Math.atan2(-dir.x, -dir.z);

        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark mode background

        // 2. Add 3D Axes with a visible Ground Grid!
        const axes = new ThreeDAxes({
            xRange: [-6, 6, 1],
            yRange: [-4, 4, 1],
            zRange: [-6, 6, 1],
            fill: new Color(0.9, 1.0, 0.9, 1.0),
            showGrid: true,
            gridColor: new Color(0.3, 0.3, 0.3, 0.5),
            gridPlanes: ['xy', 'xz', 'yz'] // Renders the floor grid
        });

        // 3. Create the Parametric Math Surface
        const surface = new ParametricSurface3D(
            (u, v) => {
                const r = Math.sqrt(u * u + v * v);
                const y = 3 * Math.exp(-0.15 * r * r); // A beautiful Gaussian bump
                return new Vec3(u, y, v);
            },
            {
                shadingStyle: 'checkerboard',
                uRange: [-6, 6],
                vRange: [-6, 6],
                uSegments: 60,   // High-res geometry
                vSegments: 60,
                color1: new Color(0.871, 0.09, 0.349, 1), // Deep Orange
                color2: new Color(0.169, 0.612, 0.169, 1), // Deep Blue
                opacity: 0.85
            }
        );

        // Group them so we can rotate both the axes and the surface together
        const plotGroup = new Group(axes, surface);
        this.add(axes, surface);

        await this.wait(1000);
        this.checkpoint();
        await this.wait(10000);

        // 4. Animate it! (Rotate entire scene + Liquid ripple effect)
        this.always(() => {
            //     const rotSpeed = this.dt * 0.0003;

            //     // Rotate the group smoothly
            //     plotGroup.entities.forEach(ent => {
            //         ent.transform.rotateWorldY(rotSpeed);
            //     });

            //     // Animate the math function dynamically!
            //     const time = this.time * 0.003;
            //     surface.updateFunction((u, v) => {
            //         const r = Math.sqrt(u * u + v * v);
            //         // Gaussian function multiplied by an outward moving cosine wave
            //         const y = 3 * Math.exp(-0.15 * r * r) * Math.cos(r - time);
            //         return new Vec3(u, y, v);
            //     });

            //     this.invalidate(); // Request redraw
        });
    }
}
