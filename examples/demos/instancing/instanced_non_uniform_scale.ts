// =========================================================================
// File: examples/demos/instancing/instanced_non_uniform_scale.ts
// =========================================================================

import {
    Scene,
    OrbitCameraController,
    InteractionManager,
    Instanced,
    Model,
    Math3D,
    Vec3,
    Quaternion,
    Color,
    RaycastHit
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Instanced Non-Uniform 3D Scale & Anisotropic Deformations Showcase
 *
 * Demonstrates the 'extended' 16-float stride layout allowing independent
 * non-uniform 3D scaling (scaleX, scaleY, scaleZ) per instance.
 * A 3D anisotropic needle field dynamically stretches and points towards
 * an orbiting gravitational attractor or mouse pointer.
 */
export default class InstancedNonUniformScaleScene extends Scene {
    private instancedField!: Instanced;
    private readonly GRID_X = 24;
    private readonly GRID_Z = 24;
    private readonly SPACING = 1.6;

    public async run() {
        // 1. Sleek Obsidian Canvas & Camera
        this.clearColor(demoBackground());
        this.camera.position.set([0, 26, 32]);
        new OrbitCameraController(this, this.camera, { radius: 120 });
        new InteractionManager(this);

        // 2. Create template 3D unit cube (which will be stretched into needles and slabs)
        const template = new Model(Math3D.createCube(1.0));
        template.material.roughness = 0.3;
        template.material.metallic = 0.7;

        // 3. Create Instanced Entity using 'extended' layout (16-float stride)
        const totalCount = this.GRID_X * this.GRID_Z;
        this.instancedField = new Instanced(template, totalCount, {
            layout: 'extended'
        });
        this.add(this.instancedField);

        // 4. Initial grid layout
        const halfX = (this.GRID_X - 1) * this.SPACING * 0.5;
        const halfZ = (this.GRID_Z - 1) * this.SPACING * 0.5;

        for (let x = 0; x < this.GRID_X; x++) {
            for (let z = 0; z < this.GRID_Z; z++) {
                const idx = x * this.GRID_Z + z;
                const px = x * this.SPACING - halfX;
                const pz = z * this.SPACING - halfZ;

                this.instancedField.setInstancePosition(idx, new Vec3(px, 0, pz));
                this.instancedField.setInstanceRotation(idx, Quaternion.identity());
                // Non-uniform scale: thin needle along X and Z, taller along Y
                this.instancedField.setInstanceScale3D(idx, new Vec3(0.2, 1.0, 0.2));
                this.instancedField.setInstanceColor(idx, new Color(0.3, 0.6, 1.0, 0.85));
            }
        }
        this.instancedField.updateInstances();

        // 5. Dynamic Gravitational Attractor Position
        const attractorPos = new Vec3(0, 4, 0);
        const scratchScale = new Vec3();
        const UP = new Vec3(0, 1, 0);
        let userInteracting = false;
        let lastUserMove = 0;

        // Register pointer tracking using setEvent()
        this.instancedField.setEvent("pointermove", (_e: PointerEvent, hit: RaycastHit) => {
            if (hit && hit.point) {
                attractorPos.set(hit.point.x, hit.point.y + 4.0, hit.point.z);
                userInteracting = true;
                lastUserMove = performance.now();
            }
        });

        // 6. Attractor Simulation & Anisotropic Field Deformation
        this.always((time: number) => {
            const t = time * 0.0015;

            // If user hasn't moved recently, orbit attractor automatically in a Lissajous figure-8
            if (!userInteracting || performance.now() - lastUserMove > 3000) {
                userInteracting = false;
                attractorPos.x = Math.sin(t * 1.5) * 12.0;
                attractorPos.y = Math.sin(t * 3.0) * 3.5 + 4.0;
                attractorPos.z = Math.cos(t * 1.0) * 12.0;
            }

            for (let x = 0; x < this.GRID_X; x++) {
                for (let z = 0; z < this.GRID_Z; z++) {
                    const idx = x * this.GRID_Z + z;
                    const px = x * this.SPACING - halfX;
                    const pz = z * this.SPACING - halfZ;

                    const dx = attractorPos.x - px;
                    const dy = attractorPos.y;
                    const dz = attractorPos.z - pz;
                    const dist = Math.hypot(dx, dy, dz);

                    // Dynamic non-uniform stretching:
                    // Closer to attractor -> tall, elongated spikes; Further away -> flat wide slabs
                    const proximity = Math.max(0, 1.0 - dist / 22.0);
                    const spikeHeight = 0.5 + Math.pow(proximity, 2.5) * 8.0;
                    const thickness = 0.15 + (1.0 - proximity) * 0.45;

                    scratchScale.set(thickness, spikeHeight, thickness);
                    this.instancedField.setInstanceScale3D(idx, scratchScale);

                    // Orient towards attractor
                    const dir = new Vec3(dx, dy, dz).normalize();
                    const dot = UP.dot(dir);
                    let rot = Quaternion.identity();
                    if (dot > -0.999 && dot < 0.999) {
                        const axis = UP.cross(dir).normalize();
                        rot = Quaternion.fromAxisAngle(axis, Math.acos(dot));
                    }
                    this.instancedField.setInstanceRotation(idx, rot);

                    // Bioluminescent color spectrum based on proximity:
                    // Cold Blue (Distant) -> Violet -> Electric Orange / White (At Center)
                    const r = Math.min(1.0, proximity * 2.0);
                    const g = Math.min(1.0, Math.pow(proximity, 2.0) * 1.5);
                    const b = Math.max(0.2, 1.0 - proximity * 0.7);

                    this.instancedField.setInstanceColor(idx, new Color(r, g, b, 0.95));
                }
            }

            this.instancedField.updateInstances();
        });
    }
}
