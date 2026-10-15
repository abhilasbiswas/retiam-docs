// =========================================================================
// File: examples/demos/features/box_layout_demo.ts
// =========================================================================

import {
    Entity,
    Scene,
    Color,
    Text,
    Tex,
    Circle,
    Rect,
    VBox,
    HBox,
    Create,
    Write,
    CameraModel,
    CameraController,
    Rate
} from "retiam";
import { demoBackground, frameContent } from "../../shared/presentation";

export default class BoxLayoutDemo extends Scene {
    public async run() {
        // 1. Setup Camera & Canvas Background
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);

        // 2. Header Section (VBox: Title + Subtitle)
        const title = new Text("Semantic Auto-Layout Engine", { fontSize: 1.6 });
        title.paint.fill = new Color(1.0, 0.8, 0.2, 1.0); // Gold

        const subtitle = new Text("Automatic bounding-box stacking with zero spatial guesswork", { fontSize: 0.8 });
        subtitle.paint.fill = new Color(0.7, 0.7, 0.85, 1.0); // Light gray

        const headerBox = new VBox({ gap: 0.4, align: 'center' }, title, subtitle);

        // 3. Left Column: Geometry Card
        const geoTitle = new Text("2D Geometry Card", { fontSize: 1.0 });
        geoTitle.paint.fill = new Color(0.2, 0.8, 1.0, 1.0); // Cyan

        const circle = new Circle(2);
        circle.paint.fill = new Color(0.1, 0.5, 0.9, 0.4);
        circle.paint.setStroke(0.1, Color.BLUE);

        const rect = new Rect(4, 2);
        rect.paint.fill = new Color(0.9, 0.3, 0.3, 0.4);
        rect.paint.setStroke(0.1, Color.RED);

        const leftColumn = new VBox({ gap: 0.6, align: 'center' }, geoTitle, circle, rect);

        // 4. Right Column: Mathematical Formulas Card
        const mathTitle = new Text("Math Derivation Card", { fontSize: 1.0 });
        mathTitle.paint.fill = new Color(0.3, 1.0, 0.5, 1.0); // Green

        const eq1 = new Tex("e^{i\\pi} + 1 = 0", { fontSize: 1.2 });
        const eq2 = new Tex("\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}", { fontSize: 1.2 });
        const eq3 = new Tex("\\nabla \\times \\mathbf{B} = \\frac{1}{c} \\frac{\\partial \\mathbf{E}}{\\partial t} + \\frac{4\\pi}{c}\\mathbf{J}", { fontSize: 1.2 });

        const rightColumn = new VBox({ gap: 0.7, align: 'left' }, mathTitle, eq1, eq2, eq3);

        // 5. Combine columns horizontally using HBox
        const columns = new HBox({ gap: 2.5, align: 'top' }, leftColumn, rightColumn);

        // 6. Master Layout: Header vertically stacked above columns
        const mainLayout = new VBox({ gap: 1.5, align: 'center' }, headerBox, columns);
        this.add(mainLayout);

        // 7. Automated Framing: Fits the entire layout comfortably with 20% margin
        // Keep the complete layout in frame while individual children are hidden for their entrances.
        frameContent(this, mainLayout.getBoundingBox(true), 0.2);
        mainLayout.forSubNodes((e) => e.VISIBILITY = false);
        const reveal = (entity: Entity) => {
            entity.forSubNodes(e => { e.VISIBILITY = true; });
            entity.forSuperNodes(e => { e.VISIBILITY = true; });
        };

        // 8. Animation Sequence
        reveal(title);
        await this.play(new Write(title, { duration: 900 }));
        reveal(subtitle);
        await this.play(new Write(subtitle, { duration: 700 }));
        reveal(geoTitle);
        reveal(mathTitle);
        await this.play([new Write(geoTitle), new Write(mathTitle)], { duration: 500 });
        reveal(circle);
        reveal(eq1);
        await this.play(
            [new Create(circle),
            new Write(eq1)],
            {
                rate_func: Rate.easeInOut(),
                duration: 3000
            }
        );
        reveal(rect);
        reveal(eq2);
        await this.play(
            new Create(rect, { duration: 800 }),
            new Write(eq2, { duration: 800 })
        );
        reveal(eq3);
        await this.play(new Write(eq3, { duration: 1500 }));
    }
}
