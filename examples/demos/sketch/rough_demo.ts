import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/rough_demo.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    Path,
    VGroup,
    hex,
    createAnim,
    writeAnim,
    Rect,
    Elipse,
    RED,
    ORANGE,
    BLUE_A,
    BLUE_D,
    BLUE_E,
    BLUE_C,
    GREEN_D
} from "retiam";
import { rough, roughify, RoughShape } from "retiam/rough";

/**
 * rough.js randomness is expressed in absolute pixels (about 2px of jitter per unit of
 * roughness), so shapes must be generated at a realistic pixel size, exactly like the
 * canvas version on roughjs.com, and only then scaled into world units.
 */
const PX = 4.0 / 220;            // world units per rough.js pixel (a 220px card is 4 world units)
const CARD = 220;                // card size in rough.js pixels
const PITCH = 240.9;             // card center-to-card center distance in pixels

type Op = { op: string; data: number[] };

/** Multiplies every number of an absolute-command SVG path (no arcs). */
function scalePath(d: string, k: number): string {
    return d.replace(/-?\d+(\.\d+)?/g, (n) => String(parseFloat(n) * k));
}

/** rough.js OpSet -> SVG path (Y flipped: canvas Y-down -> Retiam Y-up). */
function opsToSvg(ops: Op[], closeFirstContourOnly = false): string {
    let d = "";
    let first = true;
    for (const op of ops) {
        if (op.op === "move") {
            if (closeFirstContourOnly && !first) break;
            first = false;
            d += `M ${op.data[0] * PX} ${-op.data[1] * PX} `;
        } else if (op.op === "bcurveTo") {
            d += `C ${op.data[0] * PX} ${-op.data[1] * PX} ${op.data[2] * PX} ${-op.data[3] * PX} ${op.data[4] * PX} ${-op.data[5] * PX} `;
        } else if (op.op === "lineTo") {
            d += `L ${op.data[0] * PX} ${-op.data[1] * PX} `;
        }
    }
    return (closeFirstContourOnly ? d + "Z" : d).trim();
}

/**
 * For SVG-path shapes rough.js emits a separate move+curve per segment per pass.
 * Chain each pass into one continuous stroke so joins stay clean.
 */
function chainPasses(ops: Op[]): string {
    const passes: Op[][][] = [[], []];
    for (let i = 0; i + 1 < ops.length; i += 2) {
        passes[(i / 2) % 2].push([ops[i], ops[i + 1]]);
    }
    return passes.map((segs) => {
        if (!segs.length) return "";
        let d = `M ${segs[0][0].data[0] * PX} ${-segs[0][0].data[1] * PX} `;
        for (const [, c] of segs) {
            const v = c.data;
            d += `C ${v[0] * PX} ${-v[1] * PX} ${v[2] * PX} ${-v[3] * PX} ${v[4] * PX} ${-v[5] * PX} `;
        }
        return d.trim();
    }).join(" ");
}

interface DrawStyle {
    stroke: string;
    fill: string;
    strokeWidthPx?: number;     // rough.js strokeWidth, default 2
    fillWeightPx?: number;      // rough.js fillWeight, default strokeWidth / 2
    chain?: boolean;
    z: number;
}

/** Turns a rough.js drawable into Retiam paths: solid fill, hachure lines, outline. */
function build(drawable: any, s: DrawStyle): VGroup {
    const group = new VGroup();
    const sw = s.strokeWidthPx ?? 2;
    const fw = s.fillWeightPx ?? sw / 2;

    for (const set of drawable.sets) {
        let path: Path | null = null;
        if (set.type === "fillPath") {
            path = new Path(opsToSvg(set.ops, true));
            path.paint.fill = hex(s.fill);
            path.paint.stroke = Color.NONE;
            path.paint.strokeWidth = 0;
            path.transform.position.set([0, 0, s.z + 0.01]);
        } else if (set.type === "fillSketch") {
            path = new Path(opsToSvg(set.ops));
            path.paint.fill = Color.NONE;
            path.paint.stroke = hex(s.fill);
            path.paint.strokeWidth = fw * PX;
            path.transform.position.set([0, 0, s.z + 0.02]);
        } else if (set.type === "path") {
            path = new Path(s.chain ? chainPasses(set.ops) : opsToSvg(set.ops));
            path.paint.fill = Color.NONE;
            path.paint.stroke = hex(s.stroke);
            path.paint.strokeWidth = sw * PX;
            path.transform.position.set([0, 0, s.z + 0.03]);
        }
        if (path) group.add(path);
    }
    return group;
}

