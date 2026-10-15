import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/features/typewriter_showcase.ts
//
// Dedicated showcase for the Typewriter animation.
// Demo browser: "Animation Gallery > Typewriter Showcase"
// =========================================================================

import {
    Scene, Color, Text, Vec3, FadeIn, FadeOut, wait,
    Typewriter,
    CENTER,
    RIGHT,
} from "retiam";


// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const C = {
    bg: new Color(0.04, 0.05, 0.09, 1.0),
    header: new Color(1.0, 0.85, 0.3, 1.0),
    section: new Color(0.4, 0.85, 1.0, 1.0),
    dim: new Color(0.45, 0.45, 0.55, 1.0),
    accent1: new Color(0.35, 0.75, 1.0, 1.0),
    accent2: new Color(1.0, 0.4, 0.55, 1.0),
    accent3: new Color(0.35, 1.0, 0.65, 1.0),
    accent4: new Color(1.0, 0.65, 0.2, 1.0),
    accent5: new Color(0.75, 0.4, 1.0, 1.0),
    accent6: new Color(0.2, 1.0, 0.85, 1.0),
    white: new Color(1, 1, 1, 1.0),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fades in a section heading and removes it before the demo starts. */
async function heading(scene: Scene, text: string) {
    const t = new Text(text, { fontSize: 2.4, fill: C.section });
    t.transform.position = new Vec3(0, 38, 0);
    await scene.play(new FadeIn(t, { duration: 300 }));
    await scene.play(wait(450));
    await scene.play(new FadeOut(t, { duration: 250 }));
    scene.remove(t);
}

/** Small info line below a demo text. */
function info(scene: Scene, text: string, y = 2): Text {
    const t = new Text(text, { fontSize: 1.4, fill: C.dim });
    t.transform.position = new Vec3(0, y, 0);
    scene.add(t);
    return t;
}

