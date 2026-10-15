import {
    Scene, Color, Camera2DController, Axes, Vec3,
    Dot, AnnotationDot, GlowDot, LabeledDot,
    Create, FadeIn, Write, GrowFromCenter, Rate
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class DotShowcaseScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup Coordinate System
        const axes = new Axes({
            xRange: [-6, 6, 1],
            yRange: [-4, 4, 1],
            width: 14,
            height: 9,
            axisColor: new Color(0.7, 0.7, 0.8, 1.0),
            gridColor: new Color(0.25, 0.25, 0.35, 0.3),
            showGrid: true
        });
        this.add(axes);
        await this.play(new Create(axes, { duration: 1200, rate_func: Rate.easeOutCubic() }));

        // 2. Plot a mathematical function curve: f(x) = 2 * sin(0.8 * x)
        const graph = axes.plot((x) => 2 * Math.sin(0.8 * x), {
            stroke: new Color(0.3, 0.8, 1.0, 1.0),
            strokeWidth: 0.06
        });
        await this.play(new Create(graph, { duration: 1200 }));

        // 3. Demonstrate Standard Dots placed directly and via axes.getDot()
        const rootDot1 = axes.getDot([0, 0], {
            radius: 0.12,
            fill: Color.WHITE
        });
        const rootDot2 = axes.getDot([Math.PI / 0.8, 0], {
            radius: 0.12,
            fill: Color.WHITE
        });
        const rootDot3 = axes.getDot([-Math.PI / 0.8, 0], {
            radius: 0.12,
            fill: Color.WHITE
        });

        await this.play(new GrowFromCenter(rootDot1, { duration: 500 }));
        await this.play(new GrowFromCenter(rootDot2, { duration: 400 }));
        await this.play(new GrowFromCenter(rootDot3, { duration: 400 }));

        // 4. Demonstrate AnnotationDot highlighting the curve peak / maximum
        const peakMathX = Math.PI / (2 * 0.8);
        const peakMathY = 2;
        const peakDot = new AnnotationDot(axes.c2p(peakMathX, peakMathY), {
            radius: 0.14,
            fill: Color.fromHex("#FF5555"),
            stroke: Color.WHITE
        });

        await this.play(new GrowFromCenter(peakDot, { duration: 600 }));

        // 5. Demonstrate LabeledDot on geometric vertices
        const dotA = axes.getLabeledDot("A", [-4, 2.5], {
            radius: 0.28,
            fill: new Color(0.2, 0.6, 1.0, 1.0),
            labelColor: Color.WHITE
        });
        const dotB = axes.getLabeledDot("B", [4, 2.5], {
            radius: 0.28,
            fill: new Color(0.2, 0.8, 0.4, 1.0),
            labelColor: Color.WHITE
        });
        const dotC = axes.getLabeledDot("C", [0, -3], {
            radius: 0.28,
            fill: new Color(1.0, 0.6, 0.1, 1.0),
            labelColor: Color.WHITE
        });

        await this.play(new FadeIn(dotA, { duration: 600 }));
        await this.play(new FadeIn(dotB, { duration: 600 }));
        await this.play(new FadeIn(dotC, { duration: 600 }));

        // 6. Demonstrate Discrete / Stepped GlowDot (origin marker)
        const steppedDot = new GlowDot(axes.c2p(0, 0), {
            radius: 0.12,
            glowColor: Color.CYAN,
            glowRadius: 0.55,
            glowOpacity: 0.5,
            glowType: 'stepped',
            glowSteps: 5
        });
        await this.play(new GrowFromCenter(steppedDot, { duration: 600 }));

        // 7. Demonstrate Continuous GPU GlowDot with dynamic orbiting / path tracer
        const continuousTracer = new GlowDot(axes.c2p(-5, 2 * Math.sin(0.8 * -5)), {
            radius: 0.1,
            glowColor: Color.YELLOW,
            glowRadius: 0.5,
            glowOpacity: 0.5,
            glowType: 'continuous',
            glowFalloff: 'exponential'
        });
        this.add(continuousTracer);

        let t = -5;
        this.always((time: number, dt: number) => {
            t += dt * 0.002;
            if (t > 5) t = -5;
            const x = t;
            const y = 2 * Math.sin(0.8 * x);
            continuousTracer.point = axes.c2p(x, y);
        });

        await this.wait(2000);
    }
}
