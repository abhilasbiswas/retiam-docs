import {
    Scene,
    Color,
    Camera2DController,
    NumberPlane,
    Create,
    FadeIn,
    GrowFromCenter,
    Rate,
    FadeOut,
    Concurrent,
    GrowFromEdge
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class CalculusFeatureScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 18]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        this.always(() => this.invalidate());

        // 1. Setup Coordinate Grid
        const plane = new NumberPlane({
            xRange: [-6, 6, 1],
            yRange: [-3.5, 3.5, 1],
            width: 14,
            height: 8,
            axisColor: new Color(0.7, 0.8, 0.95, 1.0),
            gridColor: new Color(0.2, 0.35, 0.55, 0.35),
            showLabels: true
        });
        this.add(plane);
        await this.play(new Create(plane, { duration: 1000, rate_func: Rate.easeOutCubic() }));

        // 2. Plot Mathematical Function f(x) = 0.25 * x^2 + 0.4
        const func = (x: number) => 0.25 * x * x + 0.4;
        const curve = plane.plot(func, {
            stroke: new Color(1.0, 0.85, 0.2, 1.0),
            strokeWidth: 0.07,
            xRange: [-3.5, 3.5],
            samples: 200
        });
        await this.play(new Create(curve, { duration: 800 }));

        // 3. Discrete Riemann Sum Midpoint Rectangles in [0, 3.5]
        const riemannBars = plane.getRiemannRectangles(curve, [0, 3.5], 0.5, {
            rule: "midpoint",
            fill: new Color(0.2, 0.85, 0.5, 0.55),
            stroke: new Color(1.0, 1.0, 1.0, 0.85),
            strokeWidth: 0.015
        });
        await this.play(new Concurrent(
            riemannBars.children.map(bar => new GrowFromEdge(bar, { edge: "bottom" })),
            { lagRatio: 0.15, duration: 1200 }
        ));
        await this.wait(1000);

        // 4. Transition Riemann Rectangles into smooth Continuous Definite Integral Area
        const area = plane.getArea(curve, [0, 3.5], {
            fill: new Color(0.2, 0.7, 1.0, 0.4)
        });
        await this.play([
            new FadeOut(riemannBars, { duration: 600 }),
            new FadeIn(area, { duration: 600 })
        ]);

        // 5. Dynamic Derivative Tangent Line touching at x = 2.0
        const tangent = plane.getTangentLine(2.0, curve, {
            length: 4.0,
            stroke: new Color(1.0, 0.3, 0.4, 1.0),
            strokeWidth: 0.04
        });
        await this.play(new Create(tangent, { duration: 600 }));

        // 6. Projections to Axes and Labeled Point P(2, f(2))
        const pWorld = plane.c2p(2.0, func(2.0));
        const projLines = plane.getLinesToPoint(pWorld, {
            stroke: new Color(1.0, 1.0, 1.0, 0.6),
            strokeWidth: 0.02
        });
        const labeledDot = plane.getLabeledDot("P", [2.0, func(2.0)], {
            radius: 0.24,
            fill: new Color(1.0, 0.3, 0.4, 1.0),
            labelColor: Color.WHITE
        });
        await this.play(new Create(projLines, { duration: 400 }));
        await this.play(new GrowFromCenter(labeledDot, { duration: 400 }));

        await this.wait(2000);
    }
}
