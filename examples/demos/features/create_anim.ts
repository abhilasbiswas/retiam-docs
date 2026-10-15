import { demoBackground } from "../../shared/presentation";
import { Axes, Builder, Circle, Color, Create, FunctionGraph2D, Path, Rate, Rect, Scene, VGroup, Vec3, Write } from "retiam";


export default class CreationDemoScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        this.camera.position.set([0, 0, 25]);

        // 1. Create shapes
        const circle = new Circle(2);
        circle.paint.setStroke(0.1, Color.RED);
        circle.paint.fill = new Color(1.0, 0.0, 0.0, 0.4);

        // FIX: Use Path instead of Rect for perfect stroke tracing
        const builder = new Builder();
        builder.rect(-2, -2, 4, 4);
        const square = new Path(builder.toString());
        square.paint.setStroke(0.1, Color.BLUE);
        square.paint.fill = new Color(0.0, 0.0, 1.0, 0.4);

        const group = new VGroup(circle, square);
        group.arrange(new Vec3(1, 0, 0), 1.5);
        group.transform.shift(new Vec3(0, 4, 0));

        // 2. Play the Create Animation!
        await this.play(new Create(group, {
            duration: 2000,
            lagRatio: 0.5,
            rate_func: Rate.easeInOutCubic()
        }));

        // 3. Create a Math Plot
        const axes = new Axes({
            xRange: [-5, 5, 1],
            yRange: [-3, 3, 1],
            width: 10,
            height: 6
        });

        // Shift axes down. The sinGraph will automatically follow it!
        axes.transform.shift(new Vec3(0, -3, 0));

        const sinGraph = new FunctionGraph2D(axes, (x) => Math.sin(x), {
            stroke: Color.YELLOW,
            strokeWidth: 0.1,
            fill: new Color(1.0, 1.0, 0.0, 0.2)
        });

        // 4. Draw sequentially

        await this.play(new Write(axes, { duration: 1500 }));
        axes.add(sinGraph)
        await this.play(new Create(sinGraph, { duration: 2500, rate_func: Rate.easeInOutSine() }));
    }
}
