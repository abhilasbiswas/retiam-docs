import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Color,
    Vec3,
    Model,
    Sphere,
    Box,
    OrbitCameraController,
    Math3D
} from "retiam";
import { Physics3D } from "retiam/physics";

/**
 * Procedurally generates an irregular concave 3D terrain mesh
 * with bumps, waves, hills, and a central bowl depression.
 */
function createIrregularTrimeshTerrain(size: number = 40, resolution: number = 36): Model {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const half = size / 2;
    const step = size / resolution;

    for (let j = 0; j <= resolution; j++) {
        const z = -half + j * step;
        for (let i = 0; i <= resolution; i++) {
            const x = -half + i * step;

            // Parametric irregular height function:
            // 1. Central concave bowl / funnel
            const r = Math.sqrt(x * x + z * z);
            const bowl = Math.pow(r / half, 2) * 6 - 3;

            // 2. Multi-frequency irregular undulating hills and ripples
            const hills = Math.sin(x * 0.35) * Math.cos(z * 0.35) * 2.2
                + Math.sin(x * 0.75 + 1.2) * 0.9
                + Math.cos(z * 0.65 + 0.8) * 0.9;

            const y = bowl + hills;

            vertices.push(x, y, z);
            uvs.push(i / resolution, j / resolution);
        }
    }

    const rowSize = resolution + 1;
    for (let j = 0; j < resolution; j++) {
        for (let i = 0; i < resolution; i++) {
            const a = j * rowSize + i;
            const b = j * rowSize + (i + 1);
            const c = (j + 1) * rowSize + i;
            const d = (j + 1) * rowSize + (i + 1);

            // Two triangles per quad
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    // Compute normals and construct the 3D Model
    const mesh = Math3D.computeSmoothShading(vertices, indices, uvs);
    const terrain = new Model(mesh, {
        materialColor: new Color(0.15, 0.55, 0.75, 1.0),
        roughness: 0.4,
        metallic: 0.1,
    });

    return terrain;
}

export default class PhysicsTrimeshScene extends Scene {
    private physics!: Physics3D;

    public async run() {
        this.ALWAYS_UPDATE = true;
        this.camera.position.set([0, 25, 65]);

        new OrbitCameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "A deformable terrain collider", "Rigid bodies settle onto a moving mesh");

        // 1. Initialize Physics3D
        this.physics = new Physics3D(this, {
            gravity: [0, -15, 0],
            backend: "box3d"
        });

        // 2. Create the Irregular 3D Landscape with an exact Trimesh Collider
        const terrain = createIrregularTrimeshTerrain(40, 36);
        terrain.transform.position = new Vec3(0, 0, 0);

        // Register as a static Trimesh: Rapier3D computes exact triangle collisions for all shapes!
        this.physics.add(terrain, {
            shape: 'trimesh',
            type: 'static',
            friction: 0.3,
            restitution: 0.4,
        });

        const activeObjects: Model[] = [];

        // 3. Helper to spawn a dynamic marble sphere
        const spawnMarble = (x: number, y: number, z: number, radius: number = 0.8) => {
            const marble = new Sphere(radius, {
                widthSegments: 32,
                heightSegments: 32,
                materialColor: new Color(
                    0.2 + Math.random() * 0.8,
                    0.2 + Math.random() * 0.8,
                    0.2 + Math.random() * 0.8,
                    1.0
                ),
                roughness: 0.15,
                metallic: 0.7,
            });
            marble.transform.position = new Vec3(x, y, z);

            this.physics.add(marble, {
                type: 'dynamic',
                mass: 1.5 * Math.pow(radius / 0.8, 3),
                restitution: 0.5 + Math.random() * 0.3,
                friction: 0.25,
            });

            activeObjects.push(marble);
        };

        // 4. Helper to spawn a dynamic box (now collides perfectly with TriMesh in Rapier!)
        const spawnBox = (x: number, y: number, z: number, size: number = 1.2) => {
            const box = new Box(size, size, size, {
                materialColor: new Color(
                    0.95,
                    0.5 + Math.random() * 0.4,
                    0.1,
                    1.0
                ),
                roughness: 0.3,
                metallic: 0.2,
            });
            box.transform.position = new Vec3(x, y, z);
            box.transform.setRotationXYZ(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            this.physics.add(box, {
                type: 'dynamic',
                mass: 2.0,
                restitution: 0.3,
                friction: 0.4,
            });

            activeObjects.push(box);
        };

        // 5. Initial cascade of marbles and boxes cascading down the irregular hills
        for (let i = 0; i < 30; i++) {
            const rx = (Math.random() - 0.5) * 22;
            const rz = (Math.random() - 0.5) * 22;
            const ry = 10 + i * 1.2;
            if (i % 3 === 0) {
                spawnBox(rx, ry, rz, 1.0 + Math.random() * 0.5);
            } else {
                spawnMarble(rx, ry, rz, 0.5 + Math.random() * 0.6);
            }
        }

        // 6. Interactive Click: Drop a new bouncy marble or box wherever the user clicks
        this.setEvent("click", (worldPos) => {
            const spawnY = Math.max(worldPos.y + 12, 14);
            if (Math.random() > 0.4) {
                spawnMarble(worldPos.x, spawnY, worldPos.z, 0.6 + Math.random() * 0.6);
            } else {
                spawnBox(worldPos.x, spawnY, worldPos.z, 1.0 + Math.random() * 0.4);
            }
        });

        // 7. Automatic Boundary Cleanup: Remove objects that roll off the edges
        const bottomThreshold = -30;
        this.always(() => {
            for (let i = activeObjects.length - 1; i >= 0; i--) {
                const obj = activeObjects[i];
                if (obj.transform.position.y < bottomThreshold) {
                    this.physics.remove(obj, true);
                    activeObjects.splice(i, 1);
                }
            }
        });
    }
}
