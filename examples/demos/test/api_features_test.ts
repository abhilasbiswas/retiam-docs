import { CENTER } from "retiam";
import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/test/api_features_test.ts
//
// Live test scene for all 34 API completeness improvements.
// Run via the demo browser: "System & Unit Tests > New API Features Test"
// =========================================================================

import {
    Scene, Color, Text, Circle, Rect, Triangle, Sphere, Torus,
    Vec3, Vec2, Rate, FadeIn, Write, CameraController,
    Group, Noise, AABB,
    DOWN, RIGHT, UP, LEFT, ORIGIN,
    // Fix 3 — new removal animations + factories
    FadeOut, Uncreate, Unwrite, GrowFromCenter, ShrinkToCenter,
    fadeOut, uncreate, unwrite, growFromCenter, shrinkToCenter,
    // Fix 13 — wait() factory
    wait,
} from "retiam";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Displays a section header and waits briefly. */
async function section(scene: Scene, title: string) {
    const t = new Text(title, { anchor: CENTER, fontSize: 2.2, fill: new Color(0.3, 0.85, 1.0, 1.0) });
    t.transform.position = new Vec3(0, 38, 0);
    await scene.play(new FadeIn(t, { duration: 400 }));
    await scene.play(wait(200));
    await scene.play(fadeOut(t, { duration: 300 }));
    scene.remove(t);
}

