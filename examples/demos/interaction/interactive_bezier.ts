// File: examples/demos/interaction/interactive_bezier.ts

import {
    Scene,
    InteractionManager,
    CameraController,
    InteractionComponent,
    Bezier,
    Circle,
    Line,
    Vec2,
    Vec3,
    Color,
    Camera2DController,
    JointType
} from "retiam";
import { demoBackground } from "../../shared/presentation";

interface ControlHandle {
    ring: Circle;
    dot: Circle;
    baseColor: Color;
}

export default class InteractiveBezierScene extends Scene {
    private bezierCurve!: Bezier;
    private controlLines!: Line;
    private handles: ControlHandle[] = [];

    // Control point initial positions (Degree 4 Bézier curve)
    private controlPoints: Vec2[] = [
        new Vec2(-35, -15),
        new Vec2(-18, 25),
        new Vec2(0, -20),
        new Vec2(18, 25),
        new Vec2(35, -15)
    ];

    public async run() {
        // 1. Sleek Minimal Dark Background
        this.clearColor(demoBackground());

        // 2. Camera & Interaction Setup
        this.camera.position.set([0, 0, 70]);
        new Camera2DController(this, this.camera, { zoom: 60 });
        new InteractionManager(this);

        // 3. Subtle Control Polygon Cage
        this.controlLines = new Line(this.controlPoints, {
            stroke: new Color(1.0, 1.0, 1.0, 0.15),
            strokeWidth: 0.15,
            label: "ControlPolygon"
        });
        this.add(this.controlLines);

        // 4. GPU Compute-Tessellated Bézier Curve
        this.bezierCurve = new Bezier(this.controlPoints, {
            degree: 4,
            segments: 64,
            stroke: new Color(0.2, 0.75, 1.0, 1.0),
            strokeWidth: 0.8,
            label: "GPUBezierCurve",
            fill: new Color(0.2, 0.75, 1.0, 0.5),
            joint: JointType.ROUND
        });
        this.add(this.bezierCurve);

        // 5. Minimalist Interactive Control Point Handles
        this.buildHandles();
    }

    private buildHandles() {
        const startColor = new Color(0.15, 0.9, 0.6, 1.0);  // Emerald for start
        const endColor = new Color(1.0, 0.35, 0.5, 1.0);    // Coral for end
        const midColor = new Color(0.9, 0.92, 0.96, 1.0);   // Crisp white for interior handles

        for (let i = 0; i < this.controlPoints.length; i++) {
            const pt = this.controlPoints[i];
            const isEndpoint = (i === 0 || i === this.controlPoints.length - 1);
            const baseColor = i === 0 ? startColor : (i === this.controlPoints.length - 1 ? endColor : midColor);

            // Outer interaction ring
            const ring = new Circle(1.8, {
                fill: new Color(baseColor.r, baseColor.g, baseColor.b, 0.08),
                stroke: new Color(baseColor.r, baseColor.g, baseColor.b, 0.5),
                strokeWidth: 0.2
            });
            ring.transform.position.set([pt.x, pt.y, 2]);
            this.add(ring);

            // Inner solid center dot
            const dot = new Circle(0.5, {
                fill: baseColor,
                stroke: new Color(1.0, 1.0, 1.0, 0.9),
                strokeWidth: 0.1
            });
            dot.transform.position.set([pt.x, pt.y, 3]);
            this.add(dot);

            const handle: ControlHandle = { ring, dot, baseColor };
            this.handles.push(handle);

            // Attach Interaction Component for Draggable Interaction
            const interact = ring.addComponent(new InteractionComponent());
            interact.isDraggable = true;

            const index = i;

            interact.onPointerOver = () => {
                ring.transform.setScale([1.35, 1.35, 1.35]);
                ring.paint.stroke = new Color(baseColor.r, baseColor.g, baseColor.b, 0.95);
                ring.paint.strokeWidth = 0.3;
                dot.transform.setScale([1.3, 1.3, 1.3]);
                this.invalidate();
            };

            interact.onPointerOut = () => {
                ring.transform.setScale([1.0, 1.0, 1.0]);
                ring.paint.stroke = new Color(baseColor.r, baseColor.g, baseColor.b, 0.5);
                ring.paint.strokeWidth = 0.2;
                dot.transform.setScale([1.0, 1.0, 1.0]);
                this.invalidate();
            };

            interact.onDragStart = () => {
                ring.paint.fill = new Color(0.2, 0.8, 1.0, 0.25);
                dot.paint.fill = new Color(1.0, 1.0, 1.0, 1.0);
                this.invalidate();
            };

            interact.onDrag = (newPosition: Vec3) => {
                // Update 2D position in memory
                this.controlPoints[index].set(newPosition.x, newPosition.y);
                ring.transform.position.set([newPosition.x, newPosition.y, 2]);
                dot.transform.position.set([newPosition.x, newPosition.y, 3]);

                // Synchronize GPU Bézier curve and control polygon cage
                this.bezierCurve.setPoints(this.controlPoints);
                this.controlLines.setVertices(this.controlPoints);

                this.invalidate();
            };

            interact.onDragEnd = () => {
                ring.paint.fill = new Color(baseColor.r, baseColor.g, baseColor.b, 0.08);
                dot.paint.fill = baseColor;
                this.invalidate();
            };
        }
    }
}
