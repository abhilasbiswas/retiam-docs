import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    Vec3,
    Box,
    Sphere,
    Cylinder,
    OrbitCameraController,
    Math3D,
    RenderConfig
} from "retiam";
import { Physics3D, RigidBodyComponent } from "retiam/physics";

/**
 * Curated radiant neon / electric palette for high-count particles
 */
const RAINBOW_PALETTE = [
    new Color(1.0, 0.15, 0.45, 1.0), // Neon Crimson/Pink
    new Color(1.0, 0.45, 0.1, 1.0),  // Vivid Orange
    new Color(1.0, 0.85, 0.1, 1.0),  // Electric Yellow
    new Color(0.1, 0.95, 0.5, 1.0),  // Mint Green
    new Color(0.05, 0.85, 1.0, 1.0), // Cyan Glow
    new Color(0.35, 0.45, 1.0, 1.0), // Royal Blue
    new Color(0.75, 0.25, 1.0, 1.0), // Electric Purple
    new Color(1.0, 0.3, 0.85, 1.0),  // Hot Magenta
];

export default class LargeScalePhysicsScene extends Scene {
    private physics!: Physics3D;
    private dynamicEntities: { entity: Sphere | Box; comp: RigidBodyComponent }[] = [];
    private maxBodies: number = 600;

