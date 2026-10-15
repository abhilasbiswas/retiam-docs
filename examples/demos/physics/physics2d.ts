import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Color, Vec3, Circle, Rect, Poly, Triangle, Vec2, VectorEntity } from "retiam";
import { Physics2D } from "retiam/physics";

/** Curated vibrant color palette for spawned physics shapes */
const PALETTE = [
    new Color(0.95, 0.26, 0.21, 1.0), // Coral Red
    new Color(0.98, 0.55, 0.00, 1.0), // Amber Orange
    new Color(1.00, 0.84, 0.00, 1.0), // Golden Yellow
    new Color(0.30, 0.75, 0.35, 1.0), // Emerald Green
    new Color(0.00, 0.72, 0.83, 1.0), // Cyan / Teal
    new Color(0.13, 0.59, 0.95, 1.0), // Sky Blue
    new Color(0.61, 0.35, 0.71, 1.0), // Royal Purple
    new Color(0.91, 0.12, 0.55, 1.0), // Hot Pink
];

/**
 * Creates a random 2D vector shape:
 * - Circle
 * - Rectangle / Square
 * - Regular Polygon (3 to 8 sides)
 * - Irregular Convex Polygon
 * - Irregular Concave Star / Indented Polygon
 * - Scalene / Irregular Triangle
 */
function createRandomShape(): VectorEntity {
    const shapeType = Math.floor(Math.random() * 6);
    let shape: VectorEntity;

    switch (shapeType) {
        case 0: {
            // Circle
            const radius = Math.random() * 1.0 + 0.6;
            shape = new Circle(radius);
            break;
        }
        case 1: {
            // Rectangle / Square
            const width = Math.random() * 2.0 + 1.0;
            const height = Math.random() * 2.0 + 1.0;
            shape = new Rect(width, height);
            break;
        }
        case 2: {
            // Regular Polygon (3 to 8 sides)
            const sides = Math.floor(Math.random() * 6) + 3;
            const radius = Math.random() * 0.8 + 0.8;
            shape = Poly.regular(sides, radius);
            break;
        }
        case 3: {
            // Irregular Convex Polygon (4 to 6 vertices)
            const n = Math.floor(Math.random() * 3) + 4;
            const angles = Array.from({ length: n }, () => Math.random() * Math.PI * 2).sort((a, b) => a - b);
            const points = angles.map(a => {
                const r = Math.random() * 0.8 + 0.8;
                return new Vec2(Math.cos(a) * r, Math.sin(a) * r);
            });
            shape = new Poly(points, { isClosed: true });
            break;
        }
        case 4: {
            // Irregular Concave Star / Indented Polygon (8 to 12 vertices)
            const numPoints = (Math.floor(Math.random() * 3) + 4) * 2;
            const points: Vec2[] = [];
            for (let i = 0; i < numPoints; i++) {
                const angle = (i * Math.PI * 2) / numPoints;
                const r = i % 2 === 0 ? Math.random() * 0.5 + 1.4 : Math.random() * 0.4 + 0.5;
                points.push(new Vec2(Math.cos(angle) * r, Math.sin(angle) * r));
            }
            shape = new Poly(points, { isClosed: true });
            break;
        }
        default: {
            // Irregular Scalene Triangle
            const p1 = new Vec2(-Math.random() * 1.5 - 0.5, -Math.random() * 1.0 - 0.5);
            const p2 = new Vec2(Math.random() * 1.5 + 0.5, -Math.random() * 0.8 - 0.4);
            const p3 = new Vec2((Math.random() - 0.5) * 2.0, Math.random() * 1.6 + 0.6);
            shape = new Triangle([p1, p2, p3]);
            break;
        }
    }

    shape.paint.fill = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return shape;
}

export default class Physics2DScene extends Scene {
    private activeShapes: VectorEntity[] = [];

    public async run() {
        this.ALWAYS_UPDATE = true;
        // Position camera to view the 2D plane clearly
        this.camera.position.set([0, 0, 50]);
        frameStage(this, 54, 48);
        demoCaption(this, "A shape physics sandbox", "Click to drop a shape");

        // 1. Initialize Physics2D (automatically manages simulation & render loop stepping)
        const physics = new Physics2D(this, {
            backend: "rapier",
            gravity: [0, -9.8]
        });

        // 2. Create a Static Floor (automatically added to Scene & Physics)
        const floor = new Rect(40, 2);
        floor.transform.position = new Vec3(0, -15, 0);
        floor.paint.fill = new Color(0.18, 0.24, 0.34, 1.0);
        physics.add(floor, 'static');

        // Helper to spawn a shape at a specific world coordinate
        const spawnAt = (worldPos: Vec3) => {
            const shape = createRandomShape();
            shape.transform.position = new Vec3(worldPos.x, worldPos.y, 0);
            shape.transform.setRotationZ(Math.random() * Math.PI * 2);
            shape.z_index = Math.random() * 0.05;

            // Automatically adds to Scene, generates exact collider, and binds RigidBody2DComponent
            physics.add(shape, {
                type: 'dynamic',
                restitution: Math.random() * 0.5 + 0.2,
                friction: 0.3
            });

            this.activeShapes.push(shape);
        };

        // 3. Initial burst of random shapes falling into the arena
        for (let i = 0; i < 15; i++) {
            const initialPos = new Vec3((Math.random() - 0.5) * 16, 8 + i * 2, 0);
            spawnAt(initialPos);
        }

        // 4. Mouse Click Interactivity: Built-in Scene.setEvent provides world-space coordinates directly
        this.setEvent("click", (worldPos: Vec3, event: PointerEvent | WheelEvent) => {
            if ((event as PointerEvent).button !== 0) return; // Left click only
            spawnAt(worldPos);
        });

        // 5. Automatic Boundary Cleanup: If a shape falls off the bottom threshold, remove and destroy it
        const bottomThreshold = -30;
        this.always(() => {
            for (let i = this.activeShapes.length - 1; i >= 0; i--) {
                const shape = this.activeShapes[i];
                if (shape.transform.position.y < bottomThreshold) {
                    // Removes from Planck World, removes from Scene, and destroys entity resources
                    physics.remove(shape, true);
                    this.activeShapes.splice(i, 1);
                }
            }
        });
    }
}
