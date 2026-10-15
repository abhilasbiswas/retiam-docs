// =========================================================================
// File: examples/demos/graphs/automata_dfa_demo.ts
// =========================================================================

import {
    CENTER,
    Color,
    Camera2DController,
    SDFText,
    Rect,
    hex,
    Scene
} from "retiam";

import {
    Automaton,
    Tape,
    AutomatonRunner,
    CyberNeonGraphTheme
} from "retiam/graphs";
import { demoBackground } from "../../shared/presentation";

export default class AutomataDfaScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 14]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera, { zoom: 14 });

        // =====================================================================
        // 1. Header
        // =====================================================================


        const title = new SDFText("Deterministic Finite Automaton", { anchor: CENTER, fontSize: 0.78 });
        title.paint.fill = hex("#F8FAFC");
        title.center();
        title.transform.shiftWorld([0, 6, 0]);
        this.add(title);


        // =====================================================================
        // 2. Automaton State Machine
        // =====================================================================
        const automaton = new Automaton({
            theme: CyberNeonGraphTheme
        });

        const nodeR = 0.55;
        const spacing = 6.6;
        const stateY = 0.6;

        automaton.addState("q0", {
            isStart: true,
            label: "q0",
            radius: nodeR,
            pos: [-spacing, stateY, 0]
        });

        automaton.addState("q1", {
            label: "q1",
            radius: nodeR,
            pos: [0, stateY, 0]
        });

        automaton.addState("q2", {
            isAccepting: true,
            label: "q2",
            radius: nodeR,
            pos: [spacing, stateY, 0]
        });

        // Transitions:
        // q0 self-loop on '1'
        automaton.addTransition("q0", "q0", "1", { loopAngle: Math.PI / 2 });
        // q0 -> q1 on '0': clean horizontal edge
        automaton.addTransition("q0", "q1", "0", { curvature: 0 });
        // q1 self-loop on '0'
        automaton.addTransition("q1", "q1", "0", { loopAngle: Math.PI / 2 });
        // q1 -> q2 on '1': curves UP
        automaton.addTransition("q1", "q2", "1", { curvature: 0.28 });
        // q2 -> q1 on '0': curves DOWN
        automaton.addTransition("q2", "q1", "0", { curvature: 0.28 });
        // q2 -> q0 on '1': deep lower return loop
        automaton.addTransition("q2", "q0", "1", { curvature: 0.52 });

        this.add(automaton);

        // =====================================================================
        // 3. Tape
        // =====================================================================

        const tape = new Tape({
            theme: CyberNeonGraphTheme,
            symbols: "1001"
        });
        tape.transform.position.set([0, -4.5, 0]);
        this.add(tape);

        // =====================================================================
        // 4. Runner
        // =====================================================================
        const runner = new AutomatonRunner(automaton, tape, {
            verdictPosition: [0, -1.80, 0.2]
        });
        this.add(runner);

        while (true) {
            await this.wait(800);
            await runner.run(this, "10001010101", 2000);
            await this.wait(2500);
            await runner.run(this, "1000", 2000);
            await this.wait(2500);
        }
    }
}