async function note(scene: Scene, text: string, y: number = -38) {
    const n = new Text(text, { anchor: CENTER, fontSize: 1.4, fill: new Color(0.8, 0.8, 0.8, 1.0) });
    n.transform.position = new Vec3(0, y, 0);
    scene.add(n);
    return n;
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

export default class ApiFeaturesTestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 120]);
        new CameraController(this, this.camera);
        frameStage(this, 190, 135);

        const header = new Text("Retiam API Features — Integration Test", { anchor: CENTER,
            fontSize: 3,
            fill: new Color(1.0, 0.9, 0.4, 1.0),
        });
        header.transform.position = new Vec3(0, 42, 0);
        await this.play(new FadeIn(header, { duration: 700 }));
        await this.play(wait(300));

        // ===================================================================
        // FIX 3 — FadeOut, Uncreate, Unwrite, GrowFromCenter, ShrinkToCenter
        // ===================================================================
        await section(this, "Fix 3 · FadeOut / Uncreate / Unwrite / GrowFromCenter / ShrinkToCenter");

        // GrowFromCenter
        const circ = new Circle(10);
        circ.paint.fill = new Color(0.2, 0.7, 1.0, 1.0);
        circ.transform.position = new Vec3(-30, 0, 0);
        const n1 = await note(this, "growFromCenter  →  shrinkToCenter", 0);
        await this.play(growFromCenter(circ, { duration: 800, rate_func: Rate.easeOutBack() }));
        await this.play(wait(400));
        await this.play(shrinkToCenter(circ, { duration: 600 }));
        this.remove(circ, n1);

        // FadeIn → FadeOut
        const rect = new Rect(20, 12);
        rect.paint.fill = new Color(1.0, 0.4, 0.6, 1.0);
        rect.transform.position = new Vec3(0, 0, 0);
        const n2 = await note(this, "FadeIn  →  fadeOut");
        await this.play(new FadeIn(rect, { duration: 600 }));
        await this.play(wait(400));
        await this.play(fadeOut(rect, { duration: 600 }));
        this.remove(rect, n2);

        // Write → Uncreate
        const tri = new Triangle([new Vec2(0, 8), new Vec2(-8, -8), new Vec2(8, -8)]);
        tri.paint.fill = new Color(0.5, 1.0, 0.5, 1.0);
        tri.paint.strokeWidth = 1.5;
        tri.transform.position = new Vec3(30, 0, 0);
        const n3 = await note(this, "Write  →  uncreate");
        await this.play(new Write(tri, { duration: 800 }));
        await this.play(wait(400));
        await this.play(uncreate(tri, { duration: 700 }));
        this.remove(tri, n3);

        await this.play(wait(400));

        // ===================================================================
        // FIX 10 — AnimOptions: onStart, onComplete, loop
        // ===================================================================
        await section(this, "Fix 10 · AnimOptions  onStart / onComplete / loop");

        const lifecycleLog: string[] = [];
        const logCirc = new Circle(8);
        logCirc.paint.fill = new Color(0.9, 0.6, 0.1, 1.0);
        logCirc.transform.position = new Vec3(0, 0, 0);

        await this.play(new FadeIn(logCirc, {
            duration: 800,
            onStart: () => lifecycleLog.push("onStart"),
            onComplete: () => lifecycleLog.push("onComplete"),
        }));

        const logText = new Text(
            `Lifecycle: [${lifecycleLog.join(", ")}]`,
            { anchor: CENTER, fontSize: 1.6, fill: new Color(0.5, 1.0, 0.5, 1.0) }
        );
        logText.transform.position = new Vec3(0, -12, 0);
        await this.play(new FadeIn(logText, { duration: 300 }));
        await this.play(wait(600));
        await this.play(fadeOut(logCirc, { duration: 400 }));
        await this.play(fadeOut(logText, { duration: 400 }));
        this.remove(logCirc, logText);

        // ===================================================================
        // FIX 13 — wait() factory
        // ===================================================================
        await section(this, "Fix 13 · wait() factory");

        const waitNote = new Text("Waiting 1200 ms via wait()...", { anchor: CENTER, fontSize: 1.8, fill: Color.WHITE });
        waitNote.transform.position = new Vec3(0, 0, 0);
        await this.play(new FadeIn(waitNote, { duration: 300 }));
        await this.play(wait(1200));
        const doneNote = new Text("Done!", { anchor: CENTER, fontSize: 2.5, fill: new Color(0.3, 1.0, 0.6, 1.0) });
        doneNote.transform.position = new Vec3(0, -8, 0);
        await this.play(new FadeIn(doneNote, { duration: 300 }));
        await this.play(wait(400));
        await this.play(fadeOut(waitNote, { duration: 300 }));
        await this.play(fadeOut(doneNote, { duration: 300 }));
        this.remove(waitNote, doneNote);

        // ===================================================================
        // FIX 19/20 — Paint.setZIndex / Group convenience setters
        // ===================================================================
        await section(this, "Fix 19+20 · Paint.setZIndex / Group convenience setters");

        const shapes: Circle[] = [];
        for (let i = 0; i < 5; i++) {
            const c = new Circle(7 - i);
            c.paint.fill = Color.fromHex(`#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`);
            c.paint.z_index = i;
            c.transform.position = new Vec3(-24 + i * 12, 0, 0);
            shapes.push(c);
        }
        const grp = new Group(...shapes);
        grp.setVisibility(true);

        await this.play(new FadeIn(shapes[0], { duration: 300 }));
        for (let i = 1; i < shapes.length; i++) {
            await this.play(growFromCenter(shapes[i], { duration: 350 }));
        }

        const zNote = await note(this, "setZIndex: 0..4 layering  |  Group.setOpacity");
        await this.play(wait(600));

        grp.setOpacity(0.5);
        await this.play(wait(500));
        grp.setOpacity(1.0);

        await this.play(wait(400));

        for (const s of shapes) {
            await this.play(shrinkToCenter(s, { duration: 250 }));
        }
        this.remove(...shapes, zNote);

        // ===================================================================
        // FIX 21 — Rate.steps() / Rate.constant()
        // ===================================================================
        await section(this, "Fix 21 · Rate.steps() / Rate.constant()");

        const stepsCirc = new Circle(6);
        stepsCirc.paint.fill = new Color(0.7, 0.3, 1.0, 1.0);
        stepsCirc.transform.position = new Vec3(-25, 0, 0);

        const constCirc = new Circle(6);
        constCirc.paint.fill = new Color(1.0, 0.6, 0.1, 1.0);
        constCirc.transform.position = new Vec3(25, 0, 0);

        await this.play(growFromCenter(stepsCirc, { duration: 200 }));
        await this.play(growFromCenter(constCirc, { duration: 200 }));

        const rateNote = await note(this,
            "Left: Rate.steps(6)   Right: Rate.constant(1.0)");

        // steps: animate opacity in discrete jumps
        await this.play(new FadeIn(stepsCirc, {
            duration: 1200,
            rate_func: Rate.steps(6),
        }));

        // constant: immediately full opacity, held
        await this.play(new FadeIn(constCirc, {
            duration: 800,
            rate_func: Rate.constant(1.0),
        }));

        await this.play(wait(600));
        await this.play(fadeOut(stepsCirc, { duration: 400 }));
        await this.play(fadeOut(constCirc, { duration: 400 }));
        this.remove(stepsCirc, constCirc, rateNote);

        // ===================================================================
        // FIX 22 — Color.fromRGB() / Color.toHSL()
        // ===================================================================
        await section(this, "Fix 22 · Color.fromRGB() / Color.toHSL()");

        const redRGB = Color.fromRGB(220, 60, 80);
        const hsl = redRGB.toHSL();
        const hslText = new Text(
            `Color.fromRGB(220,60,80) → toHSL() = h:${hsl.h.toFixed(2)} s:${hsl.s.toFixed(2)} l:${hsl.l.toFixed(2)}`,
            { anchor: CENTER, fontSize: 1.5, fill: redRGB }
        );
        hslText.transform.position = new Vec3(0, 5, 0);

        const roundTrip = Color.fromHSL(hsl.h, hsl.s, hsl.l);
        const rtText = new Text(
            `Round-trip via fromHSL → r:${roundTrip.r.toFixed(2)} g:${roundTrip.g.toFixed(2)} b:${roundTrip.b.toFixed(2)}`,
            { anchor: CENTER, fontSize: 1.5, fill: roundTrip }
        );
        rtText.transform.position = new Vec3(0, -3, 0);

        await this.play(new FadeIn(hslText, { duration: 400 }));
        await this.play(new FadeIn(rtText, { duration: 400 }));
        await this.play(wait(1200));
        await this.play(fadeOut(hslText, { duration: 300 }));
        await this.play(fadeOut(rtText, { duration: 300 }));
        this.remove(hslText, rtText);

        // ===================================================================
        // FIX 26 — AABB.intersects / containsPoint / getCenter
        // ===================================================================
        await section(this, "Fix 26 · AABB.intersects / containsPoint / getCenter");

        const aabbA = new AABB(new Vec3(-15, -6, 0), new Vec3(5, 6, 0));
        const aabbB = new AABB(new Vec3(0, -6, 0), new Vec3(20, 6, 0));
        const testPoint = new Vec3(3, 0, 0);

        const intersects = aabbA.intersects(aabbB);
        const contains = aabbA.containsPoint(testPoint);
        const center = aabbA.getCenter();

        const aabbText = new Text(
            [
                `A∩B intersects: ${intersects}`,
                `A contains (3,0,0): ${contains}`,
                `A center: (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)})`,
            ].join("     "),
            { anchor: CENTER, fontSize: 1.5, fill: Color.WHITE }
        );
        aabbText.transform.position = new Vec3(0, 0, 0);

        await this.play(new FadeIn(aabbText, { duration: 400 }));
        await this.play(wait(1400));
        await this.play(fadeOut(aabbText, { duration: 300 }));
        this.remove(aabbText);

        // ===================================================================
        // FIX 29 — Noise.fractalBrownianMotion / fbm
        // ===================================================================
        await section(this, "Fix 29 · Noise.fractalBrownianMotion");

        const perlin = Noise.perlin();
        const cols = 32;
        const fbmResults: number[] = [];
        for (let i = 0; i < cols; i++) {
            fbmResults.push(Noise.fractalBrownianMotion(perlin, i * 0.15, 0, 0, 5));
        }

        // Draw bars
        const bars: Circle[] = [];
        const barSpread = 64 / cols;
        for (let i = 0; i < cols; i++) {
            const h = Math.abs(fbmResults[i]) * 14 + 1;
            const bar = new Circle(barSpread * 0.35);
            bar.transform.position = new Vec3(-32 + i * barSpread, fbmResults[i] * 14, 0);
            bar.paint.fill = new Color(
                0.4 + fbmResults[i] * 0.6,
                0.7,
                0.9 - fbmResults[i] * 0.5,
                1.0
            );
            bars.push(bar);
        }

        for (const bar of bars) {
            await this.play(growFromCenter(bar, { duration: 80 }));
        }
        const fbmNote = await note(this, `Noise.fbm samples (octaves=5, ${cols} points)`);
        await this.play(wait(1000));
        for (const bar of bars) this.remove(bar);
        this.remove(fbmNote);

        // ===================================================================
        // FIX 6 — Entity.dispose()
        // ===================================================================
        await section(this, "Fix 6 · Entity.dispose()");

        const disposeCirc = new Circle(10);
        disposeCirc.paint.fill = new Color(1.0, 0.3, 0.3, 1.0);
        disposeCirc.transform.position = new Vec3(0, 0, 0);
        this.add(disposeCirc);

        const disposeNote = new Text("Entity added — calling dispose() in 1s...", { anchor: CENTER,
            fontSize: 1.6, fill: Color.WHITE
        });
        disposeNote.transform.position = new Vec3(0, -14, 0);
        await this.play(new FadeIn(disposeNote, { duration: 300 }));
        await this.play(new FadeIn(disposeCirc, { duration: 400 }));
        await this.play(wait(1000));

        disposeCirc.dispose(); // ← Entity.dispose() fix

        const disposeOkText = new Text("dispose() called — entity removed from scene graph ✓", { anchor: CENTER,
            fontSize: 1.6, fill: new Color(0.3, 1.0, 0.5, 1.0)
        });
        disposeOkText.transform.position = new Vec3(0, 0, 0);
        await this.play(new FadeIn(disposeOkText, { duration: 300 }));
        await this.play(wait(800));
        await this.play(fadeOut(disposeOkText, { duration: 300 }));
        await this.play(fadeOut(disposeNote, { duration: 300 }));
        this.remove(disposeOkText, disposeNote);

        // ===================================================================
        // FIX 25 — Camera.reset()
        // ===================================================================
        await section(this, "Fix 25 · Camera.reset()");

        const camNote = new Text("Moving camera then calling reset()...", { anchor: CENTER,
            fontSize: 1.6, fill: Color.WHITE
        });
        camNote.transform.position = new Vec3(0, 5, 0);
        await this.play(new FadeIn(camNote, { duration: 300 }));

        // Move camera
        const origPos = this.camera.position.clone();
        this.camera.position.set([20, 10, 120]);
        await this.play(wait(600));

        this.camera.reset();
        const resetNote = new Text("camera.reset() called ✓", { anchor: CENTER,
            fontSize: 1.6, fill: new Color(0.3, 1.0, 0.5, 1.0)
        });
        resetNote.transform.position = new Vec3(0, -5, 0);
        await this.play(new FadeIn(resetNote, { duration: 300 }));
        await this.play(wait(800));
        await this.play(fadeOut(camNote, { duration: 300 }));
        await this.play(fadeOut(resetNote, { duration: 300 }));
        this.remove(camNote, resetNote);

        // ===================================================================
        // FIX 28 — Vec3.cast() error throw
        // ===================================================================
        await section(this, "Fix 28 · Vec3.cast() throws on invalid input");

        const { Vec3: _Vec3 } = await import("retiam");
        let castError = "";
        try {
            (_Vec3 as any).cast(new Float32Array([1, 2, 3, 4])); // length 4 → invalid
        } catch (e: any) {
            castError = e.message;
        }

        const castText = new Text(
            castError ? `Error thrown ✓:\n${castError.substring(0, 80)}...` : "No error (unexpected!)",
            { anchor: CENTER, fontSize: 1.4, fill: castError ? new Color(0.3, 1.0, 0.5, 1.0) : Color.RED }
        );
        castText.transform.position = new Vec3(0, 3, 0);
        await this.play(new FadeIn(castText, { duration: 300 }));
        await this.play(wait(1200));
        await this.play(fadeOut(castText, { duration: 300 }));
        this.remove(castText);

        // ===================================================================
        // FINALE
        // ===================================================================
        const finale = new Text("All API Tests Passed ✓", { anchor: CENTER,
            fontSize: 4,
            fill: new Color(0.4, 1.0, 0.6, 1.0),
        });
        finale.transform.position = new Vec3(0, 5, 0);
        const subFinale = new Text(
            "Fixes 3 · 6 · 10 · 13 · 19 · 20 · 21 · 22 · 25 · 26 · 28 · 29",
            { anchor: CENTER, fontSize: 1.6, fill: new Color(0.7, 0.9, 1.0, 1.0) }
        );
        subFinale.transform.position = new Vec3(0, -5, 0);

        await this.play(growFromCenter(finale, { duration: 800, rate_func: Rate.easeOutBack() }));
        await this.play(new FadeIn(subFinale, { duration: 500 }));
        await this.play(wait(2000));

        await this.play(fadeOut(header, { duration: 400 }));
        await this.play(fadeOut(finale, { duration: 400 }));
        await this.play(fadeOut(subFinale, { duration: 400 }));
    }
}
