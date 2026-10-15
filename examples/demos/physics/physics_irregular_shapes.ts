import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    Vec3,
    Model,
    Box,
    OrbitCameraController,
    Math3D
} from "retiam";
import { Physics3D } from "retiam/physics";

/** Curated vibrant gemstone and mineral color palette */
const MINERAL_PALETTE = [
    new Color(0.95, 0.35, 0.25, 1.0), // Ruby Red
    new Color(0.98, 0.60, 0.15, 1.0), // Topaz Amber
    new Color(0.95, 0.85, 0.20, 1.0), // Citrine Gold
    new Color(0.20, 0.80, 0.50, 1.0), // Emerald Green
    new Color(0.15, 0.70, 0.90, 1.0), // Aquamarine
    new Color(0.35, 0.45, 0.95, 1.0), // Sapphire Blue
    new Color(0.70, 0.35, 0.90, 1.0), // Amethyst Violet
    new Color(0.95, 0.30, 0.65, 1.0), // Rose Quartz
];

/**
 * Creates an irregular, flat-shaded angular 3D rock/asteroid.
 * Displaces icosahedral vertices irregularly to produce jagged, sharp facets.
 */
function createIrregularRock(radius: number = 1.2, roughness: number = 0.35): Model {
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
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

    // Perturb vertices irregularly
    const perturbedVertices: number[] = [];
    for (let i = 0; i < baseVertices.length; i += 3) {
        let vx = baseVertices[i];
        let vy = baseVertices[i + 1];
        let vz = baseVertices[i + 2];

        const len = Math.hypot(vx, vy, vz);
        const randScale = radius * (1.0 + (Math.random() - 0.5) * roughness);
        vx = (vx / len) * randScale;
        vy = (vy / len) * randScale;
        vz = (vz / len) * randScale;

        perturbedVertices.push(vx, vy, vz);
    }

    // Flat-shading ensures crisp, angular facets on every face
    const mesh = Math3D.computeFlatShading(perturbedVertices, indices);
    const color = MINERAL_PALETTE[Math.floor(Math.random() * MINERAL_PALETTE.length)];

    return new Model(mesh, {
        materialColor: color,
        roughness: 0.25,
        metallic: 0.4,
        topology: "flat"
    });
}

/**
 * Creates an irregular, multi-faceted angular crystal prism with pointed caps.
 */
function createIrregularCrystal(sides: number = 6, radius: number = 1.0, height: number = 2.4): Model {
    const vertices: number[] = [];
    const indices: number[] = [];

    const halfH = height / 2;
    const topApexIndex = 0;
    const botApexIndex = 1;

    // Top and Bottom Apex Vertices with asymmetrical offsets
    vertices.push(
        (Math.random() - 0.5) * 0.3,  halfH + radius * 0.8, (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3, -halfH - radius * 0.8, (Math.random() - 0.5) * 0.3
    );

    const topRingStart = 2;
    const botRingStart = topRingStart + sides;

    // Irregularly spaced prism ring vertices
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const r = radius * (0.7 + Math.random() * 0.6);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        // Top ring vertex
        vertices.push(x, halfH * (0.8 + Math.random() * 0.4), z);
    }

    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const r = radius * (0.7 + Math.random() * 0.6);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        // Bottom ring vertex
        vertices.push(x, -halfH * (0.8 + Math.random() * 0.4), z);
    }

    // Build triangular facets
    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        const t1 = topRingStart + i;
        const t2 = topRingStart + next;
        const b1 = botRingStart + i;
        const b2 = botRingStart + next;

        // Top Cap Triangle
        indices.push(topApexIndex, t1, t2);

        // Side Quad (2 Triangles)
        indices.push(t1, b1, t2);
        indices.push(t2, b1, b2);

        // Bottom Cap Triangle
        indices.push(botApexIndex, b2, b1);
    }

    const mesh = Math3D.computeFlatShading(vertices, indices);
    const color = MINERAL_PALETTE[Math.floor(Math.random() * MINERAL_PALETTE.length)];

    return new Model(mesh, {
        materialColor: color,
        roughness: 0.15,
        metallic: 0.6,
        topology: "flat"
    });
}

/**
 * Creates an asymmetrical faceted tetrahedron.
 */
function createIrregularTetrahedron(size: number = 1.6): Model {
    const vertices = [
        size * (0.8 + Math.random() * 0.4),  size * (0.8 + Math.random() * 0.4),  size * (0.8 + Math.random() * 0.4),
       -size * (0.8 + Math.random() * 0.4), -size * (0.8 + Math.random() * 0.4),  size * (0.8 + Math.random() * 0.4),
       -size * (0.8 + Math.random() * 0.4),  size * (0.8 + Math.random() * 0.4), -size * (0.8 + Math.random() * 0.4),
        size * (0.8 + Math.random() * 0.4), -size * (0.8 + Math.random() * 0.4), -size * (0.8 + Math.random() * 0.4),
    ];

    const indices = [
        0, 1, 2,
        0, 2, 3,
        0, 3, 1,
        1, 3, 2
    ];

    const mesh = Math3D.computeFlatShading(vertices, indices);
    const color = MINERAL_PALETTE[Math.floor(Math.random() * MINERAL_PALETTE.length)];

    return new Model(mesh, {
        materialColor: color,
        roughness: 0.2,
        metallic: 0.5,
        topology: "flat"
    });
}

