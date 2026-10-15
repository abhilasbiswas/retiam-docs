import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/features/introducer_showcase.ts
//
// Showcase scene for all 27 new introducer animations.
// Run via the demo browser: "Animation Gallery > Introducer Animation Showcase"
// =========================================================================

import {
    CENTER,
    Scene, Color, Text, Circle, Rect, Triangle,
    Vec3, Vec2, Rate, FadeIn, FadeOut, Write,
    CameraController, wait,
    DOWN, UP, LEFT, RIGHT, ORIGIN,
} from "retiam";

// --- All 27 new introducers ---
import { SlideIn }              from "retiam";
import { SpinIn }               from "retiam";
import { GrowFromEdge }         from "retiam";
import { RevealFromClip }       from "retiam";
import { IrisIn }               from "retiam";
import { WipeIn }               from "retiam";
import { UnfoldFromCenter }     from "retiam";
import { AppearInstant }        from "retiam";
import { CrystallizeIn }        from "retiam";
import { TransmitIn }           from "retiam";
import { DrawBorderOnly }       from "retiam";
import { DropIn }               from "retiam";
import { WaveIn }               from "retiam";
import { CascadeIn }            from "retiam";
import { StaggerWrite }         from "retiam";
import { ScatterAssemble }      from "retiam";
import { BatchIntroduce }       from "retiam";
import { GlowIn }               from "retiam";
import { BurstIn }              from "retiam";
import { PopIn }                from "retiam";
import { EraseIn }              from "retiam";
import { TraceBack }            from "retiam";
import { BloomIn }              from "retiam";
import { ShimmerIn }            from "retiam";
import { TelegraphThenReveal }  from "retiam";
import { MaterializeFrom }      from "retiam";
import { TypewriterIn }         from "retiam";
import { Typewriter }           from "retiam";
import { BatchIntroduce as Batch } from "retiam";

// ---------------------------------------------------------------------------
// Layout constants — scene coords, camera Z = 120 → viewport ~±70 x ±45
// ---------------------------------------------------------------------------
const W  = 60;   // half-width of item area
const DX = 22;   // x spacing between items in a row
const DY = 18;   // y spacing between rows