export default class RoughDemoScene extends Scene {
    public override async run(): Promise<void> {
        new Camera2DController(this, this.camera, { zoom: 20 });
        frameStage(this, 19, 13);
        this.clearColor(Color.WHITE);
        demoCaption(this, "Rough drawing styles", "Organic outlines and textured fills", true);

        const gen = rough.generator();
        const BLUE = "#228be6";

        // Card 1: cross-hatch blue + heart (rough.js defaults: roughness 1, bowing 1, angle -41)
        const card1 = build(gen.rectangle(-CARD / 2, -CARD / 2, CARD, CARD, {
            fill: BLUE, fillStyle: "cross-hatch", hachureGap: 5, seed: 7,

        }), {
            stroke: "#000",
            fill: BLUE,
            z: 0

        });
        card1.transform.position.set([-PITCH * PX, 0, 0]);
        await this.play(createAnim(card1));

        // A hand-drawn style heart, authored in a 100-unit box and scaled to ~165px
        const heartPath = scalePath(
            "M 0 36 C -18 24 -36 12 -36 -4 C -36 -24 -27 -34 -17 -34 " +
            "C -8 -34 -1 -25 1 -18 C 4 -25 10 -35 20 -35 C 31 -35 38 -22 38 -4 C 38 12 18 24 0 36 Z",
            -2.2
        );

        const heart = roughify(heartPath, {
            stroke: "#000",
            fill: "#fa5252",
            fillStyle: "solid",
            seed: 120,
            roughness: 1.20,
            bowing: 1,
            z: 0.05,
            boil: true,
        });
        heart.transform.position.set([-PITCH * PX, 0, 0.05]);
        await this.play(RoughShape.createAnim(heart, { duration: 1200 }));

        // Card 2: single-direction hachure + orange circle
        const card2 = build(gen.rectangle(-CARD / 2, -CARD / 2, CARD, CARD, {
            fill: BLUE, fillStyle: "hachure", hachureGap: 5, seed: 21,
        }), { stroke: "#000", fill: BLUE, z: 0 });
        await this.play(createAnim(card2));

        const circle = build(gen.circle(0, 0, 130, {
            fill: "#fd7e14", fillStyle: "solid", seed: 5,
        }), { stroke: "#000", fill: "#fd7e14", z: 0.05 });
        circle.transform.position.set([0, 0, 0.05]);
        await this.play(writeAnim(circle));

        // Card 3: solid blue + white cross-hatch diamond
        const card3 = build(gen.rectangle(-CARD / 2, -CARD / 2, CARD, CARD, {
            fill: BLUE, fillStyle: "solid", seed: 33,
        }), { stroke: "#000", fill: BLUE, z: 0 });
        card3.transform.position.set([PITCH * PX, 0, 0]);
        await this.play(createAnim(card3));

        const h = 92;
        const diamond = roughify(
            new Path([[0, -h], [h, 0], [0, h], [-h, 0]]),
            {
                stroke: "#fff",
                fill: "#fff",
                fillStyle: "cross-hatch",
                hachureGap: 4,
                seed: 9,
                backgroundColor: GREEN_D.alpha(0.5)
            });



        diamond.transform.position.set([PITCH * PX, 0, 0.05]);
        await this.play(writeAnim(diamond));

        await this.wait(500);
    }
}
