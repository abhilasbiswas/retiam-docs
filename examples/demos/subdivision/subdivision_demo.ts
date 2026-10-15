import { frameStage, compactDemoPanel, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/subdivision/subdivision_demo.ts
//
// Universal Subdivision Engine Interactive Showcase
// Visualizes and explains all subdivision & resampling cases individually:
// 1. Open Polyline Subdivision (Fixed vs Max Segment Length vs Tolerance)
// 2. Closed 2D Polygon Perimeter Subdivision (Star, Hexagon, Shield)
// 3. De Casteljau Analytical Bézier Splitting (Quadratic & Cubic)
// 4. Recursive Cubic Bézier Subdivision (Convergence of Convex Hulls)
// 5. Uniform Arc-Length Resampling vs Linear Subdivision (Velocity Uniformity)
// 6. Packed WebGPU Vertex Buffers (Zero-Allocation TypedArray Pipeline)
// 7. Practical Spatial Deformation (Why Subdivision is Essential)
// =========================================================================

import {
    Scene,
    Color,
    Camera2DController,
    Vec2,
    Vec3,
    SDFText,
    Rect,
    Line,
    Poly,
    Circle,
    SubdivisionEngine,
    SubdivisionOptions,
    PathGeometryUtils,
    CENTER
} from "retiam";

// Palette
const COLOR_BG = new Color(0.018, 0.022, 0.035, 1.0);
const COLOR_CYAN = new Color(0.0, 0.88, 1.0, 0.95);
const COLOR_PINK = new Color(1.0, 0.2, 0.55, 0.95);
const COLOR_AMBER = new Color(1.0, 0.78, 0.2, 0.95);
const COLOR_EMERALD = new Color(0.1, 0.95, 0.65, 0.95);
const COLOR_PURPLE = new Color(0.72, 0.45, 1.0, 0.95);
const COLOR_GRAY = new Color(0.4, 0.48, 0.6, 0.6);
const COLOR_LINE_BASE = new Color(0.3, 0.5, 0.75, 0.4);

export type SubdivisionCaseId =
    | "polyline"
    | "closed_polygon"
    | "bezier_split"
    | "recursive_bezier"
    | "arclength_vs_subdivision"
    | "packed_buffers"
    | "spatial_deformation";

interface CaseInfo {
    id: SubdivisionCaseId;
    title: string;
    subtitle: string;
    formula: string;
    description: string;
}

const CASES: CaseInfo[] = [
    {
        id: "polyline",
        title: "1. Open Polyline Subdivision",
        subtitle: "subdividePolyline(points, options)",
        formula: "steps = max(1, ceil(length / maxSegmentLength))",
        description: "Subdivides open 2D/3D polylines into dense vertex arrays. Supports fixed subdivision counts, adaptive maxSegmentLength (ensuring uniform spatial resolution across varied edge lengths), and error tolerance thresholds."
    },
    {
        id: "closed_polygon",
        title: "2. Closed 2D Polygon Perimeter",
        subtitle: "subdivideClosedPolygon2D(points, options)",
        formula: "p_i -> p_{(i+1) mod N}  (Cyclic Closure)",
        description: "Subdivides closed 2D polygon perimeters cyclically, ensuring the closing edge (pN-1 -> p0) is properly subdivided without seams. Essential for perimeter tessellation, area morphing, and boundary deformation."
    },
    {
        id: "bezier_split",
        title: "3. De Casteljau Bézier Splitting",
        subtitle: "splitQuadraticBezier / splitCubicBezier(p0..p3, t)",
        formula: "S(t) = (1-t)R_0 + tR_1  (Exact Algebraic Split)",
        description: "Analytically splits a Bézier curve at parameter t into two independent, mathematically exact Bézier sub-curves without numerical error. Visualizes the de Casteljau geometric interpolation hierarchy."
    },
    {
        id: "recursive_bezier",
        title: "4. Recursive Bézier Subdivision",
        subtitle: "subdivideCubicBezier(p0..p3, depth)",
        formula: "N = 2^depth sub-curves; Control cages -> True Curve",
        description: "Recursively subdivides a cubic curve to depth d, generating 2^d analytical sub-segments. Demonstrates the fundamental theorem of Bézier subdivision: piecewise control polygons converge quadratically to the true curve."
    },
    {
        id: "arclength_vs_subdivision",
        title: "5. Arc-Length vs Linear Subdivision",
        subtitle: "resampleByArcLength(points, N) vs subdividePolyline()",
        formula: "Δs = L_total / (N - 1)  (Uniform Metric Distance)",
        description: "Contrasts proportional linear subdivision (where points bunch on short segments and spread on long ones) with equidistant arc-length re-parameterization. Visualizes constant-velocity physical motion."
    },
    {
        id: "packed_buffers",
        title: "6. Packed WebGPU Vertex Buffers",
        subtitle: "subdividePackedVertices3D(Float32Array, count, options)",
        formula: "Stride = 4 floats [x, y, z, pad] (Zero Allocation)",
        description: "Zero-allocation batch subdivision on flat Float32Array GPU buffers. Avoids object allocation overhead during real-time vertex updates, delivering memory directly ready for WebGPU storage buffers."
    },
    {
        id: "spatial_deformation",
        title: "7. Practical Spatial Deformation",
        subtitle: "prepareForNonlinearTransform() & Wave Warping",
        formula: "y'(x) = y + A * sin(k*x - ωt)  (Needs Dense Vertices)",
        description: "Shows why subdivision is indispensable in graphics: an unsubdivided line with only 2 vertices remains a rigid straight stick, while a subdivided line bends into an organic, fluid undulating wave."
    }
];

export default class SubdivisionDemoScene extends Scene {
    // Current Active State
    private activeCase: SubdivisionCaseId = "polyline";
    private activeEntities: any[] = [];
    private uiContainer: HTMLElement | null = null;
    private animTime: number = 0;

    // Parameters for Case 1: Polyline
    private polylineSubdivMode: "fixed" | "maxLen" = "maxLen";
    private polylineFixedCount: number = 10;
    private polylineMaxLen: number = 2.2;
    private polylineAccuracy: number = 1.0;

    // Parameters for Case 2: Closed Polygon
    private closedShape: "star" | "hexagon" | "shield" = "star";
    private closedSubdivs: number = 12;
    private closedDeform: boolean = true;

    // Parameters for Case 3: De Casteljau Split
    private bezierType: "cubic" | "quadratic" = "cubic";
    private bezierT: number = 0.5;

    // Parameters for Case 4: Recursive Bézier
    private bezierDepth: number = 2;
    private showHulls: boolean = true;

    // Parameters for Case 5: Arc Length vs Subdivision
    private arcLengthTargetCount: number = 28;
    private animateRunners: boolean = true;
    private runnerProgress: number = 0;

    // Parameters for Case 6: Packed WebGPU Buffers
    private packedSubdivSteps: number = 18;

    // Parameters for Case 7: Spatial Deformation
    private waveAmplitude: number = 2.8;
    private waveFrequency: number = 0.55;
    private waveSubdivs: number = 40;

    // Common
    private showVertexDots: boolean = true;

    // Telemetry DOM elements
    private elInputVerts: HTMLElement | null = null;
    private elOutputVerts: HTMLElement | null = null;
    private elResolution: HTMLElement | null = null;
    private elActiveFormula: HTMLElement | null = null;
    private elCaseDesc: HTMLElement | null = null;

    // Dynamic animators
    private dynamicUpdateFn: ((time: number) => void) | null = null;

    public async run() {
        this.disablePlayer();
        // 1. Camera & Canvas
        this.camera.position.set([0, 0, 48]);
        new Camera2DController(this, this.camera);
        frameStage(this, 82, 54);

        // 2. Typographic Header
        this.setupSceneHeader();

        // 3. Mount Glassmorphic HTML HUD Overlay
        this.mountUI();

        // 4. Render Initial Case
        this.loadCase(this.activeCase);

        // 5. Render Loop
        this.always((deltaTime) => {
            this.animTime += 0.016;
            if (this.dynamicUpdateFn) {
                this.dynamicUpdateFn(this.animTime);
            }
            this.invalidate();
        });
    }

    private setupSceneHeader() {
        demoCaption(this, "Universal subdivision engine");

        const subtitle = new SDFText("Uniform spacing, adaptive subdivision and curve refinement", {
            fontSize: 1.5,
            anchor: CENTER,
            position: [0, 37, 0],
            fill: new Color(0.52, 0.65, 0.82, 0.85)
        });
        subtitle.setAsUI();
        this.add(subtitle);
    }

    // =========================================================================
    // CASE SWITCHING & DISPATCH
    // =========================================================================

    public loadCase(caseId: SubdivisionCaseId) {
        this.activeCase = caseId;
        this.dynamicUpdateFn = null;

        // Clear existing case entities
        if (this.activeEntities.length > 0) {
            this.remove(...this.activeEntities);
            this.activeEntities = [];
        }

        // Update UI HUD panel controls & metadata
        this.updateHUDForActiveCase();

        // Build active case geometry
        switch (caseId) {
            case "polyline":
                this.buildCase1_Polyline();
                break;
            case "closed_polygon":
                this.buildCase2_ClosedPolygon();
                break;
            case "bezier_split":
                this.buildCase3_BezierSplit();
                break;
            case "recursive_bezier":
                this.buildCase4_RecursiveBezier();
                break;
            case "arclength_vs_subdivision":
                this.buildCase5_ArcLengthVsSubdivision();
                break;
            case "packed_buffers":
                this.buildCase6_PackedBuffers();
                break;
            case "spatial_deformation":
                this.buildCase7_SpatialDeformation();
                break;
        }

        this.invalidate();
    }

    // =========================================================================
    // CASE 1: OPEN POLYLINE SUBDIVISION
    // =========================================================================

    private buildCase1_Polyline() {
        // Asymmetrical polyline with 4 control points
        const basePoints: Vec3[] = [
            new Vec3(-18, -4, 0),
            new Vec3(-7, 8, 0),
            new Vec3(5, -6, 0),
            new Vec3(18, 5, 0)
        ];

        // Options: Fixed vs MaxSegmentLength
        let options: number | SubdivisionOptions;
        if (this.polylineSubdivMode === "fixed") {
            options = {
                subdivisions: this.polylineFixedCount,
                accuracy: this.polylineAccuracy
            };
        } else {
            options = {
                maxSegmentLength: this.polylineMaxLen,
                accuracy: this.polylineAccuracy
            };
        }

        // Run SubdivisionEngine
        const subdivided = SubdivisionEngine.subdividePolyline(basePoints, options);

        // 1. Ghost Polyline (original coarse segments)
        const ghostLine = new Line(basePoints, {
            stroke: COLOR_LINE_BASE,
            strokeWidth: 0.12
        });
        this.activeEntities.push(ghostLine);

        // 2. Subdivided Smooth Polyline
        const smoothLine = new Line(subdivided, {
            stroke: COLOR_CYAN,
            strokeWidth: 0.22
        });
        this.activeEntities.push(smoothLine);

        // 3. Original Control Points (Cyan luminous circles with labels)
        basePoints.forEach((pt, idx) => {
            const node = new Circle(0.48, {
                position: [pt.x, pt.y, 0.05],
                fill: COLOR_CYAN,
                stroke: new Color(1, 1, 1, 0.9),
                strokeWidth: 0.08
            });
            this.activeEntities.push(node);

            const lbl = new SDFText(`P${idx}`, {
                fontSize: 0.65,
                anchor: CENTER,
                position: [pt.x, pt.y + 0.9, 0.1],
                fill: new Color(0.9, 0.95, 1.0, 1.0)
            });
            this.activeEntities.push(lbl);
        });

        // 4. Intermediate Subdivided Vertex Beads (Amber glowing dots)
        if (this.showVertexDots) {
            // Limit bead count to 150 for rendering performance
            const stride = Math.max(1, Math.ceil(subdivided.length / 120));
            for (let i = 0; i < subdivided.length; i += stride) {
                const pt = subdivided[i];
                const bead = new Circle(0.18, {
                    position: [pt.x, pt.y, 0.04],
                    fill: COLOR_AMBER,
                    stroke: new Color(0.2, 0.1, 0.0, 0.5),
                    strokeWidth: 0.03
                });
                this.activeEntities.push(bead);
            }
        }

        // Section labels & mode indicator in scene
        const modeText = this.polylineSubdivMode === "fixed"
            ? `Fixed Step Mode: ${this.polylineFixedCount} cuts/seg (Accuracy: ${this.polylineAccuracy.toFixed(1)}x)`
            : `Adaptive Max-Length Mode: max ${this.polylineMaxLen.toFixed(2)} units/seg (Accuracy: ${this.polylineAccuracy.toFixed(1)}x)`;

        const badge = new SDFText(modeText, {
            fontSize: 0.8,
            anchor: CENTER,
            position: [0, -11.0, 0],
            fill: COLOR_AMBER
        });
        this.activeEntities.push(badge);

        this.add(...this.activeEntities);
        this.updateTelemetry(basePoints.length, subdivided.length, `${(36.4 / (subdivided.length - 1)).toFixed(2)} units/seg`);
    }

    // =========================================================================
    // CASE 2: CLOSED 2D POLYGON PERIMETER
    // =========================================================================

    private buildCase2_ClosedPolygon() {
        // Generate base closed polygon vertices
        let baseVerts: Vec2[] = [];
        if (this.closedShape === "star") {
            const outerR = 9.0;
            const innerR = 4.2;
            const points = 5;
            for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points - Math.PI / 2;
                const r = i % 2 === 0 ? outerR : innerR;
                baseVerts.push(new Vec2(Math.cos(angle) * r, Math.sin(angle) * r));
            }
        } else if (this.closedShape === "hexagon") {
            const r = 8.5;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                baseVerts.push(new Vec2(Math.cos(angle) * r, Math.sin(angle) * r));
            }
        } else {
            // Concave Shield / Chevron
            baseVerts = [
                new Vec2(0, 9.0),
                new Vec2(8.5, 5.0),
                new Vec2(6.5, -4.5),
                new Vec2(0, -9.0),
                new Vec2(-6.5, -4.5),
                new Vec2(-8.5, 5.0)
            ];
        }

        // Subdivide closed polygon cyclically
        const subdivided = SubdivisionEngine.subdivideClosedPolygon2D(baseVerts, {
            subdivisions: this.closedSubdivs
        });

        // 1. Polygon Entity
        const polygon = new Poly(subdivided, {
            isClosed: true,
            stroke: COLOR_EMERALD,
            strokeWidth: 0.22,
            fill: new Color(0.04, 0.35, 0.28, 0.22)
        });
        this.activeEntities.push(polygon);

        // 2. Corner Node Circles
        baseVerts.forEach((pt, idx) => {
            const node = new Circle(0.42, {
                position: [pt.x, pt.y, 0.05],
                fill: COLOR_PURPLE,
                stroke: new Color(1, 1, 1, 0.9),
                strokeWidth: 0.08
            });
            this.activeEntities.push(node);
        });

        // 3. Subdivided perimeter beads
        const beads: Circle[] = [];
        if (this.showVertexDots) {
            const stride = Math.max(1, Math.ceil(subdivided.length / 100));
            for (let i = 0; i < subdivided.length; i += stride) {
                const pt = subdivided[i];
                const bead = new Circle(0.14, {
                    position: [pt.x, pt.y, 0.04],
                    fill: COLOR_EMERALD
                });
                this.activeEntities.push(bead);
                beads.push(bead);
            }
        }

        // 4. Dynamic ripple deformation when enabled
        if (this.closedDeform) {
            const deformed = subdivided.map(v => v.clone());
            this.dynamicUpdateFn = (time: number) => {
                for (let i = 0; i < subdivided.length; i++) {
                    const orig = subdivided[i];
                    const angle = Math.atan2(orig.y, orig.x);
                    const dist = Math.hypot(orig.x, orig.y);
                    const wave = Math.sin(angle * 5.0 + time * 3.5) * 0.95;
                    const r = Math.max(0.5, dist + wave);
                    deformed[i].x = Math.cos(angle) * r;
                    deformed[i].y = Math.sin(angle) * r;
                }
                polygon.setVertices(deformed, true);

                // Update bead positions
                if (beads.length > 0) {
                    const stride = Math.max(1, Math.ceil(subdivided.length / 100));
                    let beadIdx = 0;
                    for (let i = 0; i < subdivided.length && beadIdx < beads.length; i += stride) {
                        beads[beadIdx].transform.position.set([deformed[i].x, deformed[i].y, 0.04]);
                        beadIdx++;
                    }
                }
            };
        }

        const label = new SDFText(
            `Closed Polygon Perimeter: ${baseVerts.length} original corners -> ${subdivided.length} subdivided perimeter samples`,
            {
                fontSize: 0.75,
                anchor: CENTER,
                position: [0, -11.5, 0],
                fill: COLOR_EMERALD
            }
        );
        this.activeEntities.push(label);

        this.add(...this.activeEntities);
        this.updateTelemetry(baseVerts.length, subdivided.length, `${(subdivided.length / baseVerts.length).toFixed(0)}x densification`);
    }

    // =========================================================================
    // CASE 3: DE CASTELJAU BÉZIER SPLITTING
    // =========================================================================

    private buildCase3_BezierSplit() {
        const t = this.bezierT;

        if (this.bezierType === "cubic") {
            const p0 = new Vec2(-16, -5);
            const p1 = new Vec2(-7, 11);
            const p2 = new Vec2(6, -10);
            const p3 = new Vec2(16, 7);

            // Analytically split cubic curve at parameter t
            const [leftCurve, rightCurve] = SubdivisionEngine.splitCubicBezier(p0, p1, p2, p3, t);

            // Evaluate smooth polyline for left sub-curve
            const leftPts: Vec2[] = [];
            const rightPts: Vec2[] = [];
            const samples = 40;

            for (let i = 0; i <= samples; i++) {
                const u = i / samples;
                leftPts.push(this.evalCubic(leftCurve[0], leftCurve[1], leftCurve[2], leftCurve[3], u));
                rightPts.push(this.evalCubic(rightCurve[0], rightCurve[1], rightCurve[2], rightCurve[3], u));
            }

            // 1. Control Polygon Hull (Dashed gray line)
            const hull = new Line([p0, p1, p2, p3], {
                stroke: COLOR_GRAY,
                strokeWidth: 0.08
            });
            this.activeEntities.push(hull);

            // 2. De Casteljau Construction Lines:
            // Level 1: Q0-Q1-Q2
            const q0 = new Vec2(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t);
            const q1 = new Vec2(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
            const q2 = new Vec2(p2.x + (p3.x - p2.x) * t, p2.y + (p3.y - p2.y) * t);

            const l1 = new Line([q0, q1, q2], {
                stroke: new Color(0.0, 0.7, 0.9, 0.45),
                strokeWidth: 0.06
            });
            this.activeEntities.push(l1);

            // Level 2: R0-R1
            const r0 = new Vec2(q0.x + (q1.x - q0.x) * t, q0.y + (q1.y - q0.y) * t);
            const r1 = new Vec2(q1.x + (q2.x - q1.x) * t, q1.y + (q2.y - q1.y) * t);

            const l2 = new Line([r0, r1], {
                stroke: new Color(1.0, 0.3, 0.7, 0.45),
                strokeWidth: 0.06
            });
            this.activeEntities.push(l2);

            // Split Point S(t)
            const s = leftCurve[3];

            // 3. Left Sub-Curve (Electric Cyan)
            const lineLeft = new Line(leftPts, {
                stroke: COLOR_CYAN,
                strokeWidth: 0.28
            });
            this.activeEntities.push(lineLeft);

            // 4. Right Sub-Curve (Hot Pink)
            const lineRight = new Line(rightPts, {
                stroke: COLOR_PINK,
                strokeWidth: 0.28
            });
            this.activeEntities.push(lineRight);

            // 5. Control nodes P0..P3
            [p0, p1, p2, p3].forEach((pt, i) => {
                const node = new Circle(0.38, {
                    position: [pt.x, pt.y, 0.05],
                    fill: new Color(0.8, 0.85, 0.9, 0.9)
                });
                this.activeEntities.push(node);
                const lbl = new SDFText(`P${i}`, {
                    fontSize: 0.65,
                    anchor: CENTER,
                    position: [pt.x, pt.y + 0.8, 0.1],
                    fill: new Color(0.8, 0.85, 0.9, 1.0)
                });
                this.activeEntities.push(lbl);
            });

            // Intermediate de Casteljau nodes
            [q0, q1, q2].forEach(pt => {
                this.activeEntities.push(new Circle(0.2, { position: [pt.x, pt.y, 0.06], fill: COLOR_CYAN }));
            });
            [r0, r1].forEach(pt => {
                this.activeEntities.push(new Circle(0.2, { position: [pt.x, pt.y, 0.06], fill: COLOR_PINK }));
            });

            // Apex Split Point S(t)
            const apex = new Circle(0.65, {
                position: [s.x, s.y, 0.1],
                fill: COLOR_AMBER,
                stroke: new Color(1, 1, 1, 1),
                strokeWidth: 0.1
            });
            this.activeEntities.push(apex);

            const apexLabel = new SDFText(`S(t = ${t.toFixed(2)})`, {
                fontSize: 0.75,
                anchor: CENTER,
                position: [s.x, s.y - 1.1, 0.12],
                fill: COLOR_AMBER
            });
            this.activeEntities.push(apexLabel);

            const legend = new SDFText(
                `Left Sub-Curve: [P0, Q0, R0, S]  |  Right Sub-Curve: [S, R1, Q2, P3]  |  Continuous C1 Tangent at S`,
                {
                    fontSize: 0.72,
                    anchor: CENTER,
                    position: [0, -11.5, 0],
                    fill: new Color(0.85, 0.9, 1.0, 0.9)
                }
            );
            this.activeEntities.push(legend);

            this.add(...this.activeEntities);
            this.updateTelemetry(4, 8, `Exact C1 Split at t = ${t.toFixed(2)}`);
        } else {
            // Quadratic Bézier Split
            const p0 = new Vec2(-16, -4);
            const p1 = new Vec2(0, 12);
            const p2 = new Vec2(16, -4);

            const [leftCurve, rightCurve] = SubdivisionEngine.splitQuadraticBezier(p0, p1, p2, t);

            const leftPts: Vec2[] = [];
            const rightPts: Vec2[] = [];
            const samples = 35;
            for (let i = 0; i <= samples; i++) {
                const u = i / samples;
                leftPts.push(this.evalQuadratic(leftCurve[0], leftCurve[1], leftCurve[2], u));
                rightPts.push(this.evalQuadratic(rightCurve[0], rightCurve[1], rightCurve[2], u));
            }

            // Hull
            this.activeEntities.push(new Line([p0, p1, p2], { stroke: COLOR_GRAY, strokeWidth: 0.08 }));

            // Interpolation line
            const q0 = leftCurve[1];
            const q1 = rightCurve[1];
            this.activeEntities.push(new Line([q0, q1], { stroke: new Color(1, 0.8, 0.2, 0.5), strokeWidth: 0.07 }));

            // Left & Right
            this.activeEntities.push(new Line(leftPts, { stroke: COLOR_CYAN, strokeWidth: 0.28 }));
            this.activeEntities.push(new Line(rightPts, { stroke: COLOR_PINK, strokeWidth: 0.28 }));

            // Apex
            const s = leftCurve[2];
            this.activeEntities.push(new Circle(0.6, { position: [s.x, s.y, 0.1], fill: COLOR_AMBER }));

            this.add(...this.activeEntities);
            this.updateTelemetry(3, 6, `Quadratic Split at t = ${t.toFixed(2)}`);
        }
    }

    private evalCubic(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
        const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
        return new Vec2(x, y);
    }

    private evalQuadratic(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
        const u = 1 - t;
        const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
        const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
        return new Vec2(x, y);
    }

    // =========================================================================
    // CASE 4: RECURSIVE CUBIC BÉZIER SUBDIVISION
    // =========================================================================

    private buildCase4_RecursiveBezier() {
        const p0 = new Vec2(-17, -4);
        const p1 = new Vec2(-8, 12);
        const p2 = new Vec2(7, -11);
        const p3 = new Vec2(17, 6);

        // Recursively subdivide cubic curve to target depth
        const segments = SubdivisionEngine.subdivideCubicBezier(p0, p1, p2, p3, this.bezierDepth);

        const PALETTE = [
            COLOR_CYAN,
            COLOR_PINK,
            COLOR_AMBER,
            COLOR_EMERALD,
            COLOR_PURPLE,
            new Color(0.2, 0.85, 0.4, 0.95),
            new Color(1.0, 0.5, 0.2, 0.95),
            new Color(0.3, 0.65, 1.0, 0.95)
        ];

        // Draw each sub-curve and its bounding control polygon
        segments.forEach((seg, idx) => {
            const color = PALETTE[idx % PALETTE.length];

            // 1. Control Polygon Hull for this segment
            if (this.showHulls) {
                const hull = new Line(seg, {
                    stroke: new Color(color.r, color.g, color.b, 0.4),
                    strokeWidth: 0.06
                });
                this.activeEntities.push(hull);

                // Control points
                seg.forEach(cp => {
                    this.activeEntities.push(new Circle(0.16, {
                        position: [cp.x, cp.y, 0.04],
                        fill: new Color(color.r, color.g, color.b, 0.6)
                    }));
                });
            }

            // 2. Sampled Curve Segment
            const samples = 20;
            const pts: Vec2[] = [];
            for (let i = 0; i <= samples; i++) {
                pts.push(this.evalCubic(seg[0], seg[1], seg[2], seg[3], i / samples));
            }

            const curveLine = new Line(pts, {
                stroke: color,
                strokeWidth: 0.26
            });
            this.activeEntities.push(curveLine);
        });

        const info = new SDFText(
            `Recursion Depth: ${this.bezierDepth}  |  Analytical Segments: 2^${this.bezierDepth} = ${segments.length} Cubic Béziers`,
            {
                fontSize: 0.82,
                anchor: CENTER,
                position: [0, -11.5, 0],
                fill: COLOR_AMBER
            }
        );
        this.activeEntities.push(info);

        this.add(...this.activeEntities);
        this.updateTelemetry(4, segments.length * 4, `2^${this.bezierDepth} = ${segments.length} Cubic Curves`);
    }

    // =========================================================================
    // CASE 5: UNIFORM ARC-LENGTH RESAMPLING VS LINEAR SUBDIVISION
    // =========================================================================

    private buildCase5_ArcLengthVsSubdivision() {
        // Asymmetric path: long stretch -> short hairpin -> long stretch
        const basePoints: Vec2[] = [
            new Vec2(-18, 0),
            new Vec2(-2, 0),
            new Vec2(0, 4.5),
            new Vec2(2, 0),
            new Vec2(18, 0)
        ];

        // 1. Top Track: Naive Linear Subdivision (Offset Y = +5)
        const topBase = basePoints.map(p => new Vec2(p.x, p.y + 4.5));
        const topSubdivided = SubdivisionEngine.subdividePolyline(
            topBase.map(p => new Vec3(p.x, p.y, 0)),
            { subdivisions: Math.max(2, Math.floor(this.arcLengthTargetCount / 4)) }
        ).map(p => new Vec2(p.x, p.y));

        // 2. Bottom Track: Uniform Arc-Length Resampling (Offset Y = -5)
        const bottomBase = basePoints.map(p => new Vec2(p.x, p.y - 4.5));
        const bottomResampled = SubdivisionEngine.resampleByArcLength(bottomBase, this.arcLengthTargetCount);

        // --- Render Top Track ---
        const topLabel = new SDFText("Track A: Naive Linear Subdivision (Uneven Spacing / Velocity Spikes)", {
            fontSize: 0.72,
            position: [-18, 9.8, 0],
            fill: COLOR_PINK
        });
        this.activeEntities.push(topLabel);

        const topLine = new Line(topSubdivided, { stroke: COLOR_PINK, strokeWidth: 0.2 });
        this.activeEntities.push(topLine);

        // Top Beads
        topSubdivided.forEach(p => {
            this.activeEntities.push(new Circle(0.18, { position: [p.x, p.y, 0.04], fill: COLOR_PINK }));
        });

        // Top Velocity Runner
        const topRunner = new Circle(0.55, {
            position: [topSubdivided[0].x, topSubdivided[0].y, 0.1],
            fill: new Color(1, 1, 1, 1),
            stroke: COLOR_PINK,
            strokeWidth: 0.1
        });
        this.activeEntities.push(topRunner);

        // --- Render Bottom Track ---
        const bottomLabel = new SDFText("Track B: Uniform Arc-Length Resampling (Strictly Equidistant Δs / Constant Velocity)", {
            fontSize: 0.72,
            position: [-18, 0.5, 0],
            fill: COLOR_EMERALD
        });
        this.activeEntities.push(bottomLabel);

        const bottomLine = new Line(bottomResampled, { stroke: COLOR_EMERALD, strokeWidth: 0.2 });
        this.activeEntities.push(bottomLine);

        // Bottom Beads
        bottomResampled.forEach(p => {
            this.activeEntities.push(new Circle(0.18, { position: [p.x, p.y, 0.04], fill: COLOR_EMERALD }));
        });

        // Bottom Velocity Runner
        const bottomRunner = new Circle(0.55, {
            position: [bottomResampled[0].x, bottomResampled[0].y, 0.1],
            fill: new Color(1, 1, 1, 1),
            stroke: COLOR_EMERALD,
            strokeWidth: 0.1
        });
        this.activeEntities.push(bottomRunner);

        // Comparative Metrics in Scene
        const bottomNotice = new SDFText(
            `Notice: Runner B cruises smoothly at constant physical speed, while Runner A jumps wildly across long spans!`,
            {
                fontSize: 0.75,
                anchor: CENTER,
                position: [0, -11.0, 0],
                fill: COLOR_AMBER
            }
        );
        this.activeEntities.push(bottomNotice);

        // Dynamic runner update
        if (this.animateRunners) {
            this.dynamicUpdateFn = (time: number) => {
                this.runnerProgress = (this.runnerProgress + 0.008) % 1.0;

                // Index-based advancement along top subdivided array
                const topIdx = Math.floor(this.runnerProgress * (topSubdivided.length - 1));
                const ptTop = topSubdivided[topIdx];
                topRunner.transform.position.set([ptTop.x, ptTop.y, 0.1]);

                // Index-based advancement along bottom resampled array
                const botIdx = Math.floor(this.runnerProgress * (bottomResampled.length - 1));
                const ptBot = bottomResampled[botIdx];
                bottomRunner.transform.position.set([ptBot.x, ptBot.y, 0.1]);
            };
        }

        this.add(...this.activeEntities);
        this.updateTelemetry(basePoints.length, bottomResampled.length, "Strictly Uniform Arc-Length Δs");
    }

    // =========================================================================
    // CASE 6: PACKED WEBGPU VERTEX BUFFERS
    // =========================================================================

    private buildCase6_PackedBuffers() {
        // Create initial 3D packed vertices [x, y, z, pad]
        const rawPoints: [number, number, number][] = [
            [-17, -5, 0],
            [-10, 6, 3],
            [-2, -4, -2],
            [6, 7, 2],
            [12, -3, -1],
            [18, 5, 1]
        ];

        const vertexCount = rawPoints.length;
        const inputData = new Float32Array(vertexCount * 4);
        for (let i = 0; i < vertexCount; i++) {
            inputData[i * 4 + 0] = rawPoints[i][0];
            inputData[i * 4 + 1] = rawPoints[i][1];
            inputData[i * 4 + 2] = rawPoints[i][2];
            inputData[i * 4 + 3] = 0;
        }

        // Subdivide directly on packed Float32Array (Zero Allocation)
        const outputData = SubdivisionEngine.subdividePackedVertices3D(inputData, vertexCount, {
            subdivisions: this.packedSubdivSteps
        });

        const outVertexCount = outputData.length / 4;

        // Convert to Vec3 for rendering
        const linePoints: Vec3[] = [];
        for (let i = 0; i < outVertexCount; i++) {
            linePoints.push(new Vec3(
                outputData[i * 4 + 0],
                outputData[i * 4 + 1],
                outputData[i * 4 + 2]
            ));
        }

        // Render 3D Line
        const polyline = new Line(linePoints, {
            stroke: COLOR_CYAN,
            strokeWidth: 0.22
        });
        this.activeEntities.push(polyline);

        // Control nodes
        rawPoints.forEach((p, idx) => {
            const node = new Circle(0.45, {
                position: [p[0], p[1], 0.05],
                fill: COLOR_PURPLE,
                stroke: new Color(1, 1, 1, 1),
                strokeWidth: 0.08
            });
            this.activeEntities.push(node);

            const lbl = new SDFText(`V${idx}`, {
                fontSize: 0.65,
                anchor: CENTER,
                position: [p[0], p[1] + 0.85, 0.1],
                fill: new Color(0.9, 0.95, 1, 1)
            });
            this.activeEntities.push(lbl);
        });

        // Intermediate beads
        if (this.showVertexDots) {
            const stride = Math.max(1, Math.ceil(outVertexCount / 100));
            for (let i = 0; i < outVertexCount; i += stride) {
                const pt = linePoints[i];
                this.activeEntities.push(new Circle(0.14, {
                    position: [pt.x, pt.y, 0.04],
                    fill: COLOR_AMBER
                }));
            }
        }

        const banner = new SDFText(
            `WebGPU Ready: Float32Array [x, y, z, pad] -> 16-byte WGSL alignment with 0 intermediate JS objects`,
            {
                fontSize: 0.72,
                anchor: CENTER,
                position: [0, -11.0, 0],
                fill: COLOR_CYAN
            }
        );
        this.activeEntities.push(banner);

        this.add(...this.activeEntities);
        this.updateTelemetry(
            vertexCount,
            outVertexCount,
            `${inputData.byteLength}B in -> ${outputData.byteLength}B out`
        );
    }

    // =========================================================================
    // CASE 7: PRACTICAL SPATIAL DEFORMATION
    // =========================================================================

    private buildCase7_SpatialDeformation() {
        // Left: Unsubdivided Line (2 endpoints)
        const leftBase: Vec3[] = [
            new Vec3(-18, -4, 0),
            new Vec3(-2, -4, 0)
        ];

        // Right: Subdivided Line (N intermediate samples)
        const rightBase: Vec3[] = [
            new Vec3(2, -4, 0),
            new Vec3(18, -4, 0)
        ];
        const rightSubdivided = SubdivisionEngine.subdividePolyline(rightBase, {
            subdivisions: this.waveSubdivs
        });

        // 1. Headers
        const labelLeft = new SDFText("WITHOUT SUBDIVISION (2 Vertices)", {
            fontSize: 0.75,
            anchor: CENTER,
            position: [-10, 8.5, 0],
            fill: COLOR_PINK
        });
        this.activeEntities.push(labelLeft);

        const subLeft = new SDFText("Cannot bend: Remains a rigid straight stick", {
            fontSize: 0.6,
            anchor: CENTER,
            position: [-10, 7.2, 0],
            fill: new Color(0.7, 0.7, 0.8, 0.8)
        });
        this.activeEntities.push(subLeft);

        const labelRight = new SDFText(`WITH SUBDIVISION (${rightSubdivided.length} Vertices)`, {
            fontSize: 0.75,
            anchor: CENTER,
            position: [10, 8.5, 0],
            fill: COLOR_EMERALD
        });
        this.activeEntities.push(labelRight);

        const subRight = new SDFText("Fluid deformation: Curves into a smooth traveling wave", {
            fontSize: 0.6,
            anchor: CENTER,
            position: [10, 7.2, 0],
            fill: new Color(0.7, 0.7, 0.8, 0.8)
        });
        this.activeEntities.push(subRight);

        // 2. Lines
        const leftLine = new Line(leftBase, {
            stroke: COLOR_PINK,
            strokeWidth: 0.28
        });
        this.activeEntities.push(leftLine);

        const rightLine = new Line(rightSubdivided, {
            stroke: COLOR_EMERALD,
            strokeWidth: 0.28
        });
        this.activeEntities.push(rightLine);

        // 3. Node markers
        const leftNodes = leftBase.map(p => new Circle(0.4, { position: [p.x, p.y, 0.05], fill: COLOR_PINK }));
        this.activeEntities.push(...leftNodes);

        const rightNodes = [rightSubdivided[0], rightSubdivided[rightSubdivided.length - 1]].map(
            p => new Circle(0.4, { position: [p.x, p.y, 0.05], fill: COLOR_EMERALD })
        );
        this.activeEntities.push(...rightNodes);

        // 4. Dynamic wave update
        const displacedLeft = leftBase.map(p => p.clone());
        const displacedRight = rightSubdivided.map(p => p.clone());

        this.dynamicUpdateFn = (time: number) => {
            const amp = this.waveAmplitude;
            const freq = this.waveFrequency;

            // Deform Left (Only 2 vertices)
            for (let i = 0; i < leftBase.length; i++) {
                const orig = leftBase[i];
                displacedLeft[i].x = orig.x;
                displacedLeft[i].y = orig.y + Math.sin(orig.x * freq + time * 3.5) * amp;
            }
            leftLine.setVertices(displacedLeft);
            leftNodes[0].transform.position.set([displacedLeft[0].x, displacedLeft[0].y, 0.05]);
            leftNodes[1].transform.position.set([displacedLeft[1].x, displacedLeft[1].y, 0.05]);

            // Deform Right (Smooth dense vertices)
            for (let i = 0; i < rightSubdivided.length; i++) {
                const orig = rightSubdivided[i];
                displacedRight[i].x = orig.x;
                displacedRight[i].y = orig.y + Math.sin(orig.x * freq + time * 3.5) * amp;
            }
            rightLine.setVertices(displacedRight);
            rightNodes[0].transform.position.set([displacedRight[0].x, displacedRight[0].y, 0.05]);
            rightNodes[1].transform.position.set([
                displacedRight[displacedRight.length - 1].x,
                displacedRight[displacedRight.length - 1].y,
                0.05
            ]);
        };

        const explanation = new SDFText(
            `Spatial functions f(x, y) evaluate per-vertex. Dense subdivision is essential for high-fidelity graphics!`,
            {
                fontSize: 0.72,
                anchor: CENTER,
                position: [0, -11.0, 0],
                fill: COLOR_AMBER
            }
        );
        this.activeEntities.push(explanation);

        this.add(...this.activeEntities);
        this.updateTelemetry(2, rightSubdivided.length, `${this.waveSubdivs} cuts/seg`);
    }

    // =========================================================================
    // UI OVERLAY & CONTROLS
    // =========================================================================

    private mountUI() {
        if (typeof document === "undefined") return;

        const existing = document.getElementById("subdivision-demo-ui");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "subdivision-demo-ui";
        container.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            width: 320px;
            background: rgba(13, 17, 27, 0.88);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 16px;
            color: #eceff4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
            user-select: none;
        `;

        container.innerHTML = `
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 15px; font-weight: 700; color: #00e5ff; letter-spacing: 0.5px;">Subdivision Engine</h2>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #8892b0;">Retiam Geometry Core Showcase</p>
                </div>
                <span id="subdiv-case-badge" style="background: rgba(0, 229, 255, 0.15); border: 1px solid rgba(0, 229, 255, 0.4); color: #00e5ff; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">Case 1/7</span>
            </div>

            <!-- Case Navigator Dropdown -->
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 10px; color: #7f8fa6; margin-bottom: 4px; font-weight: 700; text-transform: uppercase;">Select Case</label>
                <div style="display: flex; gap: 6px;">
                    <select id="subdiv-case-select" style="flex: 1; padding: 6px 8px; background: #1a1d2e; border: 1px solid #2e3450; border-radius: 6px; color: #fff; font-size: 12px; outline: none; cursor: pointer;">
                        ${CASES.map((c, i) => `<option value="${c.id}">${c.title}</option>`).join("")}
                    </select>
                </div>
            </div>

            <!-- Previous / Next Case Buttons -->
            <div style="display: flex; gap: 6px; margin-bottom: 12px;">
                <button id="subdiv-btn-prev" style="flex: 1; padding: 5px; background: #1e2238; border: 1px solid #333a56; border-radius: 6px; color: #ccc; font-size: 11px; cursor: pointer;">◀ Previous</button>
                <button id="subdiv-btn-next" style="flex: 1; padding: 5px; background: #1e2238; border: 1px solid #333a56; border-radius: 6px; color: #ccc; font-size: 11px; cursor: pointer;">Next Case ▶</button>
            </div>

            <!-- Mathematical Formula Banner -->
            <div id="subdiv-formula-box" style="background: rgba(0, 0, 0, 0.35); border-left: 3px solid #00e5ff; padding: 8px 10px; border-radius: 4px; margin-bottom: 12px; font-family: monospace; font-size: 11px; color: #80d8ff;">
                steps = max(1, ceil(length / maxSegmentLength))
            </div>

            <!-- Case-Specific Dynamic Controls Container -->
            <div id="subdiv-controls-dynamic" style="margin-bottom: 12px;">
                <!-- Dynamically populated per case -->
            </div>

            <!-- Global Display Toggles -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px; margin-bottom: 12px;">
                <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a4b0be; cursor: pointer;">
                    <span>Show Intermediate Vertex Beads</span>
                    <input id="subdiv-tog-dots" type="checkbox" checked style="accent-color: #00e5ff; cursor: pointer;">
                </label>
            </div>

            <!-- Telemetry Metrics -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: rgba(0, 0, 0, 0.25); border-radius: 6px; padding: 8px; margin-bottom: 10px; font-size: 11px;">
                <div>
                    <span style="color: #7f8fa6; display: block; font-size: 9px; text-transform: uppercase;">Input Verts</span>
                    <strong id="subdiv-stat-in" style="color: #ff7675; font-size: 13px;">4</strong>
                </div>
                <div>
                    <span style="color: #7f8fa6; display: block; font-size: 9px; text-transform: uppercase;">Subdivided Verts</span>
                    <strong id="subdiv-stat-out" style="color: #55efc4; font-size: 13px;">48</strong>
                </div>
                <div style="grid-column: span 2; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 4px;">
                    <span style="color: #7f8fa6; font-size: 9px; text-transform: uppercase;">Resolution: </span>
                    <span id="subdiv-stat-res" style="color: #ffeaa7; font-weight: 600;">1.20 units/seg</span>
                </div>
            </div>

            <!-- Educational Description Card -->
            <div id="subdiv-case-desc" style="font-size: 11px; line-height: 1.45; color: #a4b0be; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 8px;">
                Subdivides open 2D/3D polylines into dense vertex arrays. Supports fixed subdivision counts, adaptive maxSegmentLength, and error tolerance thresholds.
            </div>
        `;

        compactDemoPanel(container, "Subdivision cases & controls");
        document.body.appendChild(container);
        this.uiContainer = container;

        this.elInputVerts = container.querySelector("#subdiv-stat-in");
        this.elOutputVerts = container.querySelector("#subdiv-stat-out");
        this.elResolution = container.querySelector("#subdiv-stat-res");
        this.elActiveFormula = container.querySelector("#subdiv-formula-box");
        this.elCaseDesc = container.querySelector("#subdiv-case-desc");

        // Event listeners
        const sel = container.querySelector<HTMLSelectElement>("#subdiv-case-select");
        sel?.addEventListener("change", (e) => {
            this.loadCase((e.target as HTMLSelectElement).value as SubdivisionCaseId);
        });

        container.querySelector("#subdiv-btn-prev")?.addEventListener("click", () => {
            const idx = CASES.findIndex(c => c.id === this.activeCase);
            const prevIdx = (idx - 1 + CASES.length) % CASES.length;
            this.loadCase(CASES[prevIdx].id);
            if (sel) sel.value = CASES[prevIdx].id;
        });

        container.querySelector("#subdiv-btn-next")?.addEventListener("click", () => {
            const idx = CASES.findIndex(c => c.id === this.activeCase);
            const nextIdx = (idx + 1) % CASES.length;
            this.loadCase(CASES[nextIdx].id);
            if (sel) sel.value = CASES[nextIdx].id;
        });

        container.querySelector<HTMLInputElement>("#subdiv-tog-dots")?.addEventListener("change", (e) => {
            this.showVertexDots = (e.target as HTMLInputElement).checked;
            this.loadCase(this.activeCase);
        });
    }

    private updateHUDForActiveCase() {
        if (!this.uiContainer) return;

        const currentCaseIndex = CASES.findIndex(c => c.id === this.activeCase);
        const info = CASES[currentCaseIndex];

        // Update badge, formula, description
        const badge = this.uiContainer.querySelector("#subdiv-case-badge");
        if (badge) badge.textContent = `Case ${currentCaseIndex + 1}/${CASES.length}`;

        if (this.elActiveFormula) this.elActiveFormula.textContent = info.formula;
        if (this.elCaseDesc) this.elCaseDesc.textContent = info.description;

        const sel = this.uiContainer.querySelector<HTMLSelectElement>("#subdiv-case-select");
        if (sel) sel.value = this.activeCase;

        // Populate case-specific controls
        const controlsDiv = this.uiContainer.querySelector<HTMLElement>("#subdiv-controls-dynamic");
        if (!controlsDiv) return;

        controlsDiv.innerHTML = this.getControlsHTMLForCase(this.activeCase);
        this.bindCaseControls(this.activeCase, controlsDiv);
    }

    private getControlsHTMLForCase(caseId: SubdivisionCaseId): string {
        switch (caseId) {
            case "polyline":
                return `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-size: 10px; color: #7f8fa6; margin-bottom: 3px; font-weight: 600; text-transform: uppercase;">Subdivision Mode</label>
                        <select id="ctrl-polyline-mode" style="width: 100%; padding: 4px 6px; background: #1e2238; border: 1px solid #333a56; border-radius: 4px; color: #fff; font-size: 11px;">
                            <option value="maxLen" ${this.polylineSubdivMode === "maxLen" ? "selected" : ""}>Adaptive: maxSegmentLength</option>
                            <option value="fixed" ${this.polylineSubdivMode === "fixed" ? "selected" : ""}>Fixed: subdivisions count</option>
                        </select>
                    </div>
                    <div id="ctrl-polyline-slider-wrap" style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">${this.polylineSubdivMode === "maxLen" ? "Max Segment Length" : "Subdivisions / Seg"}</span>
                            <span id="ctrl-polyline-val" style="color: #00e5ff; font-weight: 600;">
                                ${this.polylineSubdivMode === "maxLen" ? this.polylineMaxLen.toFixed(2) : this.polylineFixedCount}
                            </span>
                        </div>
                        <input id="ctrl-polyline-slider" type="range"
                            min="${this.polylineSubdivMode === "maxLen" ? "0.5" : "1"}"
                            max="${this.polylineSubdivMode === "maxLen" ? "6.0" : "35"}"
                            step="${this.polylineSubdivMode === "maxLen" ? "0.1" : "1"}"
                            value="${this.polylineSubdivMode === "maxLen" ? this.polylineMaxLen : this.polylineFixedCount}"
                            style="width: 100%; cursor: pointer; accent-color: #00e5ff;">
                    </div>
                    <div style="margin-bottom: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Accuracy Multiplier</span>
                            <span id="ctrl-polyline-acc-val" style="color: #ffeaa7; font-weight: 600;">${this.polylineAccuracy.toFixed(1)}x</span>
                        </div>
                        <input id="ctrl-polyline-acc" type="range" min="0.5" max="3.0" step="0.1" value="${this.polylineAccuracy}" style="width: 100%; cursor: pointer; accent-color: #ffeaa7;">
                    </div>
                `;

            case "closed_polygon":
                return `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-size: 10px; color: #7f8fa6; margin-bottom: 3px; font-weight: 600; text-transform: uppercase;">Closed Polygon Shape</label>
                        <select id="ctrl-closed-shape" style="width: 100%; padding: 4px 6px; background: #1e2238; border: 1px solid #333a56; border-radius: 4px; color: #fff; font-size: 11px;">
                            <option value="star" ${this.closedShape === "star" ? "selected" : ""}>5-Pointed Star (10 Corners)</option>
                            <option value="hexagon" ${this.closedShape === "hexagon" ? "selected" : ""}>Regular Hexagon (6 Corners)</option>
                            <option value="shield" ${this.closedShape === "shield" ? "selected" : ""}>Concave Shield (6 Corners)</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Subdivisions / Edge</span>
                            <span id="ctrl-closed-val" style="color: #55efc4; font-weight: 600;">${this.closedSubdivs}</span>
                        </div>
                        <input id="ctrl-closed-slider" type="range" min="1" max="25" step="1" value="${this.closedSubdivs}" style="width: 100%; cursor: pointer; accent-color: #55efc4;">
                    </div>
                    <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a4b0be; cursor: pointer;">
                        <span>Animate Perimeter Ripple</span>
                        <input id="ctrl-closed-deform" type="checkbox" ${this.closedDeform ? "checked" : ""} style="accent-color: #55efc4; cursor: pointer;">
                    </label>
                `;

            case "bezier_split":
                return `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-size: 10px; color: #7f8fa6; margin-bottom: 3px; font-weight: 600; text-transform: uppercase;">Bézier Curve Order</label>
                        <select id="ctrl-bezier-type" style="width: 100%; padding: 4px 6px; background: #1e2238; border: 1px solid #333a56; border-radius: 4px; color: #fff; font-size: 11px;">
                            <option value="cubic" ${this.bezierType === "cubic" ? "selected" : ""}>Cubic Bézier (4 Control Points)</option>
                            <option value="quadratic" ${this.bezierType === "quadratic" ? "selected" : ""}>Quadratic Bézier (3 Control Points)</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Split Parameter t</span>
                            <span id="ctrl-bezier-t-val" style="color: #ffeaa7; font-weight: 600;">${this.bezierT.toFixed(2)}</span>
                        </div>
                        <input id="ctrl-bezier-t" type="range" min="0.05" max="0.95" step="0.01" value="${this.bezierT}" style="width: 100%; cursor: pointer; accent-color: #ffeaa7;">
                    </div>
                `;

            case "recursive_bezier":
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Recursion Depth d</span>
                            <span id="ctrl-depth-val" style="color: #00e5ff; font-weight: 600;">${this.bezierDepth} (2^${this.bezierDepth} = ${Math.pow(2, this.bezierDepth)} segments)</span>
                        </div>
                        <input id="ctrl-depth-slider" type="range" min="0" max="4" step="1" value="${this.bezierDepth}" style="width: 100%; cursor: pointer; accent-color: #00e5ff;">
                    </div>
                    <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a4b0be; cursor: pointer;">
                        <span>Show Control Cages / Hulls</span>
                        <input id="ctrl-hulls-toggle" type="checkbox" ${this.showHulls ? "checked" : ""} style="accent-color: #00e5ff; cursor: pointer;">
                    </label>
                `;

            case "arclength_vs_subdivision":
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Target Resample Count N</span>
                            <span id="ctrl-arclength-val" style="color: #55efc4; font-weight: 600;">${this.arcLengthTargetCount}</span>
                        </div>
                        <input id="ctrl-arclength-slider" type="range" min="12" max="60" step="2" value="${this.arcLengthTargetCount}" style="width: 100%; cursor: pointer; accent-color: #55efc4;">
                    </div>
                    <label style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a4b0be; cursor: pointer;">
                        <span>Animate Velocity Runners</span>
                        <input id="ctrl-runners-toggle" type="checkbox" ${this.animateRunners ? "checked" : ""} style="accent-color: #55efc4; cursor: pointer;">
                    </label>
                `;

            case "packed_buffers":
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Subdivision Steps / Segment</span>
                            <span id="ctrl-packed-val" style="color: #00e5ff; font-weight: 600;">${this.packedSubdivSteps}</span>
                        </div>
                        <input id="ctrl-packed-slider" type="range" min="4" max="40" step="1" value="${this.packedSubdivSteps}" style="width: 100%; cursor: pointer; accent-color: #00e5ff;">
                    </div>
                    <div style="font-size: 10px; color: #8892b0; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px;">
                        Data Stride: <strong>4 floats (16 bytes)</strong><br>
                        Memory Allocation: <strong>0 JS Objects</strong>
                    </div>
                `;

            case "spatial_deformation":
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Subdivision Density (Right)</span>
                            <span id="ctrl-wave-subdiv-val" style="color: #55efc4; font-weight: 600;">${this.waveSubdivs}</span>
                        </div>
                        <input id="ctrl-wave-subdiv" type="range" min="4" max="80" step="2" value="${this.waveSubdivs}" style="width: 100%; cursor: pointer; accent-color: #55efc4;">
                    </div>
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Wave Amplitude</span>
                            <span id="ctrl-wave-amp-val" style="color: #ffeaa7; font-weight: 600;">${this.waveAmplitude.toFixed(1)}</span>
                        </div>
                        <input id="ctrl-wave-amp" type="range" min="0.5" max="5.0" step="0.1" value="${this.waveAmplitude}" style="width: 100%; cursor: pointer; accent-color: #ffeaa7;">
                    </div>
                    <div style="margin-bottom: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                            <span style="color: #7f8fa6;">Wave Frequency</span>
                            <span id="ctrl-wave-freq-val" style="color: #ff7675; font-weight: 600;">${this.waveFrequency.toFixed(2)}</span>
                        </div>
                        <input id="ctrl-wave-freq" type="range" min="0.2" max="1.5" step="0.05" value="${this.waveFrequency}" style="width: 100%; cursor: pointer; accent-color: #ff7675;">
                    </div>
                `;
        }
    }

    private bindCaseControls(caseId: SubdivisionCaseId, root: HTMLElement) {
        switch (caseId) {
            case "polyline": {
                const modeSel = root.querySelector<HTMLSelectElement>("#ctrl-polyline-mode");
                const slider = root.querySelector<HTMLInputElement>("#ctrl-polyline-slider");
                const accSlider = root.querySelector<HTMLInputElement>("#ctrl-polyline-acc");
                const valLabel = root.querySelector("#ctrl-polyline-val");
                const accLabel = root.querySelector("#ctrl-polyline-acc-val");

                modeSel?.addEventListener("change", (e) => {
                    this.polylineSubdivMode = (e.target as HTMLSelectElement).value as "fixed" | "maxLen";
                    this.updateHUDForActiveCase();
                    this.loadCase("polyline");
                });

                slider?.addEventListener("input", (e) => {
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    if (this.polylineSubdivMode === "maxLen") {
                        this.polylineMaxLen = v;
                        if (valLabel) valLabel.textContent = v.toFixed(2);
                    } else {
                        this.polylineFixedCount = Math.round(v);
                        if (valLabel) valLabel.textContent = `${this.polylineFixedCount}`;
                    }
                    this.loadCase("polyline");
                });

                accSlider?.addEventListener("input", (e) => {
                    this.polylineAccuracy = parseFloat((e.target as HTMLInputElement).value);
                    if (accLabel) accLabel.textContent = `${this.polylineAccuracy.toFixed(1)}x`;
                    this.loadCase("polyline");
                });
                break;
            }

            case "closed_polygon": {
                const shapeSel = root.querySelector<HTMLSelectElement>("#ctrl-closed-shape");
                const slider = root.querySelector<HTMLInputElement>("#ctrl-closed-slider");
                const deformTog = root.querySelector<HTMLInputElement>("#ctrl-closed-deform");
                const valLabel = root.querySelector("#ctrl-closed-val");

                shapeSel?.addEventListener("change", (e) => {
                    this.closedShape = (e.target as HTMLSelectElement).value as "star" | "hexagon" | "shield";
                    this.loadCase("closed_polygon");
                });

                slider?.addEventListener("input", (e) => {
                    this.closedSubdivs = parseInt((e.target as HTMLInputElement).value, 10);
                    if (valLabel) valLabel.textContent = `${this.closedSubdivs}`;
                    this.loadCase("closed_polygon");
                });

                deformTog?.addEventListener("change", (e) => {
                    this.closedDeform = (e.target as HTMLInputElement).checked;
                    this.loadCase("closed_polygon");
                });
                break;
            }

            case "bezier_split": {
                const typeSel = root.querySelector<HTMLSelectElement>("#ctrl-bezier-type");
                const tSlider = root.querySelector<HTMLInputElement>("#ctrl-bezier-t");
                const tVal = root.querySelector("#ctrl-bezier-t-val");

                typeSel?.addEventListener("change", (e) => {
                    this.bezierType = (e.target as HTMLSelectElement).value as "cubic" | "quadratic";
                    this.loadCase("bezier_split");
                });

                tSlider?.addEventListener("input", (e) => {
                    this.bezierT = parseFloat((e.target as HTMLInputElement).value);
                    if (tVal) tVal.textContent = this.bezierT.toFixed(2);
                    this.loadCase("bezier_split");
                });
                break;
            }

            case "recursive_bezier": {
                const depthSlider = root.querySelector<HTMLInputElement>("#ctrl-depth-slider");
                const hullsTog = root.querySelector<HTMLInputElement>("#ctrl-hulls-toggle");
                const depthVal = root.querySelector("#ctrl-depth-val");

                depthSlider?.addEventListener("input", (e) => {
                    this.bezierDepth = parseInt((e.target as HTMLInputElement).value, 10);
                    if (depthVal) depthVal.textContent = `${this.bezierDepth} (2^${this.bezierDepth} = ${Math.pow(2, this.bezierDepth)} segments)`;
                    this.loadCase("recursive_bezier");
                });

                hullsTog?.addEventListener("change", (e) => {
                    this.showHulls = (e.target as HTMLInputElement).checked;
                    this.loadCase("recursive_bezier");
                });
                break;
            }

            case "arclength_vs_subdivision": {
                const slider = root.querySelector<HTMLInputElement>("#ctrl-arclength-slider");
                const togRunners = root.querySelector<HTMLInputElement>("#ctrl-runners-toggle");
                const valLabel = root.querySelector("#ctrl-arclength-val");

                slider?.addEventListener("input", (e) => {
                    this.arcLengthTargetCount = parseInt((e.target as HTMLInputElement).value, 10);
                    if (valLabel) valLabel.textContent = `${this.arcLengthTargetCount}`;
                    this.loadCase("arclength_vs_subdivision");
                });

                togRunners?.addEventListener("change", (e) => {
                    this.animateRunners = (e.target as HTMLInputElement).checked;
                    this.loadCase("arclength_vs_subdivision");
                });
                break;
            }

            case "packed_buffers": {
                const slider = root.querySelector<HTMLInputElement>("#ctrl-packed-slider");
                const valLabel = root.querySelector("#ctrl-packed-val");

                slider?.addEventListener("input", (e) => {
                    this.packedSubdivSteps = parseInt((e.target as HTMLInputElement).value, 10);
                    if (valLabel) valLabel.textContent = `${this.packedSubdivSteps}`;
                    this.loadCase("packed_buffers");
                });
                break;
            }

            case "spatial_deformation": {
                const subSlider = root.querySelector<HTMLInputElement>("#ctrl-wave-subdiv");
                const ampSlider = root.querySelector<HTMLInputElement>("#ctrl-wave-amp");
                const freqSlider = root.querySelector<HTMLInputElement>("#ctrl-wave-freq");
                const subVal = root.querySelector("#ctrl-wave-subdiv-val");
                const ampVal = root.querySelector("#ctrl-wave-amp-val");
                const freqVal = root.querySelector("#ctrl-wave-freq-val");

                subSlider?.addEventListener("input", (e) => {
                    this.waveSubdivs = parseInt((e.target as HTMLInputElement).value, 10);
                    if (subVal) subVal.textContent = `${this.waveSubdivs}`;
                    this.loadCase("spatial_deformation");
                });

                ampSlider?.addEventListener("input", (e) => {
                    this.waveAmplitude = parseFloat((e.target as HTMLInputElement).value);
                    if (ampVal) ampVal.textContent = this.waveAmplitude.toFixed(1);
                });

                freqSlider?.addEventListener("input", (e) => {
                    this.waveFrequency = parseFloat((e.target as HTMLInputElement).value);
                    if (freqVal) freqVal.textContent = this.waveFrequency.toFixed(2);
                });
                break;
            }
        }
    }

    private updateTelemetry(inputVerts: number, outputVerts: number, resolution: string) {
        if (this.elInputVerts) this.elInputVerts.textContent = `${inputVerts}`;
        if (this.elOutputVerts) this.elOutputVerts.textContent = `${outputVerts}`;
        if (this.elResolution) this.elResolution.textContent = resolution;
    }
}
