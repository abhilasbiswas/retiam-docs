// =========================================================================
// File: examples/demos/tweaks/checkpoint_demo.ts
// Benchmark and Verification Demo for User Checkpoints in Retiam Engine
// =========================================================================

import {
    Scene,
    Vec3,
    Color,
    Tex,
    CENTER,
    Write,
    ThreeDAxes,
    ParametricSurface3D,
    TransformMatchingTex,
    OrbitCameraController,
    Rate
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class CheckpointBenchmarkScene extends Scene {
    public async run() {
        this.ALWAYS_UPDATE = true;
        this.clearColor(demoBackground());
        this.camera.position.set([0, 0, 30]);

        // =========================================================================
        // STAGE 1: Tex Title & Initial Equation Setup (0s - 3s)
        // =========================================================================
        console.log("[Checkpoint Demo] ---> Stage 1: Creating Title & Math Equation...");

        const title = new Tex("\\text{Checkpoint verification}", {
            fontSize: 4,
            anchor: CENTER,
            fill: Color.CYAN
        });
        title.setAsUI().move([0, 38, 0]);
        await this.play(new Write(title, { duration: 1200 }));

        const eq1 = new Tex("f(u, v) = \\sin(u) \\cdot \\cos(v)", {
            fontSize: 3.5,
            anchor: CENTER,
            fill: new Color(0.9, 0.6, 0.2, 1.0)
        });
        eq1.center();
        eq1.setAsUI();
        await this.play(new Write(eq1, { duration: 1500 }));

        // -------------------------------------------------------------------------
        // CHECKPOINT #1: Captures initial text equations at t = ~3.0s
        // -------------------------------------------------------------------------
        await this.saveState("stage1_title_ready");
        console.log(`[Checkpoint Demo] Saved Checkpoint #1 at t = ${this.time.toFixed(0)} ms`);


        // =========================================================================
        // STAGE 2: Heavy 3D Parametric Surface & 3D Grid Construction (3s - 8s)
        // =========================================================================
        console.log("[Checkpoint Demo] ---> Stage 2: Constructing 3D Axes & High-Res Parametric Surface...");

        // Keep the equation in a readable caption band as the world camera moves.
        eq1.move([0, -37, 0]);

        // Transition camera into 3D isometric view
        this.camera.position.set([14, 12, 18]);
        const target = new Vec3(0, 0, 0);
        const dir = target.sub(this.camera.position).normalize();
        this.camera.pitch = Math.asin(dir.y);
        this.camera.yaw = Math.atan2(-dir.x, -dir.z);

        new OrbitCameraController(this, this.camera);

        const axes = new ThreeDAxes({
            xRange: [-6, 6, 1],
            yRange: [-4, 4, 1],
            zRange: [-6, 6, 1],
            fill: new Color(0.8, 0.8, 0.8, 0.8),
            showGrid: true,
            gridColor: new Color(0.25, 0.3, 0.4, 0.4),
            gridPlanes: ['xy', 'xz', 'yz']
        });

        const surface = new ParametricSurface3D(
            (u, v) => {
                const y = Math.sin(u) * Math.cos(v) * 1.5;
                return new Vec3(u, y, v);
            },
            {
                shadingStyle: 'checkerboard',
                uRange: [-6, 6],
                vRange: [-6, 6],
                uSegments: 75, // High resolution vertex grid
                vSegments: 75,
                color1: new Color(1.0, 0.4, 0.1, 0.9), // Radiant Amber
                color2: new Color(0.1, 1.6, 1.0, 0.9), // Electric Cyan
                opacity: 0.85
            }
        );

        this.add(axes, surface);
        await this.wait(2000);

        // -------------------------------------------------------------------------
        // CHECKPOINT #2: Captures heavy 3D geometry + Orbit Camera at t = ~8.0s
        // -------------------------------------------------------------------------
        await this.saveState("stage2_surface_built");
        console.log(`[Checkpoint Demo] Saved Checkpoint #2 at t = ${this.time.toFixed(0)} ms`);


        // =========================================================================
        // STAGE 3: Equation Morphing & Long Timeline Wait (8s - 30s)
        // =========================================================================
        console.log("[Checkpoint Demo] ---> Stage 3: Morphing Equation & Simulating Long Timeline...");

        const eq2 = new Tex("z = 1.5 \\cdot \\sin(u) \\cdot \\cos(v)", {
            fontSize: 3.5,
            anchor: CENTER,
            fill: new Color(1.2, 0.9, 0.5, 1.0)
        });
        eq2.setAsUI().move([0, -37, 0]);

        await this.play(new TransformMatchingTex(eq1, eq2, {
            duration: 2000,
            rate_func: Rate.easeInOutCubic()
        }));

        // -------------------------------------------------------------------------
        // CHECKPOINT #3: Captures transformed equation + active 3D plot at t = ~12.0s
        // -------------------------------------------------------------------------
        await this.saveState("stage3_morphed");
        console.log(`[Checkpoint Demo] Saved Checkpoint #3 at t = ${this.time.toFixed(0)} ms`);

        // Long timeline wait simulation (18 seconds)
        console.log("[Checkpoint Demo] Holding scene for 18 seconds of timeline time...");
        await this.wait(18000);

        // -------------------------------------------------------------------------
        // CHECKPOINT #4: Captures state at t = ~30.0s
        // -------------------------------------------------------------------------
        await this.saveState("stage4_extended_hold");
        console.log(`[Checkpoint Demo] Saved Checkpoint #4 at t = ${this.time.toFixed(0)} ms`);

        console.log("[Checkpoint Demo] Scene complete up to t = 30s.");
    }
}
