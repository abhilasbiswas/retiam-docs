import { Scene, Color, CameraController, Text, Axes, ValueTracker, FunctionGraph2D, alwaysRedraw, UP, Rate, Camera2DController } from "retiam";
import { PathEffect } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class PlottingTestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera, { zoom: 30 });

        const axes = new Axes({
            xRange: [-2 * Math.PI, 2 * Math.PI, Math.PI / 2],
            yRange: [-2, 2, 0.5],
            width: 40, height: 20, showGrid: true,
            showLabels: true,
            xLabelFormatter: (rad) => `${Math.round((rad * 180) / Math.PI)}`
        });
        this.add(axes);

        const phaseTracker = new ValueTracker(0);
        const freqTracker = new ValueTracker(1);
        this.add(phaseTracker, freqTracker);

        // --- NEW: Crisp Gradient Plot ---
        const graph1 = new FunctionGraph2D(axes, (x) => {
            return Math.sin(x * freqTracker.value + phaseTracker.value);
        }, {
            samples: 200,
            strokeWidth: 0.1, // Clean, crisp thickness
            pathEffect: PathEffect.Gradient([new Color(0, 1, 1), new Color(1, 0, 1)]), // Cyan to Magenta!
            fill: new Color(1.0, 0.2, 0.6, 0.15), // Transparent pink fill
            primitive: "path"
        });
        this.add(graph1);

        // --- NEW: Dashed Cosine Plot ---
        const graph2 = new FunctionGraph2D(axes, (x) => {
            return Math.cos(x * freqTracker.value + phaseTracker.value);
        }, {
            samples: 200,
            strokeWidth: 0.06,
            stroke: new Color(1, 1, 0, 1), // Yellow
            pathEffect: PathEffect.Dashed(0.4, 0.2) // Dashed line!
        });
        this.add(graph2);

        graph1.always(() => graph1.updateGraph());
        graph2.always(() => graph2.updateGraph());

        const labelWrapper = alwaysRedraw(() => {
            const text = `f(x) = sin(${freqTracker.value.toFixed(1)}x + ${phaseTracker.value.toFixed(1)})`;
            const label = new Text(text, { fontSize: 0.8 });
            label.paint.fill = Color.WHITE;
            label.nextTo(axes, UP, 1.0);
            return label;
        });
        this.add(labelWrapper);

        // this.always(() => this.invalidate());

        await this.wait(1000);

        await this.play(phaseTracker.animateValue(Math.PI * 4), {
            duration: 2000, rate_func: Rate.easeInOutCubic()
        });

        await this.play(freqTracker.animateValue(3.0), {
            duration: 2000, rate_func: Rate.easeOutElastic()
        });

        await this.play([
            freqTracker.animateValue(1.0),
            phaseTracker.animateValue(0)
        ], { duration: 2000 });
    }
}