    public async run() {
        this.ALWAYS_UPDATE = true;
        // this.renderConfig.raytraceEnabled = true;


        // 1. Camera positioning & Orbit controls
        this.camera.position.set([0, 24, 100]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 14, 0) });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A large-scale physics field", "Hundreds of bodies through a dense obstacle course");

        // 2. Initialize high-performance Physics3D
        this.physics = new Physics3D(this, {
            gravity: [0, -28, 0], // Snappy gravity for fast, satisfying cascades
            maxSubSteps: 3,
            timeStep: 1 / 60
        });

        // 3. Build the Massive Galton & Pachinko Multi-Tier Arena
        this.buildPachinkoTower();

        // 4. Batch spawn initial massive avalanche wave
        await this.spawnInitialBatch(120);

        // 5. Continuous multi-spout avalanche stream
        this.startAvalancheLoop();
    }

    /**
     * Builds a multi-tier vertical physics maze:
     * - Top: Dual funnel collectors
     * - Middle: 14 tiers of staggered static pegs (Pachinko field)
     * - Lower: Deflector ramps & dual spiral chutes
     * - Bottom: 13 vertical collector bins (Gaussian distribution)
     */
    private buildPachinkoTower() {
        // --- 1. Glass Enclosure Backdrop & Front Window ---
        const backdrop = new Box(36, 44, 1.2, {
            materialColor: new Color(0.06, 0.08, 0.14, 1.0),
            roughness: 0.2,
            metallic: 0.5
        });
        backdrop.transform.position = new Vec3(0, 18, -2.5);
        this.physics.add(backdrop, { type: 'static', friction: 0.1, restitution: 0.3 });

        const frontGlass = new Box(36, 44, 0.8, {
            materialColor: new Color(1.0, 1.0, 1.0, 1.0),
            roughness: 0.00,
            transmission: 0.99
        });
        frontGlass.transform.position = new Vec3(0, 18, 2.5);
        this.physics.add(frontGlass, { type: 'static', friction: 0.1, restitution: 0.3 });

        // Outer side walls
        const leftWall = new Box(1.0, 44, 5.0, {
            materialColor: new Color(0.12, 0.16, 0.25, 1.0),
            metallic: 0.4
        });
        leftWall.transform.position = new Vec3(-18, 18, 0);
        this.physics.add(leftWall, { type: 'static', friction: 0.2, restitution: 0.4 });

        const rightWall = new Box(1.0, 44, 5.0, {
            materialColor: new Color(0.12, 0.16, 0.25, 1.0),
            metallic: 0.4
        });
        rightWall.transform.position = new Vec3(18, 18, 0);
        this.physics.add(rightWall, { type: 'static', friction: 0.2, restitution: 0.4 });

        // --- 2. Top Funnel Guide Ramps ---
        const leftFunnel = new Box(14, 0.8, 4.5, {
            materialColor: new Color(0.2, 0.4, 0.8, 1.0),
            metallic: 0.6,
            roughness: 0.2
        });
        leftFunnel.transform.position = new Vec3(-10, 36, 0);
        leftFunnel.transform.setRotation([0, 0, -0.42]);
        this.physics.add(leftFunnel, { type: 'static', friction: 0.05, restitution: 0.6 });

        const rightFunnel = new Box(14, 0.8, 4.5, {
            materialColor: new Color(0.2, 0.4, 0.8, 1.0),
            metallic: 0.6,
            roughness: 0.2
        });
        rightFunnel.transform.position = new Vec3(10, 36, 0);
        rightFunnel.transform.setRotation([0, 0, 0.42]);
        this.physics.add(rightFunnel, { type: 'static', friction: 0.05, restitution: 0.6 });

        // --- 3. Multi-Tier Pachinko Peg Field (Staggered Hexagonal Lattice) ---
        const pegRows = 11;
        const startY = 31;
        const rowSpacing = 1.7;
        const colSpacing = 2.4;

        for (let row = 0; row < pegRows; row++) {
            const count = row + 3;
            const y = startY - row * rowSpacing;
            const startX = -((count - 1) * colSpacing) / 2;

            for (let col = 0; col < count; col++) {
                const x = startX + col * colSpacing;

                const peg = new Cylinder(0.32, 0.32, 4.2, {
                    radialSegments: 16,
                    heightSegments: 1,
                    openEnded: false,
                    materialColor: new Color(0.9, 0.75, 0.2, 1.0),
                    metallic: 0.8,
                    roughness: 0.2
                });
                peg.transform.position = new Vec3(x, y, 0);
                peg.transform.setRotation([Math.PI / 2, 0, 0]); // Horizontal pin pointing Z

                this.physics.add(peg, {
                    type: 'static',
                    shape: 'cylinder',
                    radius: 0.32,
                    height: 4.2,
                    friction: 0.1,
                    restitution: 0.75 // High bounciness for energetic pin deflection
                });
            }
        }

        // --- 4. Bottom Collector Bins (Vertical Distribution Slots) ---
        const binCount = 13;
        const binWidth = 32 / binCount;
        const binHeight = 9.0;
        const binBottomY = 1.0;

        // Ground base
        const floor = new Box(36, 1.2, 5.0, {
            materialColor: new Color(0.15, 0.18, 0.25, 1.0),
            metallic: 0.3
        });
        floor.transform.position = new Vec3(0, binBottomY - 0.6, 0);
        this.physics.add(floor, { type: 'static', friction: 0.5, restitution: 0.2 });

        // Vertical dividers
        for (let i = 0; i <= binCount; i++) {
            const x = -16 + i * binWidth;
            const divider = new Box(0.3, binHeight, 4.5, {
                materialColor: new Color(0.25, 0.35, 0.55, 0.8),
                roughness: 0.2
            });
            divider.transform.position = new Vec3(x, binBottomY + binHeight / 2, 0);
            this.physics.add(divider, { type: 'static', friction: 0.2, restitution: 0.3 });
        }
    }

    private spawnSphere(x: number, y: number, z: number, colorIndex: number) {
        const radius = 0.46 + (Math.random() - 0.5) * 0.08;
        const color = RAINBOW_PALETTE[colorIndex % RAINBOW_PALETTE.length];

        const sphere = new Sphere(radius, {
            widthSegments: 16,
            heightSegments: 16,
            materialColor: color,
            roughness: 0.2,
            metallic: 0.4
        });
        sphere.transform.position = new Vec3(x, y, z);

        const comp = this.physics.add(sphere, {
            type: 'dynamic',
            shape: 'sphere',
            radius: radius,
            mass: 1.0,
            friction: 0.12,
            restitution: 0.7,
            velocity: [(Math.random() - 0.5) * 1.5, -2, (Math.random() - 0.5) * 0.5],
            angularVelocity: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6]
        });

        this.dynamicEntities.push({ entity: sphere, comp });

        // Recycle oldest bodies when exceeding threshold to maintain peak 60 FPS
        if (this.dynamicEntities.length > this.maxBodies) {
            const oldest = this.dynamicEntities.shift();
            if (oldest) {
                this.physics.remove(oldest.entity);
            }
        }
    }

    private async spawnInitialBatch(count: number) {
        for (let i = 0; i < count; i++) {
            const spout = i % 3;
            let spawnX = 0;
            if (spout === 0) spawnX = -8 + (Math.random() - 0.5) * 3;
            else if (spout === 1) spawnX = 8 + (Math.random() - 0.5) * 3;
            else spawnX = (Math.random() - 0.5) * 4;

            const spawnY = 38 + Math.random() * 6;
            const spawnZ = (Math.random() - 0.5) * 1.2;

            this.spawnSphere(spawnX, spawnY, spawnZ, i);

            if (i % 12 === 0) {
                await this.wait(40);
            }
        }
    }

    private async startAvalancheLoop() {
        let spawnIndex = 120;

        while (true) {
            await this.wait(80); // Fast continuous stream

            // Multi-spout pouring
            const streamCount = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < streamCount; s++) {
                const spout = (spawnIndex + s) % 3;
                let spawnX = 0;
                if (spout === 0) spawnX = -9 + (Math.random() - 0.5) * 3;
                else if (spout === 1) spawnX = 9 + (Math.random() - 0.5) * 3;
                else spawnX = (Math.random() - 0.5) * 3;

                const spawnY = 39 + Math.random() * 4;
                const spawnZ = (Math.random() - 0.5) * 1.2;

                this.spawnSphere(spawnX, spawnY, spawnZ, spawnIndex + s);
            }

            spawnIndex += streamCount;
        }
    }
}
