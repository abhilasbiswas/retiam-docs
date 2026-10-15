import { frameStage, demoCaption } from "../../shared/presentation";

// =========================================================================
// 1. MATHEMATICAL PATH GENERATORS
// =========================================================================

import { Builder, Scene, CameraController, Axes, Color, Path, Write, VectorTransform, Rate, MatchingPolicy, OrbitCameraController } from "retiam";

/**
 * Generates an Infinity Symbol (Lemniscate of Bernoulli)
 * Formula: r^2 = a^2 * cos(2t)
 */
function generateInfinityPath(scale: number): string {
    const builder = new Builder();
    const segments = 120;

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        // Shift by 90 degrees (PI/2) so the first point is at the origin (0,0)
        const t = theta + Math.PI * 2 / 4;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = scale * Math.cos(t) / denom;
        const y = scale * Math.sin(t) * Math.cos(t) / denom;

        if (i === 0) {
            builder.moveTo(x, y);
        } else {
            builder.lineTo(x, y);
        }
    }
    builder.closePath();
    return builder.toString();
}

/**
 * Generates a smooth mathematical Heart curve
 */
function generateHeartPath(scale: number): string {
    const builder = new Builder();
    const segments = 120;

    for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        // Classic parametric heart equations
        const x = scale * 16 * Math.pow(Math.sin(t), 3);
        const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        if (i === 0) {
            builder.moveTo(x, y);
        } else {
            builder.lineTo(x, y);
        }
    }
    builder.closePath();
    return builder.toString();
}

/**
 * Generates a mathematical Rose (5-Petaled Flower Curve)
 * Formula: r = cos(k * theta)
 */
function generateRosePath(scale: number, k: number = 5): string {
    const builder = new Builder();
    const segments = 120;

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const r = scale * Math.cos(k * theta);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        if (i === 0) {
            builder.moveTo(x, y);
        } else {
            builder.lineTo(x, y);
        }
    }
    builder.closePath();
    return builder.toString();
}

// =========================================================================
// 2. SHOWCASE SCENE RUNNER
// =========================================================================

export default class MorphShowcaseScene extends Scene {
    private shape1!: Path;
    private shape2!: Path;
    private shape3!: Path;

    public async run() {
        // this.skip(100000);
        // 1. Setup Camera and Controls
        this.camera.position.set([0, 0, 100]);
        new OrbitCameraController(this, this.camera);
        frameStage(this, 112, 110);
        demoCaption(this, "Path morphing", "Infinity · heart · rose");

        // 2. Add a coordinate grid to show off spatial morph alignment
        const grid = new Axes({
            xRange: [-10, 10, 2],
            yRange: [-10, 10, 2],
            width: 80,
            height: 80,
            axisColor: new Color(0.2, 0.3, 0.45, 0.4),
            gridColor: new Color(0.1, 0.15, 0.25, 0.15),
            showGrid: true
        });
        // grid.z_index = -1.0; // Place grid safely behind the morphing shapes
        this.add(grid);

        // 3. Create the Showcase Shapes
        // Shape 1: Neon Cyan Infinity Symbol
        this.shape1 = new Path(generateInfinityPath(8.0), { scale: 4 });
        this.shape1.paint.fill = new Color(0.1, 0.5, 1.0, 0.85); // Cold Blue
        this.shape1.paint.stroke = new Color(0.3, 0.8, 1.0, 1.0); // Neon Cyan
        this.shape1.paint.strokeWidth = 0.08;

        // Shape 2: Crimson Pink Heart
        this.shape2 = new Path(generateHeartPath(0.42), { scale: 4 });
        this.shape2.paint.fill = new Color(1.0, 0.1, 0.4, 0.85); // Warm Rose
        this.shape2.paint.stroke = new Color(1.0, 0.5, 0.7, 1.0); // Bright Pink
        this.shape2.paint.strokeWidth = 0.08;

        // Shape 3: Sunset Gold Rose Flower
        this.shape3 = new Path(generateRosePath(7.5, 5), { scale: 4 });
        this.shape3.paint.fill = new Color(1.0, 0.4, 0.1, 0.85); // Deep Orange
        this.shape3.paint.stroke = new Color(1.0, 0.8, 0.2, 1.0); // Marigold Yellow
        this.shape3.paint.strokeWidth = 0.08;

        // Keep the render loop ticking
        this.always(() => {
            this.invalidate();
        });

        // 4. Beautiful Entry Sequence
        // Write the outline of the first shape, then fill it
        await this.play(new Write(this.shape1, { duration: 1800, strokeWidth: 0.08, stroke: this.shape1.paint.stroke }));
        await this.wait(500);
        // this.checkPoint(); //skip upto this point

        // 5. Infinite Morphing Loop
        while (true) {
            // Morph 1: Lemniscate -> Heart
            await this.play(new VectorTransform(this.shape1, this.shape2), {
                duration: 2500,
                rate_func: Rate.easeInOutCubic()
            });


            await this.wait(1000);

            // Morph 2: Heart -> Rose
            await this.play(new VectorTransform(this.shape2, this.shape3), {
                duration: 2500,
                rate_func: Rate.easeInOutCubic(),
            });

            await this.wait(1000);

            // Morph 3: Rose -> Lemniscate (completing the loop)
            await this.play(new VectorTransform(this.shape3, this.shape1), {
                duration: 2500,
                rate_func: Rate.easeInOutCubic(),
            });
            await this.wait(1000);
        }
    }
}
