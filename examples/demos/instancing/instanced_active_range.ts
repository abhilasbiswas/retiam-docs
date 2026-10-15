// =========================================================================
// File: examples/demos/instancing/instanced_active_range.ts
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

interface Particle {
    pos: Vec3;
    vel: Vec3;
    rot: Quaternion;
    rotSpeed: Vec3;
    scale: number;
    life: number;
    maxLife: number;
    color: Color;
}

/**
 * Instanced Active Range & Particle Pool Showcase
 *
 * Demonstrates how activeCount and firstInstance allow dynamic spawning,
 * ring-buffering, and recycling of thousands of particles within a fixed pre-allocated
 * GPU storage buffer with ZERO runtime buffer reallocation.
 */
export default class InstancedActiveRangeScene extends Scene {
    private readonly MAX_POOL = 3000;
    private particles: Particle[] = [];
    private instancedParticles!: Instanced;
    private spawnIndex = 0;
    private currentActive = 0;

    public async run() {
        // 1. Dark aesthetic background & Camera
        this.clearColor(demoBackground());
        this.camera.position.set([0, 15, 45]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 8, 0), radius: 150 });

        // 2. Create template 3D Diamond / Octahedron-like mesh
        const template = new Model(Math3D.createCube(0.6));
        template.material.roughness = 0.2;
        template.material.metallic = 0.8;

        // 3. Create Instanced Entity with pool capacity
        this.instancedParticles = new Instanced(template, this.MAX_POOL, {
            activeCount: 0,
            firstInstance: 0
        });
        this.add(this.instancedParticles);

        // 4. Initialize CPU particle state array
        for (let i = 0; i < this.MAX_POOL; i++) {
            this.particles.push({
                pos: new Vec3(0, 0, 0),
                vel: new Vec3(0, 0, 0),
                rot: Quaternion.identity(),
                rotSpeed: new Vec3(0, 0, 0),
                scale: 1.0,
                life: 0,
                maxLife: 1.0,
                color: new Color(1, 1, 1, 1)
            });
            this.instancedParticles.setInstanceScale(i, 0);
        }
        this.instancedParticles.updateInstances();

        // 5. Spawning helper
        const spawnBurst = (count: number, time: number) => {
            for (let k = 0; k < count; k++) {
                const idx = this.spawnIndex;
                this.spawnIndex = (this.spawnIndex + 1) % this.MAX_POOL;
                if (this.currentActive < this.MAX_POOL) {
                    this.currentActive++;
                }

                const p = this.particles[idx];
                p.pos.set(0, 0, 0);

                // Cone fountain velocity
                const angle = Math.random() * Math.PI * 2;
                const speed = 8.0 + Math.random() * 10.0;
                const spread = 0.35 + Math.random() * 0.45;
                p.vel.set(
                    Math.cos(angle) * speed * spread,
                    12.0 + Math.random() * 8.0,
                    Math.sin(angle) * speed * spread
                );

                p.rotSpeed.set(
                    (Math.random() - 0.5) * 6.0,
                    (Math.random() - 0.5) * 6.0,
                    (Math.random() - 0.5) * 6.0
                );

                p.maxLife = 2.5 + Math.random() * 1.5;
                p.life = p.maxLife;
                p.scale = 0.5 + Math.random() * 0.8;

                // Bioluminescent Neon palette: Orange -> Hot Pink -> Cyan -> Gold
                const hueShift = (time * 0.2 + Math.random() * 0.3) % 1.0;
                const r = Math.sin(hueShift * Math.PI * 2) * 0.5 + 0.5;
                const g = Math.sin((hueShift + 0.33) * Math.PI * 2) * 0.5 + 0.5;
                const b = Math.sin((hueShift + 0.66) * Math.PI * 2) * 0.5 + 0.5;
                p.color.r = r * 0.8 + 0.2;
                p.color.g = g * 0.8 + 0.2;
                p.color.b = b * 0.8 + 0.2;
                p.color.a = 1.0;
            }
        };

        // 6. Simulation & Render Loop
        const GRAVITY = -9.8;
        let lastTime = 0;

        this.always((time: number, dt: number) => {
            const t = time * 0.001;
            const delta = Math.min(dt || 0.016, 0.05);

            // Spawn fountain particles continuously
            spawnBurst(15, t);

            // Update active particle pool
            let activeAlive = 0;
            for (let i = 0; i < this.MAX_POOL; i++) {
                const p = this.particles[i];
                if (p.life <= 0) {
                    this.instancedParticles.setInstanceScale(i, 0);
                    continue;
                }

                p.life -= delta;
                activeAlive++;

                // Physics update
                p.vel.y += GRAVITY * delta;
                p.pos.x += p.vel.x * delta;
                p.pos.y += p.vel.y * delta;
                p.pos.z += p.vel.z * delta;

                // Floor bounce
                if (p.pos.y < 0) {
                    p.pos.y = 0;
                    p.vel.y = -p.vel.y * 0.45;
                    p.vel.x *= 0.85;
                    p.vel.z *= 0.85;
                }

                // Rotation
                const rotDelta = Quaternion.fromEuler(
                    p.rotSpeed.x * delta,
                    p.rotSpeed.y * delta,
                    p.rotSpeed.z * delta
                );
                p.rot.mul(rotDelta, p.rot);

                // Scale fade out
                const lifeNorm = Math.max(0, p.life / p.maxLife);
                const currentScale = p.scale * Math.sin(lifeNorm * Math.PI * 0.5);

                p.color.a = lifeNorm;

                this.instancedParticles.setInstancePosition(i, p.pos);
                this.instancedParticles.setInstanceRotation(i, p.rot);
                this.instancedParticles.setInstanceScale(i, currentScale);
                this.instancedParticles.setInstanceColor(i, p.color);
            }

            // Dynamic Active Range: only dispatch draw calls for active particles
            this.instancedParticles.activeCount = this.currentActive;
            this.instancedParticles.firstInstance = 0;
            this.instancedParticles.updateInstances();
        });
    }
}
