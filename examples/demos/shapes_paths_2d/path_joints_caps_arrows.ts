// =========================================================================
// File: examples/demos/shapes_paths_2d/path_joints_caps_arrows.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    Vec3,
    Path,
    Rect,
    Arrow,
    SDFText,
    CapType,
    JointType,
    CENTER
} from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * Path Joints, Caps & 2D Arrow Styles Static Benchmark Scene
 *
 * Comprehensive static test scene verifying:
 * 1. Path Entity End Tip Types:
 *    - CapType.BUTT   (Flushes exactly at vertex endpoints)
 *    - CapType.ROUND  (Semicircular cap projecting by half stroke width)
 *    - CapType.SQUARE (Square box extending by half stroke width)
 *    Visualized with vertical datum reference lines and curved contours.
 *
 * 2. Path Entity Corner Joint Types:
 *    - JointType.MITER    (Sharp pointed corner apex)
 *    - JointType.ROUND    (Smooth filleted circular corner)
 *    - JointType.BEVEL    (Flat chamfered diagonal edge)
 *    - JointType.NO_JOINT (Raw unjoined segment endpoints)
 *    Visualized with sharp 40° acute chevrons, 90° right angles, and zig-zags.
 *
 * 3. 2D Arrow Entity Styles & Tip Types:
 *    - Tip types: 'triangle', 'stealth', 'line'
 *    - Trajectories: Linear straight, smooth Catmull-Rom splines, orthogonal polylines
 *    - Proportions: Needle dart, broad delta, bold accent, hairline technical
 */
