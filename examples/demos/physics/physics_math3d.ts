import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    Vec3,
    Box,
    OrbitCameraController,
    MathShape3D,
    Math3D
} from "retiam";
import { Physics3D, RigidBodyComponent } from "retiam/physics";

/**
 * Vibrant, modern translucent color palette for Math 3D geometric entities
 */
const MATH_PALETTE = [
    { fill: new Color(0.1, 0.55, 1.0, 0.55), stroke: new Color(0.4, 0.8, 1.0, 1.0) },  // Cyan/Electric Blue
    { fill: new Color(0.95, 0.2, 0.5, 0.55), stroke: new Color(1.0, 0.6, 0.8, 1.0) },  // Magenta/Neon Pink
    { fill: new Color(0.98, 0.65, 0.1, 0.55), stroke: new Color(1.0, 0.85, 0.3, 1.0) }, // Golden Amber
    { fill: new Color(0.2, 0.85, 0.45, 0.55), stroke: new Color(0.6, 1.0, 0.7, 1.0) },  // Emerald Mint
    { fill: new Color(0.7, 0.3, 0.95, 0.55), stroke: new Color(0.85, 0.6, 1.0, 1.0) }, // Amethyst Purple
    { fill: new Color(0.05, 0.85, 0.85, 0.55), stroke: new Color(0.5, 1.0, 1.0, 1.0) }, // Bright Teal
];

