import { demoBackground, demoCaption } from "../../shared/presentation";


import {
    Box,
    CameraDollyZoom,
    CameraLookAt,
    CameraOrbit,
    Color,
    MathShape3D,
    OrbitCameraController,
    Rate,
    Scene,
    Sphere,
    Vec3,
} from "retiam";

export default class CameraDemoScene extends Scene {

    public async run() {
        // ==========================================
        // 1. INITIAL CAMERA SETTINGS
        // ==========================================
        // Start high, wide, and angled down to see the entire grid room
        this.camera.position.set([30, 20, 60]);
        this.camera.transform.setRotation(new Vec3(-0.3, 0.4, 0));
        this.camera.fov = 45 * Math.PI / 180;
        this.clearColor(demoBackground());
        demoCaption(this, "Cinematic camera moves", "Dolly · look-at · orbit · dolly zoom"); // Standard 45deg lens

        // ==========================================
        // 2. CREATING THE HOLOGRAPHIC ENVIRONMENT
        // ==========================================

        // A. The central glowing Quantum Core (Sphere)
        const core = MathShape3D.Sphere(4.5, 8, {
            fill: new Color(1.0, 0.05, 0.4, 0.15), // Translucent Neon Pink
            stroke: new Color(1.0, 0.1, 0.5, 1.0),
            strokeWidth: 0.05
        });
        this.add(core);

        // B. An outer planetary ring structure (Torus)
        const outerRing = MathShape3D.Torus(14.0, 1.0, 6, 24, {
            fill: new Color(0.0, 0.8, 1.0, 0.05), // Translucent Cyan
            stroke: new Color(0.0, 0.8, 1.0, 0.7),
            strokeWidth: 0.03
        });
        // Tilt the ring for dynamic composition
        outerRing.transform.setRotationX(Math.PI / 6);
        this.add(outerRing);

        // C. A side satellite "Battery" (Box)
        const satellite = MathShape3D.Box(4, 4, 4, {
            fill: new Color(1.0, 0.8, 0.0, 0.1), // Translucent Gold
            stroke: new Color(1.0, 0.8, 0.0, 0.9),
            strokeWidth: 0.04
        });
        satellite.transform.position = new Vec3(-22, 4, 15);
        this.add(satellite);

        // D. Outward corner columns for spatial reference (No visual blocking!)
        const columnCoords = [
            [35, 35], [-35, 35], [35, -35], [-35, -35]
        ];
        for (const coord of columnCoords) {
            const pillar = MathShape3D.Cylinder(1.5, 1.5, 45, 4, {
                fill: new Color(0.2, 0.2, 0.2, 0.05),
                stroke: new Color(0.5, 0.5, 0.5, 0.4),
                strokeWidth: 0.02
            });
            pillar.transform.position = new Vec3(coord[0], 15, coord[1]);
            this.add(pillar);
        }

        // Keep the holographic items slowly spinning
        this.always(() => {
            core.transform.rotateWorldY(this.dt * 0.0008);
            outerRing.transform.rotateWorldY(-this.dt * 0.0003);
            satellite.transform.rotateWorldX(this.dt * 0.001);
            satellite.transform.rotateWorldY(this.dt * 0.0015);
            this.invalidate();
        });

        await this.wait(1000);

        // ==========================================
        // ACT 1: Cinematic Reveal (Animator Proxy)
        // ==========================================
        console.log("Act 1: Pushing Camera In");

        // Dolly close into the action area
        await this.play(
            this.camera.animate.move([0, 10, 32]).setRotation(new Vec3(-0.1, 0, 0)),
            { duration: 2500, rate_func: Rate.easeInOutCubic() }
        );
        await this.wait(500);

        // ==========================================
        // ACT 2: Smooth Look-At Target
        // ==========================================
        console.log("Act 2: Looking at Satellite");

        // Pan seamlessly to examine the golden satellite box on the left
        await this.play(
            new CameraLookAt(this.camera, satellite, { duration: 1500, rate_func: Rate.easeInOutCubic() })
        );
        await this.wait(1000);

        // Pan smoothly back to lock onto the central core
        await this.play(
            new CameraLookAt(this.camera, core, { duration: 1500, rate_func: Rate.easeInOutSine() })
        );
        await this.wait(500);

        // ==========================================
        // ACT 3: Hemispherical Orbit
        // ==========================================
        console.log("Act 3: Sweeping Around the Core");

        // Orbit the camera 180 degrees around the core.
        // Watch the outer Cyan Torus and columns slide across the background.
        await this.play(
            new CameraOrbit(this.camera, core, Math.PI, { duration: 4000, rate_func: Rate.easeInOutCubic() })
        );
        await this.wait(500);

        // ==========================================
        // ACT 4: Perfect Dolly Zoom (Vertigo Effect)
        // ==========================================
        console.log("Act 4: Dolly Zoom");

        // Crash-zoom the FOV from 45 degrees down to 10 degrees.
        // The background columns will dramatically expand and squeeze close,
        // while the pink Core stays exactly centered and sized!
        await this.play(
            new CameraDollyZoom(this.camera, core, 10 * Math.PI / 180, { duration: 3500, rate_func: Rate.easeInOutExpo() })
        );
        await this.wait(1000);

        // Push the Dolly Zoom back out to an ultra-wide 85-degree lens
        await this.play(
            new CameraDollyZoom(this.camera, core, 85 * Math.PI / 180, { duration: 3000, rate_func: Rate.easeInOutSine() })
        );
        await this.wait(500);

        // Return to standard 45-degree lens
        await this.play(
            new CameraDollyZoom(this.camera, core, 45 * Math.PI / 180, { duration: 1500, rate_func: Rate.easeOutQuad() })
        );

        // ==========================================
        // ACT 5: Hand over to Orbit Controller
        // ==========================================
        console.log("Act 5: Active Free-Roam");

        const currentDistance = this.camera.position.sub(core.transform.position).length();
        new OrbitCameraController(this, this.camera, { targetCenter: core.transform.position, radius: currentDistance });
    }
}
