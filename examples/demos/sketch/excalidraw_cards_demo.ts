import { frameStage, demoCaption } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/excalidraw_cards_demo.ts
// =========================================================================

import {
    Scene,
    Camera2DController,
    Color,
    Path,
    Rect,
    Circle,
    Excalidraw,
    CustomAnimation,
    Rate,
    createAnim,
} from "retiam";
import { Diamond } from "retiam/shapes";


/**
 * Hand-drawn Heart SVG path with authentic asymmetrical lobe proportions
 * matching the reference illustration.
 */
function createHeartSvgPath(): string {
    return [
        "M 0.0 -1.08",
        "C -0.58 -0.65, -1.22 -0.12, -1.16 0.38",
        "C -1.10 0.82, -0.74 1.08, -0.40 0.96",
        "C -0.20 0.88, -0.09 0.65, -0.05 0.50",
        "C -0.01 0.68, 0.18 0.98, 0.48 1.10",
        "C 0.88 1.22, 1.24 0.85, 1.16 0.32",
        "C 1.05 -0.22, 0.55 -0.65, 0.0 -1.08",
        "Z"
    ].join(" ");
}

export default class ExcalidrawCardsDemoScene extends Scene {
    public override async run(): Promise<void> {
        // Set up 2D camera with comfortable zoom framing all three cards
        const camCtrl = new Camera2DController(this, this.camera, { zoom: 15.2 });
        this.camera.position.set([0, 0, 50]);
        frameStage(this, 15, 9);
        this.clearColor(Color.WHITE);
        demoCaption(this, "Hand-drawn fill styles", "Cross-hatch · hachure · solid", true);

        // Clean white whiteboard canvas matching the reference

        const CARD_SIZE = 3.25;
        const SPACING_X = 3.65;
        const OUTLINE_COLOR = Color.fromHex("#141414");
        const OUTLINE_WIDTH = 0.095;
        const HATCH_BLUE = Color.fromHex("#1a73e8");

        const allBoilEntities: any[] = [];

        // =============================================================
        // PANEL 1 (LEFT): BLUE CROSS-HATCH & RED HEART
        // =============================================================
        const posX1 = -SPACING_X;

        // 1a. Square Card Container with light blue wash & blue cross-hatch
        const card1 = new Rect(CARD_SIZE, CARD_SIZE).toExcalidraw({
            stroke: OUTLINE_COLOR,
            strokeWidth: OUTLINE_WIDTH * 0.8,
            roughness: 0.25,
            bowing: 0.0218,
            fillStyle: 'cross-hatch',
            fill: Color.fromHex("#93c5fd"),
            fillBackground: true,
            fillAlpha: 0.40,
            fillLineColor: HATCH_BLUE,
            fillAngle: 45,
            fillGap: 0.15,
            fillLineWidth: 0.045,
            passes: 2,
            boil: true
        });
        card1.transform.position.set([posX1, 0, 0]);
        // this.add(card1);

        // Excalidraw.setTime(card1, 1000);
        // await this.play([createAnim(card1), Excalidraw.boil(card1, { duration: 1000 })]);

        // await this.play(createAnim(card1), new CustomAnimation((t) => { Excalidraw.setTime(card1, t); }));
        // await this.play(createAnim(card1), new CustomAnimation((t) => { Excalidraw.setSeed(card1, Math.floor(t * 1000)); }));

        await this.play(Excalidraw.createAnim(card1), { fps: 12 });


        allBoilEntities.push(card1);

        // 1b. Hand-drawn Coral Red Heart (opaque solid fill, black outline)
        const heart = new Path(createHeartSvgPath());
        heart.transform.position.set([posX1, 0.02, 0.02]);
        heart.transform.setScale([1.06, 1.06, 1.0]);
        heart.transform.rotateWorldZ(-0.06); // Subtle -3.5° organic tilt

        heart.toExcalidraw({
            stroke: OUTLINE_COLOR,
            strokeWidth: OUTLINE_WIDTH,
            roughness: 0.16,
            bowing: 0.22,
            fillStyle: 'filled',
            fill: Color.fromHex("#ff4d4f"),
            fillBackground: true,
            fillAlpha: 1.0,
            boil: true
        });
        // this.add(heart);
        await this.play(Excalidraw.createAnim(heart), { fps: 12 })
        allBoilEntities.push(heart);

        // =============================================================
        // PANEL 2 (CENTER): WHITE BACKGROUND, BLUE HACHURE & ORANGE CIRCLE
        // =============================================================
        const posX2 = 0;

        // 2a. Square Card Container with white background & blue diagonal hatch lines
        const card2 = new Rect(CARD_SIZE, CARD_SIZE).toExcalidraw({
            stroke: OUTLINE_COLOR,
            strokeWidth: OUTLINE_WIDTH,
            roughness: 0.15,
            bowing: 0.18,
            fillStyle: 'hachure',
            fill: HATCH_BLUE,
            fillBackground: false, // White canvas shows through
            fillLineColor: HATCH_BLUE,
            fillAngle: 45,
            fillGap: 0.15,
            fillLineWidth: 0.045,
            boil: true
        });
        card2.transform.position.set([posX2, 0, 0]);
        await this.play(Excalidraw.createAnim(card2), { fps: 12 });
        allBoilEntities.push(card2);

        // 2b. Solid Vibrant Orange Circle (opaque solid fill, black outline)
        const circle = new Circle(1.02);
        circle.transform.position.set([posX2, 0, 0.02]);

        circle.toExcalidraw({
            stroke: OUTLINE_COLOR,
            strokeWidth: OUTLINE_WIDTH,
            roughness: 0.16,
            bowing: 0.22,
            fillStyle: 'filled',
            fill: Color.fromHex("#fd7e14"),
            fillBackground: true,
            fillAlpha: 1.0,
            boil: true
        });
        await this.play(Excalidraw.createAnim(circle), { fps: 12 });
        allBoilEntities.push(circle);

        // =============================================================
        // PANEL 3 (RIGHT): SOLID BLUE BACKGROUND & WHITE CROSS-HATCH DIAMOND
        // =============================================================
        const posX3 = SPACING_X;

        // 3a. Square Card Container with solid vibrant blue fill
        const card3 = new Rect(CARD_SIZE, CARD_SIZE).toExcalidraw({
            stroke: OUTLINE_COLOR,
            strokeWidth: OUTLINE_WIDTH,
            roughness: 0.15,
            bowing: 0.18,
            fillStyle: 'filled',
            fill: HATCH_BLUE,
            fillBackground: true,
            fillAlpha: 1.0,
            boil: true
        });
        card3.transform.position.set([posX3, 0, 0]);
        await this.play(Excalidraw.createAnim(card3), { fps: 12 });
        allBoilEntities.push(card3);

        // 3b. White Diamond with White Outline & White Cross-Hatch Fill
        // Note: fillBackground: false allows the blue card background to show through the white grid
        const diamond = new Diamond({ size: 2.35 }).toExcalidraw({

            stroke: Color.WHITE,
            strokeWidth: 0.09,
            roughness: 0.15,
            bowing: 0.20,
            fillStyle: 'cross-hatch',
            fill: Color.WHITE,
            fillBackground: false,
            fillLineColor: Color.WHITE,
            fillAngle: 45,
            fillGap: 0.13,
            fillLineWidth: 0.045,
            boil: true
        });
        diamond.transform.position.set([posX3, 0, 0.02]);
        await this.play(Excalidraw.createAnim(diamond), { fps: 12 });
        allBoilEntities.push(diamond);

        // Static display: hold frame
        await this.wait(5000);
    }
}
