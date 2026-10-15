// =========================================================================
// File: examples/demos/instancing/instanced_partial_streaming.ts
// =========================================================================

import {
    Scene,
    OrbitCameraController,
    Instanced,
    Model,
    Math3D,
    Vec3,
    Quaternion,
    Color,
    InteractionManager,
    RaycastHit
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Instanced Partial Buffer Streaming Benchmark Showcase
 *
 * Demonstrates high-density partial buffer updates on 40,000 instances.
 * Moving the mouse over the field generates localized shockwaves.
 * Instead of re-uploading all 480KB of instance data on every frame,
 * Retiam's dirty-range tracking streams only the affected byte sub-slice
 * via queue.writeBuffer(offset, dataSlice), minimizing PCIe memory bus traffic.
 */
export default class InstancedPartialStreamingScene extends Scene {
    private instancedSwarm!: Instanced;
    private readonly GRID_DIM = 200; // 200 x 200 = 40,000 instances!
    private readonly SPACING = 0.5;

    public async run() {
        // 1. Dark Void Background & Camera
        this.clearColor(demoBackground());
        this.camera.position.set([0, 55, 65]);
        new OrbitCameraController(this, this.camera, { radius: 160 });
        new InteractionManager(this);

        // 2. Create micro-cube template
        const template = new Model(Math3D.createCube(0.35));
        template.material.roughness = 0.4;
        template.material.metallic = 0.2;

        // 3. Create 40,000 instance grid
        const totalCount = this.GRID_DIM * this.GRID_DIM;
        this.instancedSwarm = new Instanced(template, totalCount, {
            hitRadius: 0.25
        });
        this.add(this.instancedSwarm);

        // 4. Initial layout
        const halfSpan = (this.GRID_DIM - 1) * this.SPACING * 0.5;
        const defaultColor = new Color(0.12, 0.25, 0.45, 0.7);

        for (let x = 0; x < this.GRID_DIM; x++) {
            for (let z = 0; z < this.GRID_DIM; z++) {
                const idx = x * this.GRID_DIM + z;
                const px = x * this.SPACING - halfSpan;
                const pz = z * this.SPACING - halfSpan;

                this.instancedSwarm.setInstancePosition(idx, new Vec3(px, 0, pz));
                this.instancedSwarm.setInstanceRotation(idx, Quaternion.identity());
                this.instancedSwarm.setInstanceScale(idx, 1.0);
                this.instancedSwarm.setInstanceColor(idx, defaultColor);
            }
        }
        this.instancedSwarm.updateInstances();

        // 5. Interactive Pulse Ripples
        interface Ripple {
            cx: number;
            cz: number;
            startTime: number;
            radius: number;
        }
        const ripples: Ripple[] = [];

        // Register pointermove on the entity using setEvent()
        this.instancedSwarm.setEvent("pointermove", (_e: PointerEvent, hit: RaycastHit) => {
            if (hit && hit.instanceId !== undefined) {
                const idx = hit.instanceId;
                const gx = Math.floor(idx / this.GRID_DIM);
                const gz = idx % this.GRID_DIM;
                ripples.push({
                    cx: gx,
                    cz: gz,
                    startTime: performance.now() * 0.001,
                    radius: 0
                });
                if (ripples.length > 5) ripples.shift();
            }
        });

        // 6. Localized dirty sub-range animation loop
        const activeColor = new Color(0.2, 0.9, 1.0, 1.0);
        const pos = new Vec3();

        this.always((time: number) => {
            const now = time * 0.001;

            // Auto-trigger periodic central pulses if idle
            if (ripples.length === 0) {
                ripples.push({
                    cx: Math.floor(this.GRID_DIM / 2 + Math.sin(now * 2) * 40),
                    cz: Math.floor(this.GRID_DIM / 2 + Math.cos(now * 1.5) * 40),
                    startTime: now,
                    radius: 0
                });
            }

            // Animate each active ripple over its local bounding neighborhood
            for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx--) {
                const rip = ripples[rIdx];
                const age = now - rip.startTime;
                if (age > 2.0) {
                    ripples.splice(rIdx, 1);
                    continue;
                }

                const currentRadius = age * 35.0;
                const minX = Math.max(0, Math.floor(rip.cx - currentRadius - 3));
                const maxX = Math.min(this.GRID_DIM - 1, Math.ceil(rip.cx + currentRadius + 3));
                const minZ = Math.max(0, Math.floor(rip.cz - currentRadius - 3));
                const maxZ = Math.min(this.GRID_DIM - 1, Math.ceil(rip.cz + currentRadius + 3));

                // Update only the bounded sub-range!
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const idx = x * this.GRID_DIM + z;
                        const dist = Math.hypot(x - rip.cx, z - rip.cz);
                        const wavePhase = (dist - currentRadius) * 0.6;

                        if (Math.abs(wavePhase) < Math.PI) {
                            const wave = (Math.cos(wavePhase) * 0.5 + 0.5) * Math.max(0, 1.0 - age / 2.0);
                            const px = x * this.SPACING - halfSpan;
                            const pz = z * this.SPACING - halfSpan;
                            const py = wave * 3.5;

                            pos.set(px, py, pz);
                            this.instancedSwarm.setInstancePosition(idx, pos);
                            this.instancedSwarm.setInstanceScale(idx, 1.0 + wave * 1.5);

                            // Luminous cyan / gold crest
                            activeColor.r = 0.15 + wave * 0.85;
                            activeColor.g = 0.35 + wave * 0.65;
                            activeColor.b = 0.75 + wave * 0.25;
                            activeColor.a = 0.7 + wave * 0.3;
                            this.instancedSwarm.setInstanceColor(idx, activeColor);
                        }
                    }
                }
            }

            this.instancedSwarm.updateInstances();
        });
    }
}