async function fadeExit(scene: Scene, ...items: Text[]) {
    await scene.play(items.map(t => new FadeOut(t, { duration: 260 })));
    scene.remove(...items);
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export default class TypewriterShowcaseScene extends Scene {

    async run() {

        this.camera.position = [0,0,30]
        frameStage(this, 100, 58);
        demoCaption(this, "Type · delete · retype", "A live cursor follows the evolving text");

        // ── Title card ────────────────────────────────────────────────
        // {
        //     const title = new Text("Typewriter Animation", { fontSize: 5, fill: C.header });
        //     title.transform.position = new Vec3(0, 8, 0);
        //     const sub = new Text(
        //         "type · delete · clear · cursor styles · jitter · sequences",
        //         { fontSize: 1.8, fill: C.dim }
        //     );
        //     sub.transform.position = new Vec3(0, -2, 0);

        //     await this.play(new FadeIn(title, { duration: 500 }));
        //     await this.play(new FadeIn(sub,   { duration: 400 }));
        //     await this.play(wait(1400));
        //     await fadeExit(this, title, sub);
        // }

        // ================================================================
        // SECTION 1 — Cursor styles
        // ================================================================
        // await heading(this, "Section 1 — Cursor Styles");

        // {
        //     // Five cursors side-by-side
        //     const defs = [
        //         { cursor: "pipe"       as const, label: "|  pipe",       col: C.accent1, x: -42 },
        //         { cursor: "underscore" as const, label: "_  underscore", col: C.accent2, x: -21 },
        //         { cursor: "block"      as const, label: "█  block",      col: C.accent3, x:   0 },
        //         { cursor: "thin_block" as const, label: "▌  thin_block", col: C.accent4, x:  21 },
        //         { cursor: "arrow"      as const, label: "▶  arrow",      col: C.accent5, x:  42 },
        //     ];

        //     const texts = defs.map(d => {
        //         const t = new Text("", { fontSize: 2.8, fill: d.col });
        //         t.transform.position = new Vec3(d.x, 10, 0);
        //         return t;
        //     });
        //     const labels = defs.map(d => {
        //         const t = new Text(d.label, { fontSize: 1.4, fill: C.dim });
        //         t.transform.position = new Vec3(d.x, 2, 0);
        //         this.add(t);
        //         return t;
        //     });

        //     // All five type simultaneously, each with its own cursor
        //     await this.play(texts.map((t, i) =>
        //         new Typewriter(t, [
        //             { op: "type",  text: "Hello", charDelay: 85, jitter: 0.1 },
        //             { op: "pause", duration: 1200 },
        //         ], {
        //             cursor: defs[i].cursor,
        //             cursorBlinkMs: 520,
        //             keepCursor: true,
        //         })
        //     ));
        //     await this.play(wait(600));
        //     await fadeExit(this, ...texts, ...labels);
        // }

        // ================================================================
        // SECTION 2 — Blink speed variants
        // ================================================================
        // await heading(this, "Section 2 — Cursor Blink Speed");

        // {
        //     const variants = [
        //         { ms: 200, label: "fast blink\n200ms", col: C.accent1, x: -30 },
        //         { ms: 530, label: "default\n530ms", col: C.accent3, x: 0 },
        //         { ms: 0, label: "solid\n(no blink)", col: C.accent5, x: 30 },
        //     ];

        //     const texts = variants.map(v => {
        //         const t = new Text("", { fontSize: 3.0, fill: v.col });
        //         t.transform.position = new Vec3(v.x, 10, 0);
        //         return t;
        //     });
        //     // const labels = variants.map(v => {
        //     //     const t = new Text(v.label, { fontSize: 1.4, fill: C.dim });
        //     //     t.transform.position = new Vec3(v.x, 2, 0);
        //     //     this.add(t);
        //     //     return t;
        //     // });

        //     await this.play(texts.map((t, i) =>
        //         new Typewriter(t, [
        //             { op: "type", text: "Blink!", charDelay: 100 },
        //             { op: "pause", duration: 4000 },
        //         ], {
        //             cursor: "_",
        //             cursorBlinkMs: variants[i].ms,
        //             keepCursor: true,
        //         })
        //     ));
        //     await this.play(wait(600));
        //     await fadeExit(this, ...texts);
        // }

        // ================================================================
        // SECTION 3 — Jitter (organic vs mechanical)
        // ================================================================
        // await heading(this, "Section 3 — Jitter (Typing Rhythm)");

        // {
        //     const jitterDefs = [
        //         { jitter: 0.0, label: "jitter=0.0 — mechanical", col: C.accent1, x: -30 },
        //         { jitter: 0.4, label: "jitter=0.4 — natural", col: C.accent4, x: 0 },
        //         { jitter: 0.85, label: "jitter=0.85 — chaotic", col: C.accent2, x: 30 },
        //     ];

        //     const texts = jitterDefs.map(d => {
        //         const t = new Text("", { fontSize: 2.8, fill: d.col });
        //         t.transform.position = new Vec3(d.x, 10, 0);
        //         return t;
        //     });
        //     const labels = jitterDefs.map(d => {
        //         const t = new Text(d.label, { fontSize: 1.35, fill: C.dim });
        //         t.transform.position = new Vec3(d.x, 2, 0);
        //         this.add(t);
        //         return t;
        //     });

        //     await this.play(texts.map((t, i) =>
        //         new Typewriter(t, [
        //             { op: "type", text: "Retiam!", charDelay: 80, jitter: jitterDefs[i].jitter, randomSeed: 5 + i },
        //             { op: "pause", duration: 1000 },
        //         ], { cursor: "pipe", cursorBlinkMs: 500, keepCursor: false })
        //     ));
        //     await this.play(wait(400));
        //     await fadeExit(this, ...texts, ...labels);
        // }

        // ================================================================
        // SECTION 4 — type → delete → retype
        // ================================================================
        // await heading(this, "Section 4 — Type · Delete · Retype");

        {
            const t = new Text("", { fontSize: 5, fill: C.section, anchor: CENTER });
            t.move([0, 0, 0])
            // const desc = info(this,
            //     "type \"Hello, World!\" → pause → delete 6 → type \"Retiam!\"",
            //     2
            // );

            await this.play(new Typewriter(t, [
                { op: "type", text: "Hello, World!", charDelay: 68, jitter: 0.22, randomSeed: 7 },
                { op: "pause", duration: 800 },
                { op: "delete", count: 6, charDelay: 42, jitter: 0.1 },
                { op: "type", text: "Retiam!", charDelay: 74, jitter: 0.28, randomSeed: 13 },
                { op: "pause", duration: 1000 },
            ], { cursor: "pipe", cursorBlinkMs: 480, keepCursor: false }));

            await this.play(wait(300));
            // await fadeExit(this, t, desc);
        }

        // ================================================================
        // SECTION 5 — Multi-word cycling (Design · Animate · Ship)
        // ================================================================
        // await heading(this, "Section 5 — Multi-Word Sequence");

        // {
        //     const t = new Text("", { fontSize: 4.0, fill: C.accent5 });
        //     t.transform.position = new Vec3(0, 12, 0);
        //     const desc = info(this,
        //         "underscore cursor · solid (no blink) · delete-all between words",
        //         2
        //     );

        //     await this.play(new Typewriter(t, [
        //         { op: "type", text: "Design.", charDelay: 95, jitter: 0.2, randomSeed: 1 },
        //         { op: "pause", duration: 700 },
        //         { op: "delete", charDelay: 48 },
        //         { op: "type", text: "Animate.", charDelay: 85, jitter: 0.2, randomSeed: 2 },
        //         { op: "pause", duration: 700 },
        //         { op: "delete", charDelay: 48 },
        //         { op: "type", text: "Ship.", charDelay: 105, jitter: 0.2, randomSeed: 3 },
        //         { op: "pause", duration: 1200 },
        //     ], { cursor: "underscore", cursorBlinkMs: 0 /* solid */ }));

        //     await this.play(wait(300));
        //     await fadeExit(this, t, desc);
        // }

        // ================================================================
        // SECTION 6 — op:clear (instant wipe)
        // ================================================================
        // await heading(this, "Section 6 — Instant Clear");

        // {
        //     const t = new Text("", { fontSize: 3.2, fill: C.accent6 });
        //     t.transform.position = new Vec3(0, 12, 0);
        //     const desc = info(this,
        //         "block cursor · type \"Loading...\" → op:clear → retype \"Done ✓\" fast",
        //         2
        //     );

        //     await this.play(new Typewriter(t, [
        //         { op: "type", text: "Loading data...", charDelay: 58 },
        //         { op: "pause", duration: 600 },
        //         { op: "clear" },                              // instant wipe
        //         { op: "type", text: "Done ✓", charDelay: 52, jitter: 0.35, randomSeed: 9 },
        //         { op: "pause", duration: 1200 },
        //     ], { cursor: "block", cursorBlinkMs: 400, keepCursor: false }));

        //     await this.play(wait(300));
        //     await fadeExit(this, t, desc);
        // }

        // ================================================================
        // SECTION 7 — Custom cursor character
        // ================================================================
        // await heading(this, "Section 7 — Custom Cursor Chars");

        // {
        //     const customCursors = [
        //         { char: "❱", label: "cursor: \"❱\"", col: C.accent1, x: -30 },
        //         { char: "▮", label: "cursor: \"▮\"", col: C.accent3, x: 0 },
        //         { char: "◆", label: "cursor: \"◆\"", col: C.accent4, x: 30 },
        //     ];

        //     const texts = customCursors.map(d => {
        //         const t = new Text("", { fontSize: 3.0, fill: d.col });
        //         t.transform.position = new Vec3(d.x, 10, 0);
        //         return t;
        //     });
        //     const lbls = customCursors.map(d => {
        //         const t = new Text(d.label, { fontSize: 1.4, fill: C.dim });
        //         t.transform.position = new Vec3(d.x, 2, 0);
        //         this.add(t);
        //         return t;
        //     });

        //     await this.play(texts.map((t, i) =>
        //         new Typewriter(t, [
        //             { op: "type", text: "Hi!", charDelay: 120, jitter: 0.15, randomSeed: i + 20 },
        //             { op: "pause", duration: 1200 },
        //         ], {
        //             cursor: customCursors[i].char,
        //             cursorBlinkMs: 600,
        //             keepCursor: true,
        //         })
        //     ));
        //     await this.play(wait(500));
        //     await fadeExit(this, ...texts, ...lbls);
        // }

        // ================================================================
        // SECTION 8 — keepCursor: cursor stays blinking after finish
        // ================================================================
        // await heading(this, "Section 8 — keepCursor");

        // {
        //     const t = new Text("", { fontSize: 3.6, fill: C.accent3 });
        //     t.transform.position = new Vec3(0, 12, 0);
        //     const desc = info(this,
        //         "keepCursor: true — cursor blinks after typing finishes",
        //         2
        //     );

        //     await this.play(new Typewriter(t, [
        //         { op: "type", text: "$ npm run dev", charDelay: 70, jitter: 0.2, randomSeed: 42 },
        //         { op: "pause", duration: 1800 },
        //     ], { cursor: "pipe", cursorBlinkMs: 480, keepCursor: true }));

        //     await this.play(wait(600));
        //     await fadeExit(this, t, desc);
        // }

        // ================================================================
        // FINAL — Full demo combining everything
        // ================================================================
        // await heading(this, "Final — Full Sequence");

        // {
        //     const t = new Text("", { fontSize: 3.8, fill: C.accent4 });
        //     t.transform.position = new Vec3(0, 14, 0);

        //     const sub = new Text("", { fontSize: 2.0, fill: C.dim });
        //     sub.transform.position = new Vec3(0, 4, 0);

        //     await this.play([
        //         new Typewriter(t, [
        //             { op: "type", text: "Build something", charDelay: 70, jitter: 0.2 },
        //             { op: "pause", duration: 600 },
        //             { op: "delete", count: 9, charDelay: 40 },
        //             { op: "type", text: "beautiful.", charDelay: 80, jitter: 0.25 },
        //             { op: "pause", duration: 800 },
        //             { op: "delete", charDelay: 40 },
        //             { op: "type", text: "with Retiam.", charDelay: 75, jitter: 0.2 },
        //             { op: "pause", duration: 1500 },
        //         ], { cursor: "pipe", cursorBlinkMs: 500, keepCursor: false }),

        //         new Typewriter(sub, [
        //             { op: "pause", duration: 200 },
        //             { op: "type", text: "type · delete · clear · repeat", charDelay: 55, jitter: 0.1 },
        //             { op: "pause", duration: 3500 },
        //         ], { cursor: "none", showCursor: false }),
        //     ]);

        //     await this.play(wait(500));
        //     await fadeExit(this, t, sub);
        // }

        // End card
        // {
        //     const end = new Text("Typewriter ✓", { fontSize: 5, fill: C.header });
        //     end.transform.position = new Vec3(0, 5, 0);
        //     await this.play(new FadeIn(end, { duration: 700 }));
        //     await this.play(wait(2000));
        // }
    }
}
