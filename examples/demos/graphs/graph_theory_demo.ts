// =========================================================================
// File: examples/demos/graphs/graph_theory_demo.ts
// =========================================================================

import {
    Scene,
    Color,
    Camera2DController,
    SDFText,
    hex
} from "retiam";

import {
    Graph,
    Layouts,
    DarkModernGraphTheme
} from "retiam/graphs";
import { frameStage } from "../../shared/presentation";

export default class GraphTheoryScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 15]);
        frameStage(this, 20, 16);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });

        // =====================================================================
        // 1. Header
        // =====================================================================
        const badgeText = new SDFText("GRAPH THEORY", { fontSize: 0.24 });
        badgeText.paint.fill = hex("#38BDF8");
        badgeText.center();
        badgeText.transform.shiftWorld([0, 5.8, 0.02]);
        this.add(badgeText);

        const title = new SDFText("Networks in motion", { fontSize: 0.78 });
        title.paint.fill = hex("#F8FAFC");
        title.center();
        title.transform.shiftWorld([0, 5.05, 0]);
        this.add(title);

        const subtitle = new SDFText("Force-directed layout, circular morphing & Dijkstra shortest path", { fontSize: 0.38 });
        subtitle.paint.fill = hex("#94A3B8");
        subtitle.center();
        subtitle.transform.shiftWorld([0, 4.45, 0]);
        this.add(subtitle);

        // =====================================================================
        // 2. Graph Topology
        // =====================================================================
        const graph = new Graph({
            theme: DarkModernGraphTheme,
            isDirected: true
        });

        const nodeIds = ["A", "B", "C", "D", "E", "F", "G"];
        for (const id of nodeIds) {
            graph.addNode(id, { radius: 0.80 });
        }

        const edgeDefs = [
            { source: "A", target: "B", weight: "3" },
            { source: "A", target: "C", weight: "5" },
            { source: "B", target: "D", weight: "4" },
            { source: "B", target: "E", weight: "7" },
            { source: "C", target: "E", weight: "2" },
            { source: "C", target: "F", weight: "6" },
            { source: "D", target: "G", weight: "8" },
            { source: "E", target: "G", weight: "4" },
            { source: "F", target: "G", weight: "3" },
            { source: "D", target: "E", weight: "1" }
        ];

        for (const e of edgeDefs) {
            graph.addEdge(e.source, e.target, { label: e.weight });
        }

        // Initial Force-Directed Layout
        const fdLayout = Layouts.forceDirected(
            nodeIds,
            edgeDefs,
            { width: 10.5, height: 7.5, iterations: 100, center: [0, -1.0] }
        );
        graph.applyLayout(fdLayout);
        this.add(graph);

        await this.wait(1000);

        // =====================================================================
        // 3. Shortest Path (A → C → E → G)
        // =====================================================================
        const shortestPath = ["A", "C", "E", "G"];
        await this.play(
            graph.highlightPath(shortestPath, {
                color: hex("#10B981"),
                stepDuration: 0.45
            })
        );

        const flowAnimations = [];
        for (let i = 0; i < shortestPath.length - 1; i++) {
            const edge = graph.getEdge(shortestPath[i], shortestPath[i + 1]);
            if (edge) {
                flowAnimations.push(edge.createFlowAnimation(0.9, hex("#34D399")));
            }
        }
        await this.play(flowAnimations);

        await this.wait(1200);

        // =====================================================================
        // 4. Morph: Force-Directed → Circular
        // =====================================================================
        const circularLayout = Layouts.circular(nodeIds, 3.6, [0, -1.0]);
        await this.play(graph.morphToLayout(circularLayout, 1.4));

        await this.wait(1200);

        // =====================================================================
        // 5. Morph: Circular → Layered
        // =====================================================================
        const layeredLayout = Layouts.layered(
            [["A"], ["B", "C"], ["D", "E", "F"], ["G"]],
            3.2,
            2.0,
            [0, -1.0]
        );
        await this.play(graph.morphToLayout(layeredLayout, 1.5));
    }
}