export default class PathJointsCapsArrowsScene extends Scene {
    public async run() {
        this.disablePlayer()
        // 1. Setup Camera & Obsidian Canvas Palette
        this.camera.position.set([0, 0, 92]);
        new Camera2DController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. Typographic Header
        const mainTitle = new SDFText("PATH & 2D ARROW GEOMETRY BENCHMARK", {
            fontSize: 2.5,
            anchor: CENTER,
            position: [0, 26.5, 0],
            fill: new Color(0.96, 0.98, 1.0, 1.0)
        });
        this.add(mainTitle);

        const subtitle = new SDFText(
            "Static Inspection Suite • Path Caps (Butt, Round, Square) • Corner Joints (Miter, Round, Bevel, None) • 2D Arrow Tips & Styles",
            {
                fontSize: 1.02,
                anchor: CENTER,
                position: [0, 24.3, 0],
                fill: new Color(0.5, 0.65, 0.82, 0.9)
            }
        );
        this.add(subtitle);

        // 3. Background Card Plates (Glassmorphic Containers)
        const leftCard = new Rect(46.5, 46.5, { cornerRadius: 1.2 });
        leftCard.transform.position.set([-24.5, -1.0, -0.2]);
        leftCard.paint.fill = new Color(0.065, 0.08, 0.115, 0.65);
        leftCard.paint.stroke = new Color(0.2, 0.28, 0.4, 0.45);
        leftCard.paint.strokeWidth = 0.08;
        this.add(leftCard);

        const rightCard = new Rect(46.5, 46.5, { cornerRadius: 1.2 });
        rightCard.transform.position.set([24.5, -1.0, -0.2]);
        rightCard.paint.fill = new Color(0.065, 0.08, 0.115, 0.65);
        rightCard.paint.stroke = new Color(0.2, 0.28, 0.4, 0.45);
        rightCard.paint.strokeWidth = 0.08;
        this.add(rightCard);

        // =========================================================================
        // SECTION 1: PATH ENTITY — END TIP TYPES (STROKE CAPS)
        // =========================================================================
        const pathSectionTitle = new SDFText("1. PATH ENTITY: CAPS & JOINTS", {
            fontSize: 1.35,
            position: [-44.0, 20.0, 0],
            fill: new Color(0.25, 0.85, 1.0, 1.0)
        });
        this.add(pathSectionTitle);

        const capsHeader = new SDFText("A. Uniform Stroke Caps (Symmetric Alignment Datum)", {
            fontSize: 0.95,
            position: [-44.0, 18.0, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(capsHeader);

        // Faint Vertical Datum Reference Lines (at start x=-42, end x=-32)
        const datumStart = new Path("M -42 17.5 L -42 8.2");
        datumStart.paint.stroke = new Color(0.35, 0.45, 0.6, 0.4);
        datumStart.paint.strokeWidth = 0.04;
        this.add(datumStart);

        const datumEnd = new Path("M -32 17.5 L -32 8.2");
        datumEnd.paint.stroke = new Color(0.35, 0.45, 0.6, 0.4);
        datumEnd.paint.strokeWidth = 0.04;
        this.add(datumEnd);

        const datumLabel = new SDFText("↑ x=-42 (Start)     ↑ x=-32 (End)  [Datum Boundary Lines]", {
            fontSize: 0.58,
            position: [-43.5, 7.6, 0],
            fill: new Color(0.45, 0.55, 0.7, 0.75)
        });
        this.add(datumLabel);

        // -------------------------------------------------------------------------
        // Cap 1: BUTT
        // -------------------------------------------------------------------------
        const buttStraight = new Path("M -42 16.5 L -32 16.5");
        buttStraight.paint.stroke = new Color(1.0, 0.42, 0.42, 1.0);
        buttStraight.paint.strokeWidth = 1.25;
        buttStraight.paint.cap = CapType.BUTT;
        this.add(buttStraight);

        const buttCurve = new Path("M -29 15.6 C -26.5 18.3 -24.5 14.7 -22 17.4");
        buttCurve.paint.stroke = new Color(1.0, 0.42, 0.42, 1.0);
        buttCurve.paint.strokeWidth = 1.25;
        buttCurve.paint.cap = CapType.BUTT;
        this.add(buttCurve);

        const buttLabel = new SDFText("BUTT  (CapType.BUTT)", {
            fontSize: 0.8,
            position: [-19.5, 16.8, 0],
            fill: new Color(1.0, 0.6, 0.6, 1.0)
        });
        const buttDesc = new SDFText("Flushes strictly at endpoint; zero longitudinal protrusion", {
            fontSize: 0.62,
            position: [-19.5, 15.9, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(buttLabel, buttDesc);

        // -------------------------------------------------------------------------
        // Cap 2: ROUND
        // -------------------------------------------------------------------------
        const roundStraight = new Path("M -42 14.1 L -32 14.1");
        roundStraight.paint.stroke = new Color(0.12, 0.9, 0.72, 1.0);
        roundStraight.paint.strokeWidth = 1.25;
        roundStraight.paint.cap = CapType.ROUND;
        this.add(roundStraight);

        const roundCurve = new Path("M -29 13.2 C -26.5 15.9 -24.5 12.3 -22 15.0");
        roundCurve.paint.stroke = new Color(0.12, 0.9, 0.72, 1.0);
        roundCurve.paint.strokeWidth = 1.25;
        roundCurve.paint.cap = CapType.ROUND;
        this.add(roundCurve);

        const roundLabel = new SDFText("ROUND  (CapType.ROUND)", {
            fontSize: 0.8,
            position: [-19.5, 14.4, 0],
            fill: new Color(0.28, 1.0, 0.85, 1.0)
        });
        const roundDesc = new SDFText("Semicircular cap protruding outward by radius = width / 2", {
            fontSize: 0.62,
            position: [-19.5, 13.5, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(roundLabel, roundDesc);

        // -------------------------------------------------------------------------
        // Cap 3: SQUARE
        // -------------------------------------------------------------------------
        const squareStraight = new Path("M -42 11.7 L -32 11.7");
        squareStraight.paint.stroke = new Color(1.0, 0.76, 0.22, 1.0);
        squareStraight.paint.strokeWidth = 1.25;
        squareStraight.paint.cap = CapType.SQUARE;
        this.add(squareStraight);

        const squareCurve = new Path("M -29 10.8 C -26.5 13.5 -24.5 9.9 -22 12.6");
        squareCurve.paint.stroke = new Color(1.0, 0.76, 0.22, 1.0);
        squareCurve.paint.strokeWidth = 1.25;
        squareCurve.paint.cap = CapType.SQUARE;
        this.add(squareCurve);

        const squareLabel = new SDFText("SQUARE  (CapType.SQUARE)", {
            fontSize: 0.8,
            position: [-19.5, 12.0, 0],
            fill: new Color(1.0, 0.86, 0.4, 1.0)
        });
        const squareDesc = new SDFText("Rectangular cap extending beyond endpoint by width / 2", {
            fontSize: 0.62,
            position: [-19.5, 11.1, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(squareLabel, squareDesc);

        // -------------------------------------------------------------------------
        // Cap 4: TRIANGLE (NEW in 9-Bit System)
        // -------------------------------------------------------------------------
        const triangleStraight = new Path("M -42 9.3 L -32 9.3");
        triangleStraight.paint.stroke = new Color(0.85, 0.45, 1.0, 1.0);
        triangleStraight.paint.strokeWidth = 1.25;
        triangleStraight.paint.cap = CapType.TRIANGLE;
        this.add(triangleStraight);

        const triangleCurve = new Path("M -29 8.4 C -26.5 11.1 -24.5 7.5 -22 10.2");
        triangleCurve.paint.stroke = new Color(0.85, 0.45, 1.0, 1.0);
        triangleCurve.paint.strokeWidth = 1.25;
        triangleCurve.paint.cap = CapType.TRIANGLE;
        this.add(triangleCurve);

        const triangleLabel = new SDFText("TRIANGLE  (CapType.TRIANGLE)", {
            fontSize: 0.8,
            position: [-19.5, 9.6, 0],
            fill: new Color(0.9, 0.6, 1.0, 1.0)
        });
        const triangleDesc = new SDFText("Sharp 45° triangular tip projecting forward by width / 2", {
            fontSize: 0.62,
            position: [-19.5, 8.7, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(triangleLabel, triangleDesc);

        // =========================================================================
        // SECTION 1.B: DIRECTIONAL / ASYMMETRIC CAPS (INDEPENDENT START & END)
        // =========================================================================
        const asymHeader = new SDFText("B. Directional / Asymmetric Stroke Caps (Independent Start & End)", {
            fontSize: 0.95,
            position: [-44.0, 6.8, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(asymHeader);

        // Asymmetric Row 1: BUTT -> TRIANGLE
        const asym1Straight = new Path("M -42 5.2 L -32 5.2");
        asym1Straight.paint.stroke = new Color(0.35, 0.85, 1.0, 1.0);
        asym1Straight.paint.strokeWidth = 1.25;
        asym1Straight.paint.startCap = CapType.BUTT;
        asym1Straight.paint.endCap = CapType.TRIANGLE;
        this.add(asym1Straight);

        const asym1Curve = new Path("M -29 4.3 C -26.5 7.0 -24.5 3.4 -22 6.1");
        asym1Curve.paint.stroke = new Color(0.35, 0.85, 1.0, 1.0);
        asym1Curve.paint.strokeWidth = 1.25;
        asym1Curve.paint.startCap = CapType.BUTT;
        asym1Curve.paint.endCap = CapType.TRIANGLE;
        this.add(asym1Curve);

        const asym1Label = new SDFText("BUTT → TRIANGLE  (Directional Dart)", {
            fontSize: 0.8,
            position: [-19.5, 5.5, 0],
            fill: new Color(0.5, 0.9, 1.0, 1.0)
        });
        const asym1Desc = new SDFText("startCap = BUTT, endCap = TRIANGLE (Clean arrow contour)", {
            fontSize: 0.62,
            position: [-19.5, 4.6, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(asym1Label, asym1Desc);

        // Asymmetric Row 2: ROUND -> SQUARE
        const asym2Straight = new Path("M -42 2.8 L -32 2.8");
        asym2Straight.paint.stroke = new Color(0.95, 0.45, 0.75, 1.0);
        asym2Straight.paint.strokeWidth = 1.25;
        asym2Straight.paint.startCap = CapType.ROUND;
        asym2Straight.paint.endCap = CapType.SQUARE;
        this.add(asym2Straight);

        const asym2Curve = new Path("M -29 1.9 C -26.5 4.6 -24.5 1.0 -22 3.7");
        asym2Curve.paint.stroke = new Color(0.95, 0.45, 0.75, 1.0);
        asym2Curve.paint.strokeWidth = 1.25;
        asym2Curve.paint.startCap = CapType.ROUND;
        asym2Curve.paint.endCap = CapType.SQUARE;
        this.add(asym2Curve);

        const asym2Label = new SDFText("ROUND → SQUARE  (Hybrid Endings)", {
            fontSize: 0.8,
            position: [-19.5, 3.1, 0],
            fill: new Color(1.0, 0.6, 0.85, 1.0)
        });
        const asym2Desc = new SDFText("startCap = ROUND, endCap = SQUARE (Filleted head, block tail)", {
            fontSize: 0.62,
            position: [-19.5, 2.2, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(asym2Label, asym2Desc);

        // =========================================================================
        // SECTION 1.C: PATH ENTITY — CORNER JOINT TYPES (STROKE JOINS)
        // =========================================================================
        const jointsHeader = new SDFText("C. Corner Joint Types (Acute 40° V-Apex, 90° Steps, Multi-Peaks)", {
            fontSize: 0.95,
            position: [-44.0, 0.4, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(jointsHeader);

        const jointConfigs: {
            type: JointType;
            name: string;
            desc: string;
            color: Color;
            x: number;
        }[] = [
                {
                    type: JointType.MITER,
                    name: "MITER",
                    desc: "Sharp point",
                    color: new Color(1.0, 0.25, 0.55, 1.0),
                    x: -39.0
                },
                {
                    type: JointType.ROUND,
                    name: "ROUND",
                    desc: "Fillet arc",
                    color: new Color(0.3, 0.65, 1.0, 1.0),
                    x: -29.0
                },
                {
                    type: JointType.BEVEL,
                    name: "BEVEL",
                    desc: "Chamfer face",
                    color: new Color(0.0, 0.92, 0.5, 1.0),
                    x: -19.0
                },
                {
                    type: JointType.NO_JOINT,
                    name: "NO_JOINT",
                    desc: "Raw ends",
                    color: new Color(0.75, 0.55, 1.0, 1.0),
                    x: -9.0
                }
            ];

        for (const cfg of jointConfigs) {
            // Joint Column Title
            const title = new SDFText(cfg.name, {
                fontSize: 0.82,
                anchor: CENTER,
                position: [cfg.x, -0.9, 0],
                fill: cfg.color
            });
            const sub = new SDFText(cfg.desc, {
                fontSize: 0.60,
                anchor: CENTER,
                position: [cfg.x, -1.8, 0],
                fill: new Color(0.65, 0.72, 0.82, 0.75)
            });
            this.add(title, sub);

            // 1. Acute Chevron V-Peak (40° internal angle)
            const vPeak = new Path(
                `M ${cfg.x - 2.8} -5.4 L ${cfg.x} -2.6 L ${cfg.x + 2.8} -5.4`
            );
            vPeak.paint.stroke = cfg.color;
            vPeak.paint.strokeWidth = 1.15;
            vPeak.paint.joint = cfg.type;
            vPeak.paint.cap = CapType.BUTT;
            this.add(vPeak);

            // 2. 90° Right-Angle Step Corner
            const rightAngle = new Path(
                `M ${cfg.x - 2.8} -9.6 L ${cfg.x - 0.4} -9.6 L ${cfg.x - 0.4} -7.0 L ${cfg.x + 2.6} -7.0`
            );
            rightAngle.paint.stroke = cfg.color;
            rightAngle.paint.strokeWidth = 1.15;
            rightAngle.paint.joint = cfg.type;
            rightAngle.paint.cap = CapType.BUTT;
            this.add(rightAngle);

            // 3. Multi-Turn Zig-Zag Triple Peak Contour
            const zigZag = new Path(
                `M ${cfg.x - 3.2} -15.5 L ${cfg.x - 1.6} -12.0 L ${cfg.x} -15.5 L ${cfg.x + 1.6} -12.0 L ${cfg.x + 3.2} -15.5`
            );
            zigZag.paint.stroke = cfg.color;
            zigZag.paint.strokeWidth = 0.95;
            zigZag.paint.joint = cfg.type;
            zigZag.paint.cap = CapType.BUTT;
            this.add(zigZag);
        }

        const jointTypeAnnotations = new SDFText(
            "Row 1: Acute 40° Chevrons   •   Row 2: 90° Stepped Corners   •   Row 3: Triple-Peak Wave",
            {
                fontSize: 0.65,
                anchor: CENTER,
                position: [-24.0, -17.2, 0],
                fill: new Color(0.5, 0.6, 0.75, 0.8)
            }
        );
        this.add(jointTypeAnnotations);

        const bitArchitectureBadge = new SDFText(
            "Unified 9-Bit Packed Word: [0..2] JointType • [3..5] StartCap • [6..8] EndCap (common.wgsl unpack)",
            {
                fontSize: 0.60,
                anchor: CENTER,
                position: [-24.0, -19.4, 0],
                fill: new Color(0.35, 0.75, 0.95, 0.75)
            }
        );
        this.add(bitArchitectureBadge);

        // =========================================================================
        // SECTION 2: 2D ARROW ENTITY — TIPS & STYLES
        // =========================================================================
        const arrowSectionTitle = new SDFText("2. 2D ARROW ENTITY: TIPS & STYLES", {
            fontSize: 1.35,
            position: [3.5, 20.0, 0],
            fill: new Color(0.25, 0.85, 1.0, 1.0)
        });
        this.add(arrowSectionTitle);

        // -------------------------------------------------------------------------
        // 2.A: Core Tip Types Direct Comparison
        // -------------------------------------------------------------------------
        const arrowTipsHeader = new SDFText("A. Core Tip Types (triangle • stealth • line)", {
            fontSize: 0.95,
            position: [3.5, 18.0, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(arrowTipsHeader);

        // Tip 1: TRIANGLE
        const arrTriangle = new Arrow([5.5, 15.6, 0], [20.0, 15.6, 0], {
            tipType: 'triangle',
            headLength: 1.25,
            headWidth: 1.0,
            strokeWidth: 0.18,
            color: new Color(1.0, 0.55, 0.08, 1.0)
        });
        this.add(arrTriangle);

        const lblTriangle = new SDFText("tipType: 'triangle'", {
            fontSize: 0.85,
            position: [21.8, 16.0, 0],
            fill: new Color(1.0, 0.72, 0.3, 1.0)
        });
        const descTriangle = new SDFText("Solid filled planar wedge arrowhead", {
            fontSize: 0.68,
            position: [21.8, 15.0, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblTriangle, descTriangle);

        // Tip 2: STEALTH
        const arrStealth = new Arrow([5.5, 12.8, 0], [20.0, 12.8, 0], {
            tipType: 'stealth',
            headLength: 1.25,
            headWidth: 1.0,
            strokeWidth: 0.18,
            color: new Color(0.0, 0.94, 1.0, 1.0)
        });
        this.add(arrStealth);

        const lblStealth = new SDFText("tipType: 'stealth'", {
            fontSize: 0.85,
            position: [21.8, 13.2, 0],
            fill: new Color(0.35, 0.95, 1.0, 1.0)
        });
        const descStealth = new SDFText("Tactical swept-back delta wing with rear notch", {
            fontSize: 0.68,
            position: [21.8, 12.2, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblStealth, descStealth);

        // Tip 3: LINE
        const arrLine = new Arrow([5.5, 10.0, 0], [20.0, 10.0, 0], {
            tipType: 'line',
            headLength: 1.25,
            headWidth: 1.0,
            strokeWidth: 0.18,
            color: new Color(0.25, 1.0, 0.45, 1.0)
        });
        this.add(arrLine);

        const lblLine = new SDFText("tipType: 'line'", {
            fontSize: 0.85,
            position: [21.8, 10.4, 0],
            fill: new Color(0.5, 1.0, 0.65, 1.0)
        });
        const descLine = new SDFText("Open wireframe stroke chevron barb with rounded tip", {
            fontSize: 0.68,
            position: [21.8, 9.4, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblLine, descLine);

        // -------------------------------------------------------------------------
        // 2.B: Trajectory & Curvature Styles
        // -------------------------------------------------------------------------
        const trajHeader = new SDFText("B. Trajectory Styles (Curved Catmull-Rom Splines & Polyline Elbows)", {
            fontSize: 0.95,
            position: [3.5, 7.0, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(trajHeader);

        // Trajectory 1: Smooth Catmull-Rom Spline
        const arrSmooth = new Arrow(undefined, undefined, {
            points: [
                new Vec3(5.5, 2.5, 0),
                new Vec3(10.5, 5.5, 0),
                new Vec3(15.5, 0.8, 0),
                new Vec3(20.0, 4.5, 0)
            ],
            isSmooth: true,
            tension: 0.5,
            segments: 24,
            tipType: 'stealth',
            headLength: 1.15,
            headWidth: 0.9,
            strokeWidth: 0.16,
            color: new Color(0.85, 0.4, 1.0, 1.0)
        });
        this.add(arrSmooth);

        const lblSmooth = new SDFText("Smooth Spline Arrow (isSmooth: true)", {
            fontSize: 0.82,
            position: [21.8, 4.2, 0],
            fill: new Color(0.9, 0.55, 1.0, 1.0)
        });
        const descSmooth = new SDFText("Catmull-Rom curve with automatic tangential tip heading", {
            fontSize: 0.68,
            position: [21.8, 3.2, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblSmooth, descSmooth);

        // Trajectory 2: Orthogonal Polyline Route
        const arrOrtho = new Arrow(undefined, undefined, {
            points: [
                new Vec3(5.5, -1.0, 0),
                new Vec3(12.5, -1.0, 0),
                new Vec3(12.5, 1.5, 0),
                new Vec3(20.0, 1.5, 0)
            ],
            isSmooth: false,
            tipType: 'triangle',
            headLength: 1.15,
            headWidth: 0.9,
            strokeWidth: 0.16,
            color: new Color(0.2, 0.78, 1.0, 0.8)
        });
        this.add(arrOrtho);

        const lblOrtho = new SDFText("Orthogonal Polyline (isSmooth: false)", {
            fontSize: 0.82,
            position: [21.8, 0.8, 0],
            fill: new Color(0.45, 0.85, 1.0, 1.0)
        });
        const descOrtho = new SDFText("Multi-segment rectilinear circuit trace with 90° elbow", {
            fontSize: 0.68,
            position: [21.8, -0.2, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblOrtho, descOrtho);

        // -------------------------------------------------------------------------
        // 2.C: Head Proportions & Aesthetic Styles
        // -------------------------------------------------------------------------
        const propHeader = new SDFText("C. Head Proportions & Aesthetic Variations", {
            fontSize: 0.95,
            position: [3.5, -2.8, 0],
            fill: new Color(0.78, 0.88, 0.98, 0.95)
        });
        this.add(propHeader);

        // 1. Needle Dart Arrow (Long, slender)
        const arrNeedle = new Arrow([5.5, -5.2, 0], [19.5, -5.2, 0], {
            tipType: 'triangle',
            headLength: 1.75,
            headWidth: 0.5,
            strokeWidth: 0.1,
            color: new Color(1.0, 0.35, 0.65, 1.0)
        });
        this.add(arrNeedle);

        const lblNeedle = new SDFText("Slender Needle Dart", {
            fontSize: 0.8,
            position: [21.5, -4.8, 0],
            fill: new Color(1.0, 0.5, 0.75, 1.0)
        });
        const descNeedle = new SDFText("headLength: 1.75, headWidth: 0.50 (High aspect ratio)", {
            fontSize: 0.66,
            position: [21.5, -5.8, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblNeedle, descNeedle);

        // 2. Broad Delta Arrow (Short, wide)
        const arrBroad = new Arrow([5.5, -8.2, 0], [19.5, -8.2, 0], {
            tipType: 'stealth',
            headLength: 0.75,
            headWidth: 1.6,
            strokeWidth: 0.2,
            color: new Color(1.0, 0.85, 0.2, 1.0)
        });
        this.add(arrBroad);

        const lblBroad = new SDFText("Broad Delta Wing", {
            fontSize: 0.8,
            position: [21.5, -7.8, 0],
            fill: new Color(1.0, 0.9, 0.35, 1.0)
        });
        const descBroad = new SDFText("headLength: 0.75, headWidth: 1.60 (Wide spearhead)", {
            fontSize: 0.66,
            position: [21.5, -8.8, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblBroad, descBroad);

        // 3. Heavy Hero Accent Arrow (Thick stroke)
        const arrHeavy = new Arrow([5.5, -11.5, 0], [19.5, -11.5, 0], {
            tipType: 'stealth',
            headLength: 1.35,
            headWidth: 1.35,
            strokeWidth: 0.35,
            color: new Color(0.08, 0.95, 0.68, 1.0)
        });
        this.add(arrHeavy);

        const lblHeavy = new SDFText("Heavy Accent Marker", {
            fontSize: 0.8,
            position: [21.5, -11.1, 0],
            fill: new Color(0.3, 1.0, 0.8, 1.0)
        });
        const descHeavy = new SDFText("strokeWidth: 0.35, headLength: 1.35 (Diagrammatic callout)", {
            fontSize: 0.66,
            position: [21.5, -12.1, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblHeavy, descHeavy);

        // 4. Hairline CAD Precision Arrow
        const arrHairline = new Arrow([5.5, -14.5, 0], [19.5, -14.5, 0], {
            tipType: 'line',
            headLength: 0.7,
            headWidth: 0.45,
            strokeWidth: 0.065,
            color: new Color(0.4, 0.75, 1.0, 1.0)
        });
        this.add(arrHairline);

        const lblHairline = new SDFText("Hairline CAD Precision", {
            fontSize: 0.8,
            position: [21.5, -14.1, 0],
            fill: new Color(0.6, 0.85, 1.0, 1.0)
        });
        const descHairline = new SDFText("strokeWidth: 0.065, headLength: 0.70 (Fine technical drafting)", {
            fontSize: 0.66,
            position: [21.5, -15.1, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblHairline, descHairline);

        // 5. True Bidirectional Dual-Ended Arrow (Symmetric stealth heads)
        const arrBidir = new Arrow([5.5, -17.2, 0], [19.5, -17.2, 0], {
            startTipType: 'stealth',
            endTipType: 'stealth',
            headLength: 0.75,
            headWidth: 0.55,
            strokeWidth: 0.12,
            color: new Color(0.38, 0.75, 1.0, 1.0)
        });
        this.add(arrBidir);

        const lblBidir = new SDFText("Bidirectional Dual-Tip Arrow", {
            fontSize: 0.8,
            position: [21.5, -16.8, 0],
            fill: new Color(0.65, 0.85, 1.0, 1.0)
        });
        const descBidir = new SDFText("startTipType: 'stealth', endTipType: 'stealth' (Symmetric dual tips)", {
            fontSize: 0.66,
            position: [21.5, -17.8, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblBidir, descBidir);

        // 6. Mixed Asymmetric Tips & Custom Colors (Circle start + Triangle end)
        const arrMixed = new Arrow([5.5, -20.0, 0], [19.5, -20.0, 0], {
            startTipType: 'circle',
            endTipType: 'triangle',
            startHeadWidth: 0.45,
            endHeadLength: 0.8,
            endHeadWidth: 0.6,
            startColor: new Color(1.0, 0.45, 0.2, 1.0),
            endColor: new Color(0.3, 1.0, 0.6, 1.0),
            strokeWidth: 0.12,
            color: new Color(0.85, 0.88, 0.95, 0.9)
        });
        this.add(arrMixed);

        const lblMixed = new SDFText("Mixed Asymmetric Tips (Data Flow)", {
            fontSize: 0.8,
            position: [21.5, -19.6, 0],
            fill: new Color(1.0, 0.75, 0.4, 1.0)
        });
        const descMixed = new SDFText("startTipType: 'circle', endTipType: 'triangle' (Independent colors & shapes)", {
            fontSize: 0.66,
            position: [21.5, -20.6, 0],
            fill: new Color(0.68, 0.74, 0.84, 0.8)
        });
        this.add(lblMixed, descMixed);

    }
}
