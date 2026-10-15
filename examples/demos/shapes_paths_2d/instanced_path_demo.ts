// =========================================================================
// File: examples/demos/shapes_paths_2d/instanced_path_demo.ts
// =========================================================================

import { Scene } from "retiam";
import { Path } from "retiam";
import { Instanced } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { Quaternion } from "retiam";
import { CameraController } from "retiam";
import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";

/**
 * 2D Instanced Vector Sacred Geometry (Fast Triangulated Uber-Shader)
 *
 * Showcases thousands of ornate vector lotus petals with simultaneous Fill & Stroke,
 * arranged in a living, breathing Fibonacci phyllotaxis mandala.
 * All 2,500 intricate vector shapes (5,000 total sub-passes) render in
 * EXACTLY 2 WebGPU draw calls with smooth 60+ FPS performance.
 */
export default class InstancedPathScene extends Scene {
    public async run() {
        // 1. 2D Camera setup & rich dark canvas background
        this.camera.position.set([0, 0, 110]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Deep obsidian night
        frameStage(this, 260, 260);
        demoCaption(this, "Instanced vector petals", "2,500 ornate paths form a changing mandala");

        // 2. Beautiful Ornate Sacred Lotus / Crystal Petal SVG
        // Multi-contour SVG: outer curved petal + inner jewel cutout + central diamond star
        const sacredPetalSvg = `
            M 0 -14
            C 4.5 -8, 10 -4, 13.5 0
            C 10 4, 4.5 8, 0 14
            C -4.5 8, -10 4, -13.5 0
            C -10 -4, -4.5 -8, 0 -14
            Z
            M 0 -8
            C 2.5 -4.5, 5.5 -2, 7.5 0
            C 5.5 2, 2.5 4.5, 0 8
            C -2.5 4.5, -5.5 2, -7.5 0
            C -5.5 -2, -2.5 -4.5, 0 -8
            Z
            M 0 -3.2
            L 1.2 -1.2
            L 3.2 0
            L 1.2 1.2
            L 0 3.2
            L -1.2 1.2
            L -3.2 0
            L -1.2 -1.2
            Z
        `;

        // 3. Create the template Path using 'fast' CPU triangulation (2-draw-call uber-shader)
        const templatePath = new Path(sacredPetalSvg, {
            method: 'fast',
            extruder: 'cpu',
            fill: new Color(0.2, 0.7, 1.0, 0.65),
            stroke: new Color(0.9, 0.98, 1.0, 0.95),
            strokeWidth: 0.45
        });

        // 4. Create the Instanced Entity (2,500 vector petals)
        const INSTANCE_COUNT = 2500;
        const swarm = new Instanced(templatePath, INSTANCE_COUNT);
        this.add(swarm);

        // 5. Precompute Fibonacci Spiral Distribution
        // Golden Angle in radians: ~137.50776 degrees
        const GOLDEN_ANGLE = 2.399963229728653;
        const SPREAD = 1.65;

        interface PetalMetadata {
            baseRadius: number;
            baseAngle: number;
            scaleFactor: number;
            harmonicFreq: number;
            colorHue: number;
        }

        const petals: PetalMetadata[] = [];
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            const r = SPREAD * Math.sqrt(i + 1);
            const theta = i * GOLDEN_ANGLE;
            const normalizedDist = i / INSTANCE_COUNT;

            petals.push({
                baseRadius: r,
                baseAngle: theta,
                scaleFactor: 0.12 + Math.pow(normalizedDist, 0.45) * 0.18,
                harmonicFreq: 3.0 + (i % 7) * 0.5,
                colorHue: normalizedDist
            });
        }

        // Smooth HSL to RGB conversion for vibrant color spectrums
        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            const hue2rgb = (t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
        };

        const pos = new Vec3();

        // 6. Fluid 2D Animation Loop (Living Breathing Mandala)
        this.always(() => {
            const time = this.time * 0.001;

            for (let i = 0; i < INSTANCE_COUNT; i++) {
                const p = petals[i];

                // 2D Breathing radial wave dynamics
                const wave = Math.sin(time * 1.8 - p.baseRadius * 0.12);
                const harmonic = Math.cos(time * 2.5 + p.baseAngle * 4.0);
                const r = p.baseRadius * (1.0 + 0.08 * wave + 0.04 * harmonic);

                // Swirling vortex angle
                const swirl = p.baseAngle + time * 0.18 + (p.baseRadius * 0.015) * Math.sin(time * 0.6);

                // 2D screen positions
                const x = r * Math.cos(swirl);
                const y = r * Math.sin(swirl);
                pos.set(x, y, 0);
                swarm.setInstancePosition(i, pos);

                // 2D Tangential & Ripple Rotation
                const petalRotation = swirl + Math.PI * 0.5 + wave * 0.35 + Math.sin(time * 3.0 + p.baseRadius * 0.2) * 0.2;
                const rot = Quaternion.fromEuler(0, 0, petalRotation);
                swarm.setInstanceRotation(i, rot);

                // Pulsating Organic Scale
                const pulse = 1.0 + 0.22 * Math.sin(time * 2.2 + p.baseRadius * 0.15 + p.harmonicFreq);
                swarm.setInstanceScale(i, p.scaleFactor * pulse);

                // Luminous Bioluminescent Gradient Shift:
                // Electric Cyan (0.52) -> Neon Violet (0.78) -> Hot Magenta (0.92) -> Solar Gold (0.12)
                const hue = (0.52 + p.colorHue * 0.65 + time * 0.06) % 1.0;
                const sat = 0.88 + 0.12 * Math.sin(time + p.baseRadius * 0.05);
                const light = 0.55 + 0.15 * Math.cos(time * 1.5 + p.baseAngle);
                const [cr, cg, cb] = hslToRgb(hue, sat, light);

                // Translucent fill & glowing crisp stroke opacity
                const alpha = 0.60 + 0.30 * Math.sin(time * 1.2 + p.baseRadius * 0.1);
                swarm.setInstanceColor(i, new Color(cr, cg, cb, alpha));
            }

            swarm.isDirty = true;
            this.invalidate();
        });
    }
}