// Colour palette
const C = {
    bg      : new Color(0.05, 0.06, 0.10, 1.0),
    header  : new Color(1.0, 0.85, 0.3, 1.0),
    section : new Color(0.4, 0.85, 1.0, 1.0),
    label   : new Color(0.75, 0.75, 0.85, 1.0),
    accent1 : new Color(0.35, 0.75, 1.0, 1.0),
    accent2 : new Color(1.0, 0.4, 0.55, 1.0),
    accent3 : new Color(0.35, 1.0, 0.65, 1.0),
    accent4 : new Color(1.0, 0.65, 0.2, 1.0),
    accent5 : new Color(0.75, 0.4, 1.0, 1.0),
    accent6 : new Color(0.2, 1.0, 0.85, 1.0),
    white   : new Color(1, 1, 1, 1),
    dim     : new Color(0.45, 0.45, 0.55, 1.0),
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Section title card — fades in at top, exits before the demo starts */
async function sectionTitle(scene: Scene, text: string) {
    const t = new Text(text, { anchor: CENTER, fontSize: 2.6, fill: C.section });
    t.transform.position = new Vec3(0, 38, 0);
    await scene.play(new FadeIn(t, { duration: 350 }));
    await scene.play(wait(500));
    await scene.play(new FadeOut(t, { duration: 280 }));
    scene.remove(t);
}

/** Small label below a shape */
function mkLabel(name: string, x: number, y: number): Text {
    const t = new Text(name, { anchor: CENTER, fontSize: 1.8, fill: C.label });
    t.transform.position = new Vec3(x, y - 8, 0);
    return t;
}

/** Fade out + remove a list of entities */
async function exit(scene: Scene, ...items: any[]) {
    const anims = items.map(e => new FadeOut(e, { duration: 280 }));
    await scene.play(anims);
    scene.remove(...items);
}

/** Create a colored rect shape */
function mkRect(w: number, h: number, col: Color, x = 0, y = 0): Rect {
    const r = new Rect(w, h);
    r.paint.fill = col;
    r.transform.position = new Vec3(x, y, 0);
    return r;
}

/** Create a colored circle */
function mkCircle(radius: number, col: Color, x = 0, y = 0): Circle {
    const c = new Circle(radius);
    c.paint.fill = col;
    c.transform.position = new Vec3(x, y, 0);
    return c;
}

/** Create a colored triangle */
function mkTri(col: Color, x = 0, y = 0): Triangle {
    const t = new Triangle([new Vec2(0, 6), new Vec2(-5.5, -4), new Vec2(5.5, -4)], { fill: col });
    t.transform.position = new Vec3(x, y, 0);
    return t;
}

// ---------------------------------------------------------------------------
// Main demo scene
// ---------------------------------------------------------------------------

export default class IntroducerShowcaseScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 120]);
        this.clearColor(C.bg);
        frameStage(this, 158, 110, 0);
        new CameraController(this, this.camera);

        // ── Master title ────────────────────────────────────────────────────
        const title = new Text("Introducer Animation Showcase", { anchor: CENTER, fontSize: 3.2, fill: C.header });
        title.transform.position = new Vec3(0, 40, 0);
        const subtitle = new Text(
            "27 new animations  ·  SlideIn / SpinIn / BurstIn / EraseIn / TraceBack and more",
            { anchor: CENTER, fontSize: 1.4, fill: C.dim }
        );
        subtitle.transform.position = new Vec3(0, 35, 0);
        await this.play(new FadeIn(title, { duration: 700 }));
        await this.play(new FadeIn(subtitle, { duration: 500 }));
        await this.play(wait(800));
        await exit(this, title, subtitle);

        // ================================================================
        // GROUP A — Pure StateAnimation introducers (10 animations)
        // ================================================================
        await sectionTitle(this, "Group A — StateAnimation Introducers");

        // ── Row 1: SlideIn (4 directions) ──────────────────────────────
        {
            const xs  = [-DX * 1.5, -DX * 0.5, DX * 0.5, DX * 1.5];
            const dirs: ("left"|"right"|"up"|"down")[] = ["left","right","up","down"];
            const cols = [C.accent1, C.accent2, C.accent3, C.accent4];
            const shapes = dirs.map((d, i) => mkRect(10, 7, cols[i], xs[i], 10));
            const labels = dirs.map((d, i) => mkLabel(`SlideIn\n"${d}"`, xs[i], 10));

            for (let i = 0; i < 4; i++) {
                await this.play(new SlideIn(shapes[i], { direction: dirs[i], duration: 700, distance: 20 }));
            }
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(1000));
            await exit(this, ...shapes, ...labels);
        }

        // ── SpinIn ──────────────────────────────────────────────────────
        {
            const shape = mkCircle(7, C.accent5, -15, 10);
            const shapeY = mkRect(9, 9, C.accent6, 0, 10);
            const shapeZ = mkTri(C.accent1, 15, 10);
            const lA = mkLabel("SpinIn Z-axis", -15, 10);
            const lB = mkLabel("SpinIn Y 180°", 0, 10);
            const lC = mkLabel("SpinIn X 360°", 15, 10);

            await this.play([
                new SpinIn(shape,  { axis: "z", angle: Math.PI * 2, duration: 900 }),
                new SpinIn(shapeY, { axis: "y", angle: Math.PI,     duration: 900 }),
                new SpinIn(shapeZ, { axis: "x", angle: Math.PI * 2, duration: 900 }),
            ]);
            await this.play([lA, lB, lC].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, shape, shapeY, shapeZ, lA, lB, lC);
        }

        // ── GrowFromEdge ────────────────────────────────────────────────
        {
            const edges: ("left"|"right"|"top"|"bottom")[] = ["bottom","top","left","right"];
            const cols = [C.accent2, C.accent3, C.accent4, C.accent5];
            const xs   = [-DX * 1.5, -DX * 0.5, DX * 0.5, DX * 1.5];
            const shapes = edges.map((e, i) => mkRect(10, 8, cols[i], xs[i], 10));
            const labels = edges.map((e, i) => mkLabel(`GrowFrom\n"${e}"`, xs[i], 10));

            for (let i = 0; i < 4; i++) {
                await this.play(new GrowFromEdge(shapes[i], { edge: edges[i], duration: 750 }));
            }
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── RevealFromClip ──────────────────────────────────────────────
        {
            const xs  = [-DX * 1.5, -DX * 0.5, DX * 0.5, DX * 1.5];
            const dirs: ("left"|"right"|"up"|"down")[] = ["left","right","up","down"];
            const cols = [C.accent1, C.accent4, C.accent3, C.accent6];
            const shapes = dirs.map((d, i) => mkRect(12, 8, cols[i], xs[i], 10));
            const labels = dirs.map((d, i) => mkLabel(`RevealClip\n"${d}"`, xs[i], 10));

            for (let i = 0; i < 4; i++) {
                await this.play(new RevealFromClip(shapes[i], { direction: dirs[i], duration: 800 }));
            }
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── IrisIn ──────────────────────────────────────────────────────
        {
            const s1 = mkRect(14, 9, C.accent5, -18, 10);
            const s2 = mkRect(14, 9, C.accent2,  0,  10);
            const s3 = mkRect(14, 9, C.accent3,  18, 10);
            const l1 = mkLabel("IrisIn center", -18, 10);
            const l2 = mkLabel("IrisIn top-left", 0, 10);
            const l3 = mkLabel("IrisIn bottom-right", 18, 10);

            await this.play([
                new IrisIn(s1, { cx: 0.5, cy: 0.5, duration: 900 }),
                new IrisIn(s2, { cx: 0.1, cy: 0.9, duration: 900 }),
                new IrisIn(s3, { cx: 0.9, cy: 0.1, duration: 900 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ── WipeIn ──────────────────────────────────────────────────────
        {
            const xs  = [-DX * 1.5, -DX * 0.5, DX * 0.5, DX * 1.5];
            const dirs: ("left"|"right"|"up"|"down")[] = ["left","right","up","down"];
            const cols = [C.accent6, C.accent1, C.accent4, C.accent5];
            const shapes = dirs.map((d, i) => mkRect(12, 8, cols[i], xs[i], 12));
            // Second row: with bandWidth — sits below row 1 with room for both labels
            const shapes2 = dirs.map((d, i) => mkRect(12, 8, new Color(cols[i].r*0.6, cols[i].g*0.6, cols[i].b*0.6, 1), xs[i], 0));
            const labels  = dirs.map((d, i) => mkLabel(`WipeIn "${d}"`, xs[i], 12));
            const labels2 = dirs.map((d, i) => mkLabel(`WipeIn band 0.2`, xs[i], 0));

            for (let i = 0; i < 4; i++) {
                await this.play(new WipeIn(shapes[i],  { direction: dirs[i], duration: 800 }));
                await this.play(new WipeIn(shapes2[i], { direction: dirs[i], bandWidth: 0.2, duration: 800 }));
            }
            await this.play([...labels, ...labels2].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...shapes2, ...labels, ...labels2);
        }

        // ── UnfoldFromCenter ────────────────────────────────────────────
        {
            const s1 = mkRect(16, 8, C.accent1, -20, 10);
            const s2 = mkRect(16, 8, C.accent2,  0,  10);
            const s3 = mkRect(16, 8, C.accent3,  20, 10);
            const l1 = mkLabel("Unfold X", -20, 10);
            const l2 = mkLabel("Unfold Y",   0, 10);
            const l3 = mkLabel("Unfold XY",  20, 10);

            await this.play([
                new UnfoldFromCenter(s1, { axis: "x", duration: 900 }),
                new UnfoldFromCenter(s2, { axis: "y", duration: 900 }),
                new UnfoldFromCenter(s3, { axis: "xy", duration: 900 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ── AppearInstant ───────────────────────────────────────────────
        {
            const shapes: Circle[] = [];
            const labels: Text[]   = [];
            for (let i = 0; i < 5; i++) {
                const c = mkCircle(5, new Color(0.3 + i*0.15, 0.8 - i*0.1, 1.0 - i*0.15, 1), -24 + i*12, 10);
                const l = mkLabel(`Instant #${i+1}`, -24 + i*12, 10);
                shapes.push(c); labels.push(l);
            }
            const descText = new Text(
                "AppearInstant — entities added to scene with zero animation",
                { anchor: CENTER, fontSize: 1.4, fill: C.dim }
            );
            descText.transform.position = new Vec3(0, -4, 0);
            this.add(descText);

            // Fire all at once with a tiny stagger to show them "popping"
            for (const s of shapes) {
                await this.play(new AppearInstant(s));
                await this.play(wait(80));
            }
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels, descText);
        }

        // ── CrystallizeIn (3D material) ─────────────────────────────────
        {
            // Use Rect + manually set material to show the effect
            const shapes = [-20, 0, 20].map((x, i) => {
                const s = mkRect(12, 9, new Color(0, 0, 0, 0), x, 10);
                s.material.roughness = [0.05, 0.5, 0.9][i];
                s.material.metallic  = [0.9,  0.4, 0.0][i];
                s.paint.fill = [C.accent4, C.accent6, C.accent5][i];
                return s;
            });
            const labels = shapes.map((_, i) =>
                mkLabel(`CrystallizeIn\n${["metallic","half","rough"][i]}`, [-20,0,20][i], 10)
            );

            await this.play(shapes.map(s => new CrystallizeIn(s, {
                fromRoughness: 1.0, fromMetallic: 0.0, fromOpacity: 0.0, duration: 1100
            })));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(1000));
            await exit(this, ...shapes, ...labels);
        }

        // ── TransmitIn ──────────────────────────────────────────────────
        {
            const s1 = mkRect(12, 9, C.accent1, -18, 10);
            const s2 = mkRect(12, 9, C.accent3,  0,  10);
            const s3 = mkRect(12, 9, C.accent5,  18, 10);
            s1.material.transmission = 0.0;
            s2.material.transmission = 0.0;
            s3.material.transmission = 0.0;
            const l1 = mkLabel("TransmitIn IOR 1.5", -18, 10);
            const l2 = mkLabel("TransmitIn IOR 2.4", 0, 10);
            const l3 = mkLabel("TransmitIn + fade",  18, 10);

            await this.play([
                new TransmitIn(s1, { fromTransmission: 1.0, fromIor: 1.5, duration: 1000 }),
                new TransmitIn(s2, { fromTransmission: 1.0, fromIor: 2.4, duration: 1000 }),
                new TransmitIn(s3, { fromTransmission: 1.0, fadeOpacity: true, duration: 1000 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ================================================================
        // GROUP B — Concurrent introducers (8 animations)
        // ================================================================
        await sectionTitle(this, "Group B — Concurrent Introducers");

        // ── DrawBorderOnly ──────────────────────────────────────────────
        {
            const s1 = mkTri(C.accent1, -20, 10);
            s1.paint.strokeWidth = 0.8;
            const s2 = mkRect(12, 9, C.accent4, 0, 10);
            s2.paint.strokeWidth = 0.8;
            const s3 = mkCircle(6, C.accent3, 20, 10);
            s3.paint.strokeWidth = 0.8;
            const l1 = mkLabel("DrawBorderOnly\ntriangle", -20, 10);
            const l2 = mkLabel("DrawBorderOnly\nrect", 0, 10);
            const l3 = mkLabel("DrawBorderOnly\ncircle", 20, 10);

            await this.play([
                new DrawBorderOnly(s1 as any, { duration: 1000 }),
                new DrawBorderOnly(s2 as any, { duration: 1000 }),
                new DrawBorderOnly(s3 as any, { duration: 1000 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ── DropIn ──────────────────────────────────────────────────────
        {
            const xs   = [-DX, 0, DX];
            const cols = [C.accent2, C.accent5, C.accent6];
            const froms: ("down"|"left"|"up")[] = ["down", "left", "up"];
            const shapes = froms.map((d, i) => mkCircle(6, cols[i], xs[i], 10));
            const labels = froms.map((d, i) => mkLabel(`DropIn from "${d}"`, xs[i], 10));

            for (let i = 0; i < 3; i++) {
                await this.play(new DropIn(shapes[i], {
                    direction: froms[i], distance: 18, duration: 900
                }));
            }
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── WaveIn ──────────────────────────────────────────────────────
        {
            // Build a parent entity with 6 circle children
            const COLS = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5, C.accent6];
            const parent = mkRect(0, 0, new Color(0,0,0,0), 0, 10); // invisible container
            const children = COLS.map((c, i) => {
                const ch = mkCircle(4.5, c, -25 + i * 10, 10);
                parent.add(ch);
                return ch;
            });
            const label = mkLabel("WaveIn — grow (lagRatio=0.18)", 0, 10);

            await this.play(new WaveIn(parent, {
                animation: "grow", lagRatio: 0.18, duration: 1200
            }));
            await this.play(new FadeIn(label, { duration: 300 }));
            await this.play(wait(900));
            await exit(this, parent, ...children, label);
        }

        // ── CascadeIn ───────────────────────────────────────────────────
        {
            const COLS = [C.accent3, C.accent6, C.accent1, C.accent4, C.accent2, C.accent5, C.accent6, C.accent3];
            const parent = mkRect(0, 0, new Color(0,0,0,0), 0, 10); // invisible container
            const children = COLS.map((c, i) => {
                const ch = mkCircle(3.5, c, -28 + i * 8, 10);
                parent.add(ch);
                return ch;
            });
            const label = mkLabel("CascadeIn — jitter=0.6 randomSeed=7", 0, 10);

            await this.play(new CascadeIn(parent, {
                animation: "grow", jitter: 0.6, randomSeed: 7, duration: 1300
            }));
            await this.play(new FadeIn(label, { duration: 300 }));
            await this.play(wait(900));
            await exit(this, parent, ...children, label);
        }

        // ── StaggerWrite ────────────────────────────────────────────────
        {
            // Three triangles as VectorEntities in a parent container
            const t1 = mkTri(C.accent2, -20, 10);
            const t2 = mkTri(C.accent4,  0,  10);
            const t3 = mkTri(C.accent6,  20, 10);
            [t1, t2, t3].forEach(t => { t.paint.strokeWidth = 1.2; });
            const parent = mkRect(0, 0, new Color(0,0,0,0), 0, 10);
            parent.add(t1, t2, t3);
            const label = mkLabel("StaggerWrite — 3 VectorEntities (lagRatio=0.25)", 0, 10);

            await this.play(new StaggerWrite(parent, {
                lagRatio: 0.25, duration: 1400
            }));
            await this.play(new FadeIn(label, { duration: 300 }));
            await this.play(wait(900));
            await exit(this, parent, t1, t2, t3, label);
        }

        // ── ScatterAssemble ─────────────────────────────────────────────
        {
            const n = 9;
            const parent = mkRect(0, 0, new Color(0,0,0,0), 0, 10);
            const children = Array.from({ length: n }, (_, i) => {
                const angle = (i / n) * Math.PI * 2;
                const ch = mkCircle(3, new Color(
                    0.4 + 0.6 * Math.cos(angle),
                    0.4 + 0.6 * Math.sin(angle + 1),
                    0.8, 1
                ), Math.cos(angle) * 12, Math.sin(angle) * 6 + 10);
                parent.add(ch);
                return ch;
            });
            const label = mkLabel("ScatterAssemble — 9 circles, spreadRadius=18", 0, 10);

            await this.play(new ScatterAssemble(parent, {
                spreadRadius: 18, randomSeed: 99, fadeIn: true, duration: 1200
            }));
            await this.play(new FadeIn(label, { duration: 300 }));
            await this.play(wait(900));
            await exit(this, parent, ...children, label);
        }

        // ── BatchIntroduce ──────────────────────────────────────────────
        {
            const s1 = mkRect(10, 7, C.accent1, -20, 10);
            const s3 = mkTri(C.accent5, 20, 10);
            const l1 = mkLabel("FadeIn", -20, 10);
            const l2 = mkLabel("BatchIntroduce", 0, 10);
            const l3 = mkLabel("SlideIn", 20, 10);
            const label = mkLabel("BatchIntroduce — 3 different introducers, one await", 0, -2);

            await this.play(new Batch([
                new FadeIn(s1, { duration: 900 }),
                new SlideIn(s3, { direction: "left", distance: 18, duration: 900 }),
            ], { lagRatio: 0.0 }));
            await this.play([l1, l2, l3, label].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s3, l1, l2, l3, label);
        }

        // ── GlowIn ──────────────────────────────────────────────────────
        {
            const GLOWS = [
                { col: C.accent4, glowCol: new Color(1, 0.65, 0.1, 1), peak: 6 },
                { col: C.accent1, glowCol: new Color(0.2, 0.7, 1.0, 1), peak: 4 },
                { col: C.accent6, glowCol: new Color(0.1, 1.0, 0.8, 1), peak: 8 },
            ];
            const shapes = GLOWS.map((g, i) => {
                const s = mkCircle(7, g.col, [-20, 0, 20][i], 10);
                s.material.emColor = g.glowCol.rgba;
                s.material.emStrength = 0.15;
                return s;
            });
            const labels = GLOWS.map((g, i) =>
                mkLabel(`GlowIn peak=${g.peak}`, [-20, 0, 20][i], 10)
            );

            await this.play(shapes.map((s, i) =>
                new GlowIn(s, {
                    peakEmStrength: GLOWS[i].peak,
                    glowColor: GLOWS[i].glowCol,
                    peakAt: 0.4,
                    duration: 1100
                })
            ));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ================================================================
        // GROUP C — Custom Animation introducers (9 animations)
        // ================================================================
        await sectionTitle(this, "Group C — Custom update() Introducers");

        // ── BurstIn ─────────────────────────────────────────────────────
        {
            const peaks = [1.2, 1.4, 1.6];
            const cols  = [C.accent2, C.accent4, C.accent6];
            const shapes = peaks.map((p, i) => mkCircle(7, cols[i], [-20, 0, 20][i], 10));
            const labels = peaks.map((p, i) =>
                mkLabel(`BurstIn peak=${p}`, [-20, 0, 20][i], 10)
            );

            await this.play(shapes.map((s, i) =>
                new BurstIn(s, { peakScale: peaks[i], fadeIn: true, duration: 800 })
            ));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── PopIn ────────────────────────────────────────────────────────
        {
            const peaks = [1.1, 1.2, 1.35];
            const peakAts = [0.5, 0.65, 0.8];
            const cols   = [C.accent3, C.accent5, C.accent1];
            const shapes = peaks.map((p, i) => mkRect(11, 8, cols[i], [-20, 0, 20][i], 10));
            const labels = peaks.map((p, i) =>
                mkLabel(`PopIn peak=${p}\npeakAt=${peakAts[i]}`, [-20, 0, 20][i], 10)
            );

            await this.play(shapes.map((s, i) =>
                new PopIn(s, { peakScale: peaks[i], peakAt: peakAts[i], duration: 600 })
            ));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── EraseIn ──────────────────────────────────────────────────────
        {
            const s1 = mkTri(C.accent2, -20, 10);
            const s2 = mkCircle(7, C.accent4, 0, 10);
            const s3 = mkRect(12, 8, C.accent6, 20, 10);
            [s1, s2, s3].forEach(s => { s.paint.strokeWidth = 1.5; });
            const l1 = mkLabel("EraseIn cursor=0.05\nfillAtEnd=true", -20, 10);
            const l2 = mkLabel("EraseIn cursor=0.15\nfillAtEnd=true", 0, 10);
            const l3 = mkLabel("EraseIn cursor=0.3\nfillAtEnd=false", 20, 10);

            await this.play([
                new EraseIn(s1 as any, { cursorWidth: 0.05, fillAtEnd: true,  duration: 1400 }),
                new EraseIn(s2 as any, { cursorWidth: 0.15, fillAtEnd: true,  duration: 1400 }),
                new EraseIn(s3 as any, { cursorWidth: 0.30, fillAtEnd: false, duration: 1400 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ── TraceBack ─────────────────────────────────────────────────────
        {
            const s1 = mkTri(C.accent1, -20, 10);
            const s2 = mkRect(12, 8, C.accent3, 0, 10);
            const s3 = mkCircle(7, C.accent5, 20, 10);
            [s1, s2, s3].forEach(s => { s.paint.strokeWidth = 0.5; });
            const l1 = mkLabel("TraceBack fillDelay=0.4", -20, 10);
            const l2 = mkLabel("TraceBack fillDelay=0.6",   0, 10);
            const l3 = mkLabel("TraceBack fillDelay=0.8",  20, 10);

            await this.play([
                new TraceBack(s1 as any, { fillDelay: 0.4, duration: 1300 }),
                new TraceBack(s2 as any, { fillDelay: 0.6, duration: 1300 }),
                new TraceBack(s3 as any, { fillDelay: 0.8, duration: 1300 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ── BloomIn ───────────────────────────────────────────────────────
        {
            const mults = [2, 4, 7];
            const cols  = [C.accent4, C.accent2, C.accent6];
            const shapes = mults.map((m, i) => {
                const s = mkTri(cols[i], [-20, 0, 20][i], 10);
                s.paint.strokeWidth = 0.5;
                return s;
            });
            const labels = mults.map((m, i) =>
                mkLabel(`BloomIn ×${m}`, [-20, 0, 20][i], 10)
            );

            await this.play(shapes.map((s, i) =>
                new BloomIn(s as any, {
                    strokeWidthMultiplier: mults[i],
                    stroke: new Color(cols[i].r, cols[i].g, cols[i].b, 1),
                    duration: 1200
                })
            ));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── ShimmerIn ─────────────────────────────────────────────────────
        {
            // Create child grid to shimmer across — parent Entity container
            const n = 6;
            const shimParent = mkRect(0, 0, new Color(0,0,0,0), 0, 10);
            const children = Array.from({ length: n }, (_, i) => {
                const c = mkCircle(4, C.accent6, -25 + i * 10, 10);
                c.material.emColor = [0.4, 0.8, 1.0];
                c.material.emStrength = 0.1;
                shimParent.add(c);
                return c;
            });
            const label = mkLabel("ShimmerIn — holographic sweep (lagRatio=0.08)", 0, 10);

            await this.play(new ShimmerIn(shimParent, {
                peakEmStrength: 5,
                shimmerColor: new Color(0.4, 0.8, 1.0, 1),
                lagRatio: 0.08,
                fadeIn: true,
                duration: 1400
            }));
            await this.play(new FadeIn(label, { duration: 300 }));
            await this.play(wait(900));
            await exit(this, shimParent, ...children, label);
        }

        // ── TelegraphThenReveal ───────────────────────────────────────────
        {
            const types: ("grow"|"fade"|"burst")[] = ["grow", "fade", "burst"];
            const cols = [C.accent1, C.accent4, C.accent5];
            const shapes = types.map((t, i) => mkCircle(7, cols[i], [-20, 0, 20][i], 10));
            const labels = types.map((t, i) =>
                mkLabel(`Telegraph+\n"${t}"`, [-20, 0, 20][i], 10)
            );

            await this.play(shapes.map((s, i) =>
                new TelegraphThenReveal(s, {
                    revealType: types[i],
                    telegraphScale: 0.06,
                    telegraphDuration: 0.25,
                    duration: 1200
                })
            ));
            await this.play(labels.map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, ...shapes, ...labels);
        }

        // ── MaterializeFrom ───────────────────────────────────────────────
        {
            // Three rects with rect children to serve as "wireframe"
            const makeComposite = (col: Color, x: number) => {
                const root = mkRect(12, 10, col, x, 10);
                // Add child strips as "wireframe" sub-parts
                const h1 = mkRect(12, 0.5, new Color(1, 1, 1, 0.6), x, 12);
                const h2 = mkRect(12, 0.5, new Color(1, 1, 1, 0.6), x, 10);
                const h3 = mkRect(12, 0.5, new Color(1, 1, 1, 0.6), x,  8);
                h1.transform.t1 = 0; h1.transform.t2 = 0;
                h2.transform.t1 = 0; h2.transform.t2 = 0;
                h3.transform.t1 = 0; h3.transform.t2 = 0;

                root.add(h1, h2, h3);
                return root;
            };

            const s1 = makeComposite(C.accent1, -20);
            const s2 = makeComposite(C.accent3,   0);
            const s3 = makeComposite(C.accent5,  20);
            const l1 = mkLabel("MaterializeFrom\nwireframe→fill", -20, 10);
            const l2 = mkLabel("MaterializeFrom\ndelay=0.4", 0, 10);
            const l3 = mkLabel("MaterializeFrom\ndelay=0.6", 20, 10);

            await this.play([
                new MaterializeFrom(s1, { surfaceDelay: 0.5, duration: 1400 }),
                new MaterializeFrom(s2, { surfaceDelay: 0.4, duration: 1400 }),
                new MaterializeFrom(s3, { surfaceDelay: 0.6, duration: 1400 }),
            ]);
            await this.play([l1, l2, l3].map(l => new FadeIn(l, { duration: 300 })));
            await this.play(wait(900));
            await exit(this, s1, s2, s3, l1, l2, l3);
        }

        // ================================================================
        // GROUP D — Typewriter (type → delete → retype + cursor styles)
        // ================================================================
        await sectionTitle(this, "Group D — Typewriter");

        // ── Demo 1: cursor style showcase (5 cursors side-by-side) ────────
        {
            const cursorDefs: Array<{ style: string; label: string; col: Color; x: number }> = [
                { style: "pipe",       label: "cursor: pipe",       col: C.accent1, x: -42 },
                { style: "underscore", label: "cursor: underscore", col: C.accent2, x: -21 },
                { style: "block",      label: "cursor: block",      col: C.accent3, x:   0 },
                { style: "thin_block", label: "cursor: thin_block", col: C.accent4, x:  21 },
                { style: "arrow",      label: "cursor: arrow",      col: C.accent5, x:  42 },
            ];

            const texts  = cursorDefs.map(d => {
                const t = new Text("", { anchor: CENTER, fontSize: 2.8, fill: d.col });
                t.transform.position = new Vec3(d.x, 10, 0);
                return t;
            });
            const infos  = cursorDefs.map(d => {
                const t = new Text(d.label, { anchor: CENTER, fontSize: 1.4, fill: C.dim });
                t.transform.position = new Vec3(d.x, 2, 0);
                this.add(t);
                return t;
            });

            // Type "Hello" simultaneously in all 5, each with its own cursor
            await this.play(texts.map((t, i) =>
                new Typewriter(t, [
                    { op: "type", text: "Hello", charDelay: 80, jitter: 0.15 },
                    { op: "pause", duration: 600 },
                ], { cursor: cursorDefs[i].style as any, cursorBlinkMs: 500, keepCursor: true })
            ));
            await this.play(wait(800));
            await exit(this, ...texts, ...infos);
        }

        // ── Demo 2: type → delete → retype (changing text effect) ──────
        {
            const t = new Text("", { anchor: CENTER, fontSize: 3.4, fill: C.accent2 });
            t.transform.position = new Vec3(0, 10, 0);
            const info = new Text(
                "type → pause → delete → type  (pipe cursor, jitter=0.25)",
                { anchor: CENTER, fontSize: 1.5, fill: C.dim }
            );
            info.transform.position = new Vec3(0, 2, 0);
            this.add(info);

            await this.play(new Typewriter(t, [
                { op: "type",   text: "Hello, World!", charDelay: 70,  jitter: 0.25, randomSeed: 7 },
                { op: "pause",  duration: 700 },
                { op: "delete", count: 6,              charDelay: 45,  jitter: 0.1  },
                { op: "type",   text: "Retiam!",       charDelay: 75,  jitter: 0.3,  randomSeed: 13 },
                { op: "pause",  duration: 900 },
            ], { cursor: "pipe", cursorBlinkMs: 480, keepCursor: false }));

            await this.play(wait(400));
            await exit(this, t, info);
        }

        // ── Demo 3: multi-change sequence (underscore cursor, no blink) ──
        {
            const t = new Text("", { anchor: CENTER, fontSize: 3.2, fill: C.accent5 });
            t.transform.position = new Vec3(0, 10, 0);
            const info = new Text(
                "underscore cursor  •  cursorBlinkMs=0 (solid)  •  3-word sequence",
                { anchor: CENTER, fontSize: 1.5, fill: C.dim }
            );
            info.transform.position = new Vec3(0, 2, 0);
            this.add(info);

            await this.play(new Typewriter(t, [
                { op: "type",   text: "Design.",  charDelay: 90,  jitter: 0.2 },
                { op: "pause",  duration: 600 },
                { op: "delete",                    charDelay: 45               },  // delete all
                { op: "type",   text: "Animate.", charDelay: 85,  jitter: 0.2 },
                { op: "pause",  duration: 600 },
                { op: "delete",                    charDelay: 45               },
                { op: "type",   text: "Ship.",    charDelay: 100, jitter: 0.2 },
                { op: "pause",  duration: 1000 },
            ], { cursor: "underscore", cursorBlinkMs: 0, keepCursor: false }));

            await this.play(wait(400));
            await exit(this, t, info);
        }

        // ── Demo 4: block cursor + clear step ───────────────────────
        {
            const t = new Text("", { anchor: CENTER, fontSize: 3.0, fill: C.accent6 });
            t.transform.position = new Vec3(0, 10, 0);
            const info = new Text(
                "block cursor  •  op:clear (instant wipe)  •  then retype fast",
                { anchor: CENTER, fontSize: 1.5, fill: C.dim }
            );
            info.transform.position = new Vec3(0, 2, 0);
            this.add(info);

            await this.play(new Typewriter(t, [
                { op: "type",  text: "Loading data...", charDelay: 60 },
                { op: "pause", duration: 500 },
                { op: "clear" },                                            // instant wipe
                { op: "type",  text: "Done ✓",          charDelay: 55, jitter: 0.35 },
                { op: "pause", duration: 1000 },
            ], { cursor: "block", cursorBlinkMs: 400, keepCursor: false }));

            await this.play(wait(400));
            await exit(this, t, info);
        }

        // ================================================================
        // GRAND FINALE — All at once
        // ================================================================
        await sectionTitle(this, "Grand Finale — Everything at Once");

        {
            // 27 different shapes in a 9×3 grid, each gets a different animation
            const grid: { shape: any; anim: any }[] = [];
            const cols3 = [C.accent1, C.accent2, C.accent3, C.accent4, C.accent5, C.accent6];
            const W2 = 9, H2 = 7;
            const positions: [number, number][] = [];
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 9; col++) {
                    positions.push([-40 + col * 10, 15 - row * DY]);
                }
            }

            const makeShape = (i: number, x: number, y: number) => {
                const col = cols3[i % cols3.length];
                if (i % 3 === 0) return mkCircle(4, col, x, y);
                if (i % 3 === 1) return mkRect(8, 6, col, x, y);
                return mkTri(col, x, y);
            };

            const animFactories = [
                (s: any) => new SlideIn(s,            { direction: "left",   duration: 1000 }),
                (s: any) => new SlideIn(s,            { direction: "up",     duration: 1000 }),
                (s: any) => new SpinIn(s,             { axis: "z",           duration: 1000 }),
                (s: any) => new GrowFromEdge(s,       { edge: "bottom",      duration: 1000 }),
                (s: any) => new RevealFromClip(s,     { direction: "left",   duration: 1000 }),
                (s: any) => new IrisIn(s,             { cx: 0.5, cy: 0.5,   duration: 1000 }),
                (s: any) => new WipeIn(s,             { direction: "up",     duration: 1000 }),
                (s: any) => new UnfoldFromCenter(s,   { axis: "x",           duration: 1000 }),
                (s: any) => new AppearInstant(s),
                (s: any) => new DropIn(s,             { direction: "down",   duration: 1000 }),
                (s: any) => new BurstIn(s,            { peakScale: 1.3,      duration: 1000 }),
                (s: any) => new PopIn(s,              { peakScale: 1.2,      duration: 1000 }),
                (s: any) => new TelegraphThenReveal(s,{ revealType: "grow",  duration: 1000 }),
                (s: any) => new TelegraphThenReveal(s,{ revealType: "burst", duration: 1000 }),
                (s: any) => new FadeIn(s,             {                      duration: 1000 }),
                (s: any) => new SlideIn(s,            { direction: "right",  duration: 1000 }),
                (s: any) => new SlideIn(s,            { direction: "down",   duration: 1000 }),
                (s: any) => new SpinIn(s,             { axis: "y",           duration: 1000 }),
                (s: any) => new GrowFromEdge(s,       { edge: "top",         duration: 1000 }),
                (s: any) => new RevealFromClip(s,     { direction: "up",     duration: 1000 }),
                (s: any) => new WipeIn(s,             { direction: "right",  duration: 1000 }),
                (s: any) => new UnfoldFromCenter(s,   { axis: "y",           duration: 1000 }),
                (s: any) => new BurstIn(s,            { peakScale: 1.5,      duration: 1000 }),
                (s: any) => new PopIn(s,              { peakScale: 1.1,      duration: 1000 }),
                (s: any) => new FadeIn(s,             {                      duration: 1000 }),
                (s: any) => new DropIn(s,             { direction: "left",   duration: 1000 }),
                (s: any) => new SpinIn(s,             { axis: "x",           duration: 1000 }),
            ];

            const shapes = positions.map(([ x, y ], i) => makeShape(i, x, y));
            const anims  = shapes.map((s, i) => animFactories[i % animFactories.length](s));

            const finaleText = new Text("All 27 Introducers — Simultaneously", { anchor: CENTER,
                fontSize: 2.8, fill: C.header
            });
            finaleText.transform.position = new Vec3(0, 37, 0);
            await this.play(new FadeIn(finaleText, { duration: 400 }));

            await this.play(anims);
            await this.play(wait(1500));

            // Cascade them all out
            await this.play(new FadeOut(finaleText, { duration: 400 }));
            await this.play(shapes.map(s => new FadeOut(s, { duration: 500 })));
            this.remove(finaleText, ...shapes);
        }

        // ── End card ────────────────────────────────────────────────────
        const endCard = new Text("Showcase Complete ✓", { anchor: CENTER, fontSize: 4.5, fill: C.accent3 });
        endCard.transform.position = new Vec3(0, 5, 0);
        const endSub = new Text(
            "SlideIn · SpinIn · GrowFromEdge · RevealFromClip · IrisIn · WipeIn · UnfoldFromCenter\n" +
            "AppearInstant · CrystallizeIn · TransmitIn · DrawBorderOnly · DropIn · WaveIn\n" +
            "CascadeIn · StaggerWrite · ScatterAssemble · BatchIntroduce · GlowIn\n" +
            "BurstIn · PopIn · EraseIn · TraceBack · BloomIn · ShimmerIn · TelegraphThenReveal · MaterializeFrom",
            { anchor: CENTER, fontSize: 1.25, fill: C.dim }
        );
        endSub.transform.position = new Vec3(0, -8, 0);

        await this.play(new BurstIn(endCard, { peakScale: 1.25, duration: 900 }));
        await this.play(new FadeIn(endSub, { duration: 600 }));
        await this.play(wait(3000));
    }
}
