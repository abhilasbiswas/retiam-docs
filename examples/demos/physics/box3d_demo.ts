import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/physics/box3d_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    Vec3,
    Box,
    Sphere,
    Cylinder,
    OrbitCameraController,
    hex
} from "retiam";
import { Physics3D } from "retiam/physics";

export default class Box3DScene extends Scene {
    private physics!: Physics3D;

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.timeScale = 1.0;

        // 1. Camera positioning
        this.camera.position.set([0, 18, 38]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 6, 0) });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A three-dimensional physics arena", "Falling bodies interact with ramps and obstacles");

        // 2. Initialize Physics3D with Box3D WebAssembly Backend
        this.physics = new Physics3D(this, {
            backend: 'box3d',
            gravity: [0, -20, 0],
            timeStep: 1 / 60,
            maxSubSteps: 4
        });
        await this.physics.ready();

        // 3. Create static ground
        this.createGround();

        // 4. Create domino pyramid / stacked structure (showcasing Box3D iterative solver stability)
        this.createDominoTower();

        // 5. Create bouncing spheres with high bounciness
        this.createBouncingSpheres();

        // 6. Create a rotating kinematic paddle
        const paddle = this.createRotatingPaddle();

        // Rotate kinematic paddle continuously
        let angle = 0;
        this.always((time, dt) => {
            angle += dt * 0.0015;
            paddle.transform.setRotationY(angle);
        });

        // 7. Fire wrecking projectile after short delay
        await this.wait(1200);
        this.fireProjectile();
    }

    private createGround(): void {
        const ground = new Box(60, 1, 60, {
            materialColor: hex("#1E293B"),
            roughness: 0.3,
            metallic: 0.2
        });
        ground.transform.position = new Vec3(0, -0.5, 0);
        this.physics.add(ground, 'static');

        // Border rails
        const railColor = hex("#334155");
        const backRail = new Box(60, 2, 1, { materialColor: railColor });
        backRail.transform.position = new Vec3(0, 0.5, -29.5);
        this.physics.add(backRail, 'static');
    }

    private createDominoTower(): void {
        const towerLevels = 5;
        const boxWidth = 1.4;
        const boxHeight = 1.8;
        const boxDepth = 1.4;

        const colors = [
            hex("#38BDF8"), // Sky blue
            hex("#818CF8"), // Indigo
            hex("#C084FC"), // Purple
            hex("#F472B6"), // Pink
            hex("#FB7185"), // Rose
        ];

        for (let level = 0; level < towerLevels; level++) {
            const count = towerLevels - level;
            const startX = -((count - 1) * (boxWidth + 0.3)) / 2;
            const y = (boxHeight / 2) + level * (boxHeight + 0.05);

            for (let i = 0; i < count; i++) {
                const x = startX + i * (boxWidth + 0.3);
                const color = colors[level % colors.length];

                const box = new Box(boxWidth, boxHeight, boxDepth, {
                    materialColor: color,
                    roughness: 0.25,
                    metallic: 0.1
                });
                box.transform.position = new Vec3(x, y, 0);

                this.physics.add(box, {
                    type: 'dynamic',
                    mass: 3,
                    friction: 0.6,
                    restitution: 0.1,
                    linearDamping: 0.05,
                    angularDamping: 0.05
                });
            }
        }
    }

    private createBouncingSpheres(): void {
        const sphereRadius = 1.0;
        const colors = [hex("#4ADE80"), hex("#FACC15"), hex("#FB923C")];

        for (let i = 0; i < 3; i++) {
            const sphere = new Sphere(sphereRadius, {
                widthSegments: 32,
                heightSegments: 16,
                materialColor: colors[i],
                roughness: 0.15,
                metallic: 0.3
            });
            sphere.transform.position = new Vec3(-8 + i * 8, 14 + i * 2, -6);

            this.physics.add(sphere, {
                shape: 'sphere',
                radius: sphereRadius,
                type: 'dynamic',
                mass: 2,
                friction: 0.2,
                restitution: 0.85 // High bounce
            });
        }
    }

    private createRotatingPaddle(): Box {
        const paddle = new Box(12, 1.8, 1.4, {
            materialColor: hex("#EF4444"),
            roughness: 0.2,
            metallic: 0.6
        });
        paddle.transform.position = new Vec3(0, 0.95, 10);
        this.physics.add(paddle, {
            type: 'kinematic',
            friction: 0.8,
            ccd: true
        });
        return paddle;
    }

    private fireProjectile(): void {
        const radius = 2.0;
        const projectile = new Sphere(radius, {
            widthSegments: 48,
            heightSegments: 24,
            materialColor: hex("#F59E0B"), // Amber gold
            roughness: 0.1,
            metallic: 0.9
        });
        projectile.transform.position = new Vec3(0, 5, 24);

        this.physics.add(projectile, {
            shape: 'sphere',
            radius,
            type: 'dynamic',
            mass: 60,
            velocity: [0, 1.5, -45],
            ccd: true
        });
    }
}
