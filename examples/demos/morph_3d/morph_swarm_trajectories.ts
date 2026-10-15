import { Scene } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { OrbitCameraController } from "retiam";
import { Torus } from "retiam";
import { Sphere } from "retiam";
import { Box } from "retiam";
import { Morph } from "retiam";
import { MorphMode, SwarmTrajectory } from "retiam";
import { Rate } from "retiam";
import { SDFText, CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class SwarmTrajectoriesDemoScene extends Scene {
    public async run() {
        // 1. Setup Camera & Viewport
        this.camera.position.set([0, 8, 45]);
        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. HUD Annotations
        const title = new SDFText("Swarm Trajectories Showcase", { fontSize: 3.2, anchor: CENTER });
        title.paint.fill = new Color(0.3, 0.85, 1.0, 0.95);
        title.paint.stroke = new Color(0.0, 0.4, 0.8, 0.6);
        title.paint.strokeWidth = 0;
        title.setAsUI().move([0, 42, 0]);
        this.add(title);

        const subtitle = new SDFText("Visualizing the 4 mathematical flight paths of GPU Gaussian Splat particles", { fontSize: 1.6, anchor: CENTER });
        subtitle.paint.fill = new Color(0.7, 0.8, 0.95, 0.8);
        subtitle.setAsUI().move([0, 36, 0]);
        this.add(subtitle);

        // Dynamic trajectory status badge
        const modeBadge = new SDFText("Trajectory: SPIRAL (Helical Flocking Vortex)", { fontSize: 1.6, anchor: CENTER });
        modeBadge.paint.fill = new Color(1.0, 0.85, 0.2, 0.95);
        modeBadge.paint.stroke = new Color(0.6, 0.4, 0.0, 0.5);
        modeBadge.paint.strokeWidth = 0;
        modeBadge.setAsUI().move([0, 30, 0]);
        this.add(modeBadge);

        // 3. Define 3D Meshes
        const torus = new Torus(8.0, 2.5, { radialSegments: 32, tubularSegments: 64 });
        torus.material.color = new Color(0.1, 0.85, 1.0, 1.0);
        torus.material.metallic = 0.85;
        torus.material.roughness = 0.2;

        const sphere = new Sphere(9.0, { widthSegments: 64, heightSegments: 64 });
        sphere.material.color = new Color(1.0, 0.1, 0.55, 1.0);
        sphere.material.metallic = 0.5;
        sphere.material.roughness = 0.25;

        const cube = new Box(12.0, 12.0, 12.0);
        cube.material.color = new Color(0.2, 0.95, 0.45, 1.0);
        cube.material.metallic = 0.9;
        cube.material.roughness = 0.2;

        this.add(torus);

        // Slow spin
        this.always(() => {
            const rotY = this.dt * 0.0006;
            const rotX = this.dt * 0.00025;
            torus.transform.rotateWorldY(rotY);
            torus.transform.rotateWorldX(rotX);
            sphere.transform.rotateWorldY(rotY);
            sphere.transform.rotateWorldX(rotX);
            cube.transform.rotateWorldY(rotY);
            cube.transform.rotateWorldX(rotX);
            this.invalidate();
        });

        // 4. Trajectory Showcase Configurations
        const trajectoryDemos = [
            {
                traj: SwarmTrajectory.SPIRAL,
                label: "Trajectory: 1. SPIRAL (Helical Flocking Vortex)",
                color: new Color(1.0, 0.85, 0.2, 0.95),
                noiseStrength: 4.5,
                noiseFreq: 1.2
            },
            {
                traj: SwarmTrajectory.FLUID,
                label: "Trajectory: 2. FLUID (Aerodynamic Curling Vortices)",
                color: new Color(0.2, 0.9, 1.0, 0.95),
                noiseStrength: 5.5,
                noiseFreq: 1.5
            },
            {
                traj: SwarmTrajectory.SCATTER,
                label: "Trajectory: 3. SCATTER (Explosive Dispersion & Reassembly)",
                color: new Color(1.0, 0.25, 0.45, 0.95),
                noiseStrength: 6.0,
                noiseFreq: 0.9
            },
            {
                traj: SwarmTrajectory.LINEAR,
                label: "Trajectory: 4. LINEAR (Direct Geodesic Flight)",
                color: new Color(0.4, 0.95, 0.5, 0.95),
                noiseStrength: 0.0,
                noiseFreq: 1.0
            }
        ];

        // 5. Continuous Trajectory Loop
        let step = 0;
        while (true) {
            const info = trajectoryDemos[step % trajectoryDemos.length];
            modeBadge.paint.fill = info.color;
            this.invalidate();

            await this.wait(1200);

            // Forward morph: Torus -> Sphere
            await this.play(Morph(torus, sphere, {
                mode: MorphMode.SWARM,
                trajectory: info.traj,
                particleCount: 35000,
                particleSize: 0.18,
                noiseStrength: info.noiseStrength,
                noiseFrequency: info.noiseFreq,
                duration: 3200,
                rate_func: Rate.easeInOutCubic()
            }));

            await this.wait(1200);

            // Backward morph: Sphere -> Torus
            await this.play(Morph(sphere, torus, {
                mode: MorphMode.SWARM,
                trajectory: info.traj,
                particleCount: 35000,
                particleSize: 0.18,
                noiseStrength: info.noiseStrength,
                noiseFrequency: info.noiseFreq,
                duration: 3200,
                rate_func: Rate.easeInOutCubic()
            }));

            step++;
        }
    }
}
