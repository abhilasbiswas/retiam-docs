// =========================================================================
// File: examples/demos/instancing/instanced_staggered_animation.ts
// =========================================================================

import {
    Scene,
    OrbitCameraController,
    Instanced,
    Model,
    Math3D,
    Vec3,
    Quaternion,
    Color
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Instanced Staggered Animation & Spiral Cascade Showcase
 *
 * Demonstrates the built-in animateStaggered() API on Instanced entities.
 * 2,000 geometric elements cascade into existence in a golden ratio spiral
 * with overshoot spring easing, cascading color harmonies, and breathing waves.
 */
export default class InstancedStaggeredAnimationScene extends Scene {
    private instancedMandala!: Instanced;
    private readonly INSTANCE_COUNT = 2000;
    private readonly GOLDEN_ANGLE = 2.399963229728653; // ~137.508 degrees

    public async run() {
        // 1. Velvet obsidian background & Camera
        this.clearColor(demoBackground());
        this.camera.position.set([0, 32, 42]);
        new OrbitCameraController(this, this.camera, { radius: 140 });

        // 2. Create template 3D polyhedron / prism
        const template = new Model(Math3D.createCube(0.7));
        template.material.roughness = 0.25;
        template.material.metallic = 0.6;

        // 3. Create Instanced Entity
        this.instancedMandala = new Instanced(template, this.INSTANCE_COUNT);
        this.add(this.instancedMandala);

        // 4. Precompute Fibonacci Spiral Distribution
        interface SpiralNode {
            basePos: Vec3;
            baseRot: Quaternion;
            targetScale: number;
            color: Color;
            radius: number;
        }

        const nodes: SpiralNode[] = [];
        const SPREAD = 0.75;

        for (let i = 0; i < this.INSTANCE_COUNT; i++) {
            const r = SPREAD * Math.sqrt(i + 1);
            const theta = i * this.GOLDEN_ANGLE;
            const norm = i / this.INSTANCE_COUNT;

            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            const y = Math.sin(r * 0.3) * 1.5;

            const basePos = new Vec3(x, y, z);
            const baseRot = Quaternion.fromEuler(0, -theta, r * 0.1);
            const targetScale = 0.4 + Math.pow(norm, 0.35) * 0.6;

            // Bioluminescent Rainbow Palette
            const hue = (norm * 1.8) % 1.0;
            const cr = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5;
            const cg = Math.sin((hue + 0.33) * Math.PI * 2) * 0.5 + 0.5;
            const cb = Math.sin((hue + 0.66) * Math.PI * 2) * 0.5 + 0.5;
            const color = new Color(cr, cg, cb, 0.95);

            nodes.push({ basePos, baseRot, targetScale, color, radius: r });

            // Initialize scaled to zero before animation starts
            this.instancedMandala.setInstancePosition(i, basePos);
            this.instancedMandala.setInstanceRotation(i, baseRot);
            this.instancedMandala.setInstanceScale(i, 0.0);
            this.instancedMandala.setInstanceColor(i, color);
        }
        this.instancedMandala.updateInstances();

        // 5. Staggered Overshoot Spring Easing
        const springOvershoot = (t: number): number => {
            if (t <= 0) return 0;
            if (t >= 1) return 1;
            const s = 1.70158;
            t = t - 1;
            return t * t * ((s + 1) * t + s) + 1;
        };

        // 6. Launch Built-In Staggered Cascade Entrance
        let entranceFinished = false;
        this.instancedMandala.animateStaggered(this, {
            duration: 0.8,
            delayPerInstance: 0.0012, // Cascades outward along the golden spiral
            easing: springOvershoot,
            onUpdate: (idx, progress) => {
                const node = nodes[idx];
                this.instancedMandala.setInstanceScale(idx, node.targetScale * progress);
            },
            onComplete: () => {
                entranceFinished = true;
            }
        });

        // 7. Continuous Living Wave Loop
        const tempPos = new Vec3();
        this.always((time) => {
            if (!entranceFinished) return;
            const t = time * 0.0015;

            for (let i = 0; i < this.INSTANCE_COUNT; i++) {
                const node = nodes[i];
                const wave = Math.sin(t * 2.5 - node.radius * 0.35);
                const harmonic = Math.cos(t * 1.8 + i * 0.02);

                tempPos.set(
                    node.basePos.x,
                    node.basePos.y + wave * 1.8 + harmonic * 0.5,
                    node.basePos.z
                );
                this.instancedMandala.setInstancePosition(i, tempPos);

                const pulseScale = node.targetScale * (1.0 + wave * 0.22);
                this.instancedMandala.setInstanceScale(i, pulseScale);

                const rot = Quaternion.fromEuler(
                    wave * 0.4,
                    -i * this.GOLDEN_ANGLE + t * 0.2,
                    harmonic * 0.3
                );
                this.instancedMandala.setInstanceRotation(i, rot);
            }
            this.instancedMandala.updateInstances();
        });
    }
}
