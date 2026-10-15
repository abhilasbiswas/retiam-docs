// =========================================================================
// File: examples/demos/modifiers/wobble_demo.ts
// =========================================================================

import {
    Scene,
    Path,
    Rect,
    Circle,
    SDFText,
    CustomAnimation,
    Rate,
    hex,
    Color,
    WobbleModifier,
    Camera2DController,
    PathEffect,
    CENTER
} from "retiam";
import { frameStage, demoBackground } from "../../shared/presentation";

export default class WobbleDemoScene extends Scene {
    public override async run(): Promise<void> {
        frameStage(this, 16, 12, 0);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });
        this.clearColor(demoBackground());

        // 1. Header & Title
        const title = new SDFText("WobbleModifier", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 4.0, 0]);
        title.paint.fill = hex("#F8FAFC");
        this.add(title);

        const subtitle = new SDFText("Hand-Drawn Imperfection: Biomechanical Bowing, Dual-Pass Sketch & 12 FPS Line Boil", { anchor: CENTER, fontSize: 0.28 });
        subtitle.transform.position.set([0, 3.4, 0]);
        subtitle.paint.fill = hex("#94A3B8");
        this.add(subtitle);

        // -------------------------------------------------------------
        // PANEL 1: Single-Pass Hand-Drawn Box & Circle (Filled + Bowed)
        // -------------------------------------------------------------
        const col1X = -4.5;

        const label1 = new SDFText("1. Single-Pass Hand-Drawn", { anchor: CENTER, fontSize: 0.28 });
        label1.transform.position.set([col1X, 2.3, 0]);
        label1.paint.fill = hex("#38BDF8");
        this.add(label1);

        const sub1 = new SDFText("Wrist Bowing + Motor Tremor", { anchor: CENTER, fontSize: 0.20 });
        sub1.transform.position.set([col1X, 1.9, 0]);
        sub1.paint.fill = hex("#64748B");
        this.add(sub1);

        const box1 = new Rect(2.2, 1.6);
        box1.paint.setStroke(0.07, hex("#38BDF8"));
        box1.paint.fill = new Color(0.22, 0.74, 0.97, 0.12);
        box1.transform.position.set([col1X, 0.6, 0]);
        box1.addModifier(new WobbleModifier({
            roughness: 0.18,
            bowing: 0.35,
            passes: 1,
            seed: 101,
            boilFps: 12
        }));
        this.add(box1);

        const circ1 = new Circle(0.9);
        circ1.paint.setStroke(0.2, hex("#38BDF8"));
        circ1.paint.fill = new Color(0.22, 0.74, 0.97, 0.12);
        circ1.transform.position.set([col1X, -1.4, 0]);
        circ1.addModifier(new WobbleModifier({
            roughness: 0.20,
            bowing: 0.30,
            passes: 1,
            seed: 202,
            boilFps: 12
        }));

        circ1.addPathEffect(PathEffect.Sketch({
            variation: 1.5,
            isClosed: true,
        }));

        this.add(circ1);

        // -------------------------------------------------------------
        // PANEL 2: Dual-Pass Loose Sketch (Rough.js / Excalidraw Style)
        // -------------------------------------------------------------
        const col2X = -1.5;

        const label2 = new SDFText("2. Dual-Pass Sketch", { anchor: CENTER, fontSize: 0.28 });
        label2.transform.position.set([col2X, 2.3, 0]);
        label2.paint.fill = hex("#F59E0B");
        this.add(label2);

        const sub2 = new SDFText("Two Overlapping Strands (passes: 2)", { anchor: CENTER, fontSize: 0.20 });
        sub2.transform.position.set([col2X, 1.9, 0]);
        sub2.paint.fill = hex("#64748B");
        this.add(sub2);

        const box2 = new Rect(2.2, 1.6);
        box2.paint.setStroke(0.06, hex("#F59E0B"));
        box2.transform.position.set([col2X, 0.6, 0]);
        box2.addModifier(new WobbleModifier({
            roughness: 0.22,
            bowing: 0.40,
            passes: 2,
            seed: 303,
            boilFps: 12
        }));
        this.add(box2);

        const circ2 = new Circle(0.9);
        circ2.paint.setStroke(0.06, hex("#F59E0B"));
        circ2.transform.position.set([col2X, -1.4, 0]);
        circ2.addModifier(new WobbleModifier({
            roughness: 0.22,
            bowing: 0.35,
            passes: 2,
            seed: 404,
            boilFps: 12
        }));
        this.add(circ2);

        // -------------------------------------------------------------
        // PANEL 3: Architectural Corner Overshoot & Crosses
        // -------------------------------------------------------------
        const col3X = 1.5;

        const label3 = new SDFText("3. Draftsman Overshoot", { anchor: CENTER, fontSize: 0.28 });
        label3.transform.position.set([col3X, 2.3, 0]);
        label3.paint.fill = hex("#10B981");
        this.add(label3);

        const sub3 = new SDFText("crossCorners & overshoot: 0.7", { anchor: CENTER, fontSize: 0.20 });
        sub3.transform.position.set([col3X, 1.9, 0]);
        sub3.paint.fill = hex("#64748B");
        this.add(sub3);

        const box3 = new Rect(2.2, 1.6);
        box3.paint.setStroke(0.07, hex("#10B981"));
        box3.transform.position.set([col3X, 0.6, 0]);
        box3.addModifier(new WobbleModifier({
            roughness: 0.20,
            bowing: 0.35,
            overshoot: 0.70,
            crossCorners: true,
            passes: 2,
            seed: 505,
            boilFps: 12
        }));
        this.add(box3);

        // Diamond with overshooting corners
        const diamond = new Path("M 0 1 L 1.2 0 L 0 -1 L -1.2 0 Z");
        diamond.paint.setStroke(0.07, hex("#10B981"));
        diamond.transform.position.set([col3X, -1.4, 0]);
        diamond.addModifier(new WobbleModifier({
            roughness: 0.20,
            bowing: 0.35,
            overshoot: 0.70,
            crossCorners: true,
            passes: 2,
            seed: 606,
            boilFps: 12
        }));
        this.add(diamond);

        // -------------------------------------------------------------
        // PANEL 4: Anchored Node-Link Connector (Diagrams & Flowcharts)
        // -------------------------------------------------------------
        const col4X = 4.5;

        const label4 = new SDFText("4. Anchored Connectors", { anchor: CENTER, fontSize: 0.28 });
        label4.transform.position.set([col4X, 2.3, 0]);
        label4.paint.fill = hex("#C084FC");
        this.add(label4);

        const sub4 = new SDFText("anchorEnds: true (Pins Connections)", { anchor: CENTER, fontSize: 0.20 });
        sub4.transform.position.set([col4X, 1.9, 0]);
        sub4.paint.fill = hex("#64748B");
        this.add(sub4);

        // Top node circle
        const nodeTop = new Circle(0.35);
        nodeTop.paint.setStroke(0.06, hex("#C084FC"));
        nodeTop.paint.fill = new Color(0.75, 0.5, 0.98, 0.2);
        nodeTop.transform.position.set([col4X, 1.1, 0]);
        nodeTop.addModifier(new WobbleModifier({ roughness: 0.15, passes: 1, seed: 701, boilFps: 12 }));
        this.add(nodeTop);

        // Bottom node circle
        const nodeBottom = new Circle(0.35);
        nodeBottom.paint.setStroke(0.06, hex("#C084FC"));
        nodeBottom.paint.fill = new Color(0.75, 0.5, 0.98, 0.2);
        nodeBottom.transform.position.set([col4X, -1.9, 0]);
        nodeBottom.addModifier(new WobbleModifier({ roughness: 0.15, passes: 1, seed: 702, boilFps: 12 }));
        this.add(nodeBottom);

        // S-curve connector between the two nodes
        const connector = new Path(`M ${col4X} 0.75 C ${col4X - 1.2} 0.1, ${col4X + 1.2} -0.9, ${col4X} -1.55`);
        connector.paint.setStroke(0.07, hex("#C084FC"));
        connector.addModifier(new WobbleModifier({
            roughness: 0.25,
            bowing: 0.40,
            anchorEnds: true, // Endpoints stay pinned to nodes!
            passes: 2,
            seed: 808,
            boilFps: 12
        }));
        this.add(connector);

        // Central note box
        const noteBox = new Rect(1.8, 0.8);
        noteBox.paint.setStroke(0.06, hex("#C084FC"));
        noteBox.paint.fill = new Color(0.12, 0.08, 0.2, 0.6);
        noteBox.transform.position.set([col4X, -0.4, 0]);
        noteBox.addModifier(new WobbleModifier({ roughness: 0.18, bowing: 0.3, passes: 1, seed: 809, boilFps: 12 }));
        this.add(noteBox);

        const noteText = new SDFText("Wobbly Note", { fontSize: 0.20, anchor: CENTER });
        noteText.transform.position.set([col4X, -0.4, 0]);
        noteText.paint.fill = hex("#E2E8F0");
        this.add(noteText);

        // -------------------------------------------------------------
        // Bottom Status Indicator: Live Line Boil & Roughness
        // -------------------------------------------------------------
        const footer = new SDFText("Live Cel Line Boil Active (12 FPS) • Animating Motor Tremor & Wrist Bowing", { anchor: CENTER, fontSize: 0.26 });
        footer.transform.position.set([0, -3.2, 0]);
        footer.paint.fill = hex("#94A3B8");
        this.add(footer);

        // this.camera.frame([title, box1, circ1, box3, connector, footer], { padding: 0.18 });

        const allWobbles = [
            box1.getModifier(WobbleModifier)!,
            circ1.getModifier(WobbleModifier)!,
            box2.getModifier(WobbleModifier)!,
            circ2.getModifier(WobbleModifier)!,
            box3.getModifier(WobbleModifier)!,
            diamond.getModifier(WobbleModifier)!,
            nodeTop.getModifier(WobbleModifier)!,
            nodeBottom.getModifier(WobbleModifier)!,
            connector.getModifier(WobbleModifier)!,
            noteBox.getModifier(WobbleModifier)!
        ];

        // Animate line boil (time) and modulate bowing/roughness
        await this.play(new CustomAnimation((t) => {
            const currentTime = t * 6.0; // 6 seconds of boiling line animation

            // Dynamic oscillation between subtle sketch and expressive cartoon tremor
            const roughWave = 0.15 + Math.sin(t * Math.PI * 2) * 0.12;
            const bowWave = 0.25 + Math.cos(t * Math.PI * 2) * 0.15;

            // for (const mod of allWobbles) {
            //     mod.time = currentTime;
            //     mod.roughness = roughWave;
            //     mod.bowing = bowWave;
            // }
        }, { duration: 6000, rate_func: Rate.linear() }));

        await this.wait(600);
    }
}