/**
 * Spawns a random irregular non-smooth 3D shape:
 * - Irregular Rock / Asteroid
 * - Irregular Multi-Faceted Crystal
 * - Irregular Asymmetrical Tetrahedron
 */
function createRandomIrregularShape(): Model {
    const type = Math.floor(Math.random() * 3);
    switch (type) {
        case 0:
            return createIrregularRock(0.9 + Math.random() * 0.6, 0.4);
        case 1:
            return createIrregularCrystal(5 + Math.floor(Math.random() * 4), 0.7 + Math.random() * 0.4, 1.8 + Math.random() * 0.8);
        default:
            return createIrregularTetrahedron(1.0 + Math.random() * 0.5);
    }
}

export default class PhysicsIrregularShapesScene extends Scene {
    private physics!: Physics3D;
    private activeShapes: Model[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 20, 50]);

        new OrbitCameraController(this, this.camera, { targetCenter: new Vec3(0, 5, 0) });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Irregular collision shapes", "Concave geometry and convex bodies on a shared course");

        // 1. Initialize Physics3D
        this.physics = new Physics3D(this, {
            gravity: [0, -18, 0],
        });

        // 2. Build an angular stepped cascade playground with tilted shelves & ramps
        this.createSteppedRamps();

        // 3. Helper to spawn a dynamic irregular shape
        const spawnShapeAt = (pos: Vec3) => {
            const shape = createRandomIrregularShape();
            shape.transform.position = pos;
            shape.transform.setRotationXYZ(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Add to physics with exact convex polyhedron / AABB collider
            this.physics.add(shape, {
                type: 'dynamic',
                shape: 'convex',
                mass: 2.0,
                restitution: 0.4,
                friction: 0.35,
                linearDamping: 0.05,
                angularDamping: 0.05
            });

            this.activeShapes.push(shape);
        };

        // 4. Initial cascade of tumbling rocks and crystals
        for (let i = 0; i < 20; i++) {
            const px = (Math.random() - 0.5) * 8;
            const pz = (Math.random() - 0.5) * 6;
            const py = 22 + i * 2.5;
            spawnShapeAt(new Vec3(px, py, pz));
        }

        // 5. Interactive Click: Spawn a new irregular tumbling rock wherever you click
        this.setEvent("click", (worldPos) => {
            const spawnY = Math.max(worldPos.y + 12, 18);
            spawnShapeAt(new Vec3(worldPos.x, spawnY, worldPos.z));
        });

        // 6. Automatic Boundary Cleanup
        const bottomThreshold = -30;
        this.always(() => {
            for (let i = this.activeShapes.length - 1; i >= 0; i--) {
                const shape = this.activeShapes[i];
                if (shape.transform.position.y < bottomThreshold) {
                    this.physics.remove(shape, true);
                    this.activeShapes.splice(i, 1);
                }
            }
        });
    }

    /**
     * Builds a staggered series of angled ramps and a catch-trough.
     */
    private createSteppedRamps() {
        // Shelf 1 (Left tilted ramp)
        const ramp1 = new Box(16, 1, 12, {
            materialColor: new Color(0.25, 0.28, 0.35, 1.0),
            roughness: 0.6,
        });
        ramp1.transform.position = new Vec3(-7, 14, 0);
        ramp1.transform.setRotationZ(-0.35); // Tilted down toward center
        this.physics.add(ramp1, 'static');

        // Shelf 2 (Right tilted ramp)
        const ramp2 = new Box(16, 1, 12, {
            materialColor: new Color(0.28, 0.32, 0.40, 1.0),
            roughness: 0.6,
        });
        ramp2.transform.position = new Vec3(7, 7, 0);
        ramp2.transform.setRotationZ(0.35); // Tilted down toward left
        this.physics.add(ramp2, 'static');

        // Shelf 3 (Lower center shelf)
        const ramp3 = new Box(14, 1, 12, {
            materialColor: new Color(0.22, 0.25, 0.30, 1.0),
            roughness: 0.6,
        });
        ramp3.transform.position = new Vec3(-4, 0, 0);
        ramp3.transform.setRotationZ(-0.25);
        this.physics.add(ramp3, 'static');

        // Bottom Collection Floor
        const floor = new Box(32, 1.2, 20, {
            materialColor: new Color(0.18, 0.20, 0.25, 1.0),
            roughness: 0.7,
        });
        floor.transform.position = new Vec3(2, -8, 0);
        this.physics.add(floor, 'static');

        // Floor Left Retaining Wall
        const wallLeft = new Box(1.2, 4, 20, {
            materialColor: new Color(0.22, 0.25, 0.30, 1.0),
        });
        wallLeft.transform.position = new Vec3(-14, -6, 0);
        this.physics.add(wallLeft, 'static');

        // Floor Right Retaining Wall
        const wallRight = new Box(1.2, 4, 20, {
            materialColor: new Color(0.22, 0.25, 0.30, 1.0),
        });
        wallRight.transform.position = new Vec3(18, -6, 0);
        this.physics.add(wallRight, 'static');
    }
}