export default class Math3DPhysicsScene extends Scene {
    private physics!: Physics3D;
    private dynamicBodies: { entity: MathShape3D; comp: RigidBodyComponent }[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;

        // 1. Camera positioning & Orbit controls
        this.camera.position.set([0, 18, 38]);
        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 4, 0) });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Procedural collider geometry", "Mathematical forms interact as rigid bodies");

        // 2. Initialize 3D Physics engine (Rapier3D WASM)
        this.physics = new Physics3D(this, {
            gravity: [0, -18, 0],
            maxSubSteps: 4,
        });

        // 3. Create physics environment (tilted platforms & bouncy basin)
        this.createEnvironment();

        // 4. Spawn initial showcase of distinct MathShape3D entities
        await this.spawnInitialShapes();

        // 5. Interactive / periodic spawning loop with impulse waves
        this.startSimulationLoop();
    }

    private createEnvironment() {
        // Main Ground Arena
        const ground = new Box(40, 1, 40, {
            materialColor: new Color(0.08, 0.1, 0.16, 1.0),
            roughness: 0.3,
            metallic: 0.2
        });
        ground.transform.position = new Vec3(0, -0.5, 0);
        this.physics.add(ground, {
            type: 'static',
            friction: 0.6,
            restitution: 0.4
        });

        // Left Tilted Chute / Ramp
        const rampLeft = new Box(16, 0.8, 10, {
            materialColor: new Color(0.12, 0.16, 0.26, 1.0),
            roughness: 0.2,
            metallic: 0.4
        });
        rampLeft.transform.position = new Vec3(-11, 12, 0);
        rampLeft.transform.setRotation([0, 0, -0.35]); // Tilted down toward center
        this.physics.add(rampLeft, {
            type: 'static',
            friction: 0.2,
            restitution: 0.5
        });

        // Right Tilted Chute / Ramp (Lower)
        const rampRight = new Box(16, 0.8, 10, {
            materialColor: new Color(0.12, 0.16, 0.26, 1.0),
            roughness: 0.2,
            metallic: 0.4
        });
        rampRight.transform.position = new Vec3(11, 6, 0);
        rampRight.transform.setRotation([0, 0, 0.32]); // Tilted down toward center
        this.physics.add(rampRight, {
            type: 'static',
            friction: 0.2,
            restitution: 0.5
        });

        // Arena Boundaries / Guard Rails
        const createWall = (pos: Vec3, size: [number, number, number]) => {
            const wall = new Box(size[0], size[1], size[2], {
                materialColor: new Color(0.15, 0.2, 0.3, 0.4),
                roughness: 0.1,
                transmission: 0.6
            });
            wall.transform.position = pos;
            this.physics.add(wall, { type: 'static', friction: 0.3, restitution: 0.6 });
        };

        createWall(new Vec3(0, 2.5, -20), [40, 5, 0.8]); // Back Wall
        createWall(new Vec3(0, 2.5, 20), [40, 5, 0.8]);  // Front Wall
        createWall(new Vec3(-20, 2.5, 0), [0.8, 5, 40]); // Left Wall
        createWall(new Vec3(20, 2.5, 0), [0.8, 5, 40]);  // Right Wall
    }

    private async spawnInitialShapes() {
        // 1. MathShape3D.Box (Translucent wireframe cube)
        const cube = MathShape3D.Box(2.2, 2.2, 2.2, {
            fill: MATH_PALETTE[0].fill,
            stroke: MATH_PALETTE[0].stroke,
            strokeWidth: 0.06,
            fillOpacity: 0.85,
            transmission: 0.4,
            roughness: 0.1
        });
        cube.transform.position = new Vec3(-12, 18, -2);
        const cubeComp = this.physics.add(cube, {
            type: 'dynamic',
            mass: 3.0,
            friction: 0.4,
            restitution: 0.5,
            angularVelocity: [1, 2, 0.5]
        });
        this.dynamicBodies.push({ entity: cube, comp: cubeComp });

        await this.wait(200);

        // 2. MathShape3D.Sphere (Wireframe geodesic rings sphere)
        const sphere = MathShape3D.Sphere(1.4, 8, {
            fill: MATH_PALETTE[1].fill,
            stroke: MATH_PALETTE[1].stroke,
            strokeWidth: 0.05,
            fillOpacity: 0.9,
            transmission: 0.3,
            roughness: 0.1
        });
        sphere.transform.position = new Vec3(-10, 19, 1);
        const sphereComp = this.physics.add(sphere, {
            type: 'dynamic',
            mass: 2.0,
            friction: 0.2,
            restitution: 0.8,
            angularVelocity: [0.5, 3, 1]
        });
        this.dynamicBodies.push({ entity: sphere, comp: sphereComp });

        await this.wait(200);

        // 3. MathShape3D.Torus (Wireframe donut ring)
        const torus = MathShape3D.Torus(1.4, 0.5, 10, 20, {
            fill: MATH_PALETTE[2].fill,
            stroke: MATH_PALETTE[2].stroke,
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.35,
            roughness: 0.15
        });
        torus.transform.position = new Vec3(-14, 20, 0);
        const torusComp = this.physics.add(torus, {
            type: 'dynamic',
            mass: 2.5,
            shape: 'trimesh',
            friction: 0.3,
            restitution: 0.6,
            angularVelocity: [2, 1, 3]
        });
        this.dynamicBodies.push({ entity: torus, comp: torusComp });

        await this.wait(200);

        // 4. MathShape3D.Cylinder (Wireframe cylinder)
        const cylinder = MathShape3D.Cylinder(1.0, 1.0, 2.4, 8, {
            fill: MATH_PALETTE[3].fill,
            stroke: MATH_PALETTE[3].stroke,
            strokeWidth: 0.05,
            fillOpacity: 0.85,
            transmission: 0.3,
            roughness: 0.1
        });
        cylinder.transform.position = new Vec3(-11, 21, 2);
        const cylComp = this.physics.add(cylinder, {
            type: 'dynamic',
            mass: 2.5,
            friction: 0.4,
            restitution: 0.5,
            angularVelocity: [1, 0.5, 2]
        });
        this.dynamicBodies.push({ entity: cylinder, comp: cylComp });

        await this.wait(200);

        // 5. Custom Polyhedron: Icosahedron MathShape3D
        const icosahedron = this.createIcosahedronMathShape(1.5, {
            fill: MATH_PALETTE[4].fill,
            stroke: MATH_PALETTE[4].stroke,
            strokeWidth: 0.06
        });
        icosahedron.transform.position = new Vec3(-13, 22, -1);
        const icoComp = this.physics.add(icosahedron, {
            type: 'dynamic',
            mass: 3.0,
            shape: 'convex',
            friction: 0.3,
            restitution: 0.7,
            angularVelocity: [2, 2, 1]
        });
        this.dynamicBodies.push({ entity: icosahedron, comp: icoComp });
    }

    private createIcosahedronMathShape(radius: number, options: any): MathShape3D {
        const phi = (1 + Math.sqrt(5)) / 2;
        const rawVerts = [
            -1, phi, 0,   1, phi, 0,  -1, -phi, 0,   1, -phi, 0,
             0, -1, phi,  0,  1, phi,   0, -1, -phi,  0,  1, -phi,
             phi, 0, -1,  phi, 0,  1,  -phi, 0, -1,  -phi, 0,  1
        ];

        const indices = [
            0, 11, 5,   0, 5, 1,    0, 1, 7,    0, 7, 10,   0, 10, 11,
            1, 5, 9,    5, 11, 4,   11, 10, 2,  10, 7, 6,   7, 1, 8,
            3, 9, 4,    3, 4, 2,    3, 2, 6,    3, 6, 8,    3, 8, 9,
            4, 9, 5,    2, 4, 11,   6, 2, 10,   8, 6, 7,    9, 8, 1
        ];

        const scaledVerts = rawVerts.map(v => (v / Math.sqrt(1 + phi * phi)) * radius);
        const mesh = Math3D.computeSmoothShading(scaledVerts, indices);
        return new MathShape3D(mesh, options);
    }

    private spawnRandomShape() {
        const typeIndex = Math.floor(Math.random() * 5);
        const color = MATH_PALETTE[Math.floor(Math.random() * MATH_PALETTE.length)];
        let shape: MathShape3D;

        const spawnX = -12 + (Math.random() - 0.5) * 4;
        const spawnY = 18 + Math.random() * 4;
        const spawnZ = (Math.random() - 0.5) * 6;

        switch (typeIndex) {
            case 0:
                shape = MathShape3D.Box(1.8, 1.8, 1.8, {
                    fill: color.fill,
                    stroke: color.stroke,
                    strokeWidth: 0.05
                });
                break;
            case 1:
                shape = MathShape3D.Sphere(1.1, 7, {
                    fill: color.fill,
                    stroke: color.stroke,
                    strokeWidth: 0.05
                });
                break;
            case 2:
                shape = MathShape3D.Cylinder(0.9, 0.9, 2.0, 6, {
                    fill: color.fill,
                    stroke: color.stroke,
                    strokeWidth: 0.05
                });
                break;
            case 3:
                shape = MathShape3D.Torus(1.2, 0.4, 8, 16, {
                    fill: color.fill,
                    stroke: color.stroke,
                    strokeWidth: 0.05
                });
                break;
            default:
                shape = this.createIcosahedronMathShape(1.3, {
                    fill: color.fill,
                    stroke: color.stroke,
                    strokeWidth: 0.05
                });
                break;
        }

        shape.transform.position = new Vec3(spawnX, spawnY, spawnZ);
        const comp = this.physics.add(shape, {
            type: 'dynamic',
            mass: 2.0,
            friction: 0.3,
            restitution: 0.6,
            velocity: [2 + Math.random() * 2, 0, (Math.random() - 0.5) * 2],
            angularVelocity: [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4]
        });

        this.dynamicBodies.push({ entity: shape, comp });

        // Maintain reasonable dynamic body limit
        if (this.dynamicBodies.length > 25) {
            const oldest = this.dynamicBodies.shift();
            if (oldest) {
                this.physics.remove(oldest.entity);
            }
        }
    }

    private async startSimulationLoop() {
        let spawnCounter = 0;

        while (true) {
            await this.wait(1500);

            // Continuously spawn fresh shapes to tumble down the ramps
            if (spawnCounter < 30) {
                this.spawnRandomShape();
                spawnCounter++;
            }
        }
    }
}
