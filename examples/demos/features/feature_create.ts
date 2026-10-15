import { Scene, Color, CameraController, Text, Axes, FunctionGraph2D, ValueTracker, alwaysRedraw, Arrow, Write, Rate, DrawBorderThenFill, FadeIn, Create } from "retiam";
import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";

export default class CalculusScene extends Scene {
    public async run() {

        // 1. Setup Camera and Scene
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);
        frameStage(this, 28, 23, 1);
        demoCaption(this, "Changing integration bounds", "The filled area follows the animated upper limit");

        // 2. Create the Axes and add to Scene
        const axes = new Axes({
            xRange: [-1, 7, 1],
            yRange: [-1, 7, 1],
            width: 16, height: 10, showGrid: true,

        });
        axes.shift([0, 0, 0]);
        // this.add(axes);

        // 3. The mathematical function: f(x) = 0.1 * x^2 + 1
        const func = (x: number) => 0.1 * x * x + 1 + Math.sin(x);

        // Create the graph, but DO NOT add it to the hierarchy yet.
        const graph = new FunctionGraph2D(axes, func,
            {
                strokeWidth: 0.12,
                stroke: new Color(0, 1, 0.8, 1)
            }

        );

        // 4. Trackers for our Integration Bounds
        const xMinTracker = new ValueTracker(-1.0);
        const xMaxTracker = new ValueTracker(7.0);
        this.add(xMinTracker, xMaxTracker);

        // 5. Create a dynamic Area Fill
        const liveArea = alwaysRedraw(() => {
            const partialPlot = new FunctionGraph2D(axes, func, {
                samples: 50,
                strokeWidth: 0.0, // Invisible line
                fill: new Color(0, 1, 0.8, 0.3)
            });
            partialPlot.updateGraph(xMinTracker.value, xMaxTracker.value);

            return partialPlot;
        });

        // 6. Dynamic Arrow pointing to the top right of the curve
        const pointer = alwaysRedraw(() => {
            const currentX = xMaxTracker.value;
            const currentY = func(currentX);

            // Because pointer will be a child of axes, we use PURE LOCAL coordinates!
            const targetPoint = axes.c2p(currentX, currentY);
            const startPoint = targetPoint.add([-2, 3, 0]);

            return new Arrow(startPoint, targetPoint, { color: Color.YELLOW, strokeWidth: 0.08 });
        });

        // 7. Dynamic Text Label mapping the area
        const mathLabel = alwaysRedraw(() => {
            const val = xMaxTracker.value;
            const label = new Text(`x = ${val.toFixed(2)}`, { fontSize: 0.8 });
            label.paint.fill = Color.WHITE;

            // Pure local coordinates!
            const p = axes.c2p(val, func(val));
            const pos = p.add([-2, 3.5, 0]);
            label.move(pos);

            return label;
        });

        // ==========================================
        // THE ANIMATION CHOREOGRAPHY
        // ==========================================

        await this.wait(500);

        // A. Draw the Axes and the Graph
        await this.play(new Write(axes), { duration: 3000 });

        // Make the graph a child of axes RIGHT BEFORE animating it!
        axes.add(graph);
        await this.play(new Write(graph, { duration: 1500, rate_func: Rate.easeOutCubic() }));

        // B. Create a completely STATIC area to animate drawing first
        const staticArea = new FunctionGraph2D(axes, func, {
            samples: 50,
            strokeWidth: 0.0,
            fill: new Color(0, 1, 0.8, 0.3)
        });
        staticArea.updateGraph(-1.0, 7.0); // Exact starting bounds

        // Add staticArea as a child of the axes
        axes.add(staticArea);

        // Animate drawing the static boundary outline, then fill it
        await this.play(new DrawBorderThenFill(staticArea.areaFill!, {
            duration: 1500,
            strokeWidth: 0.04,
            stroke: new Color(0, 1, 0.8, 1.0)
        }));

        // --- C. THE SEAMLESS SWAP ---
        // Cleanly remove from axes (not the world) and destroy GPU buffers
        axes.remove(staticArea);
        staticArea.destroy();

        // Instantly activate the live reactive elements as children of the axes!
        axes.add(liveArea, pointer, mathLabel);

        // D. Fade in the arrow and text
        await this.play([
            new FadeIn(pointer, { duration: 500 }),
            new FadeIn(mathLabel, { duration: 500 })
        ]);

        await this.wait(1000);

        // E. Animate the bounds of integration (Squish to the left)
        await this.play(xMaxTracker.animateValue(1.0), {
            duration: 3000, rate_func: Rate.easeInOutCubic()
        });

        await this.wait(500);

        // F. Sweep it back out to the far right edge of the grid
        await this.play(xMaxTracker.animateValue(7.0), {
            duration: 2500, rate_func: Rate.easeInOutExpo()
        });

        await this.wait(2000);
    }
}
