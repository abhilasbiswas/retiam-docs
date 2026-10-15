import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/excalidraw_fills_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Camera2DController,
    Color,
    SDFText,
    Rect,
    Circle,
    Arrow,
    VectorEntity,
    Excalidraw,
    Rate,
    CustomAnimation,
    createAnim,
} from "retiam";
import { Star } from "retiam/shapes";

// Clean whiteboard palette tokens
const CANVAS_BG = Color.fromHex("#ffffff");
const CHARCOAL = Color.fromHex("#1e1e1e");
const PURPLE = Color.fromHex("#6965db");
const MUTED_GRAY = Color.fromHex("#71717a");
const CARD_BORDER = Color.fromHex("#d4d4d8");
const ACCENT_BLUE = Color.fromHex("#0284c7");
const ACCENT_EMERALD = Color.fromHex("#059669");
const ACCENT_AMBER = Color.fromHex("#d97706");
const ACCENT_ROSE = Color.fromHex("#e11d48");
const ACCENT_TEAL = Color.fromHex("#0d9488");
const ACCENT_SLATE = Color.fromHex("#475569");

export default class ExcalidrawFillsDemoScene extends Scene {
    public override async run(): Promise<void> {
        // Set up 2D camera with comfortable zoom framing the entire showcase
        frameStage(this, 17, 14, 0);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });
        this.camera.position.set([0, 0, 10]);

        // Clean white whiteboard canvas matching authentic Excalidraw
        this.clearColor(CANVAS_BG);

        const boilingEntities: VectorEntity[] = [];

        // -------------------------------------------------------------
        // 1. HEADER & SUBTITLE
        // -------------------------------------------------------------
        const title = new SDFText("Excalidraw Fill Style Showcase", { anchor: CENTER, fontSize: 0.58 });
        title.transform.position.set([0, 5.0, 0]);
        title.paint.fill = CHARCOAL.clone();
        this.add(title);

        const subtitle = new SDFText(
            "Continuous Marker Zigzag & Orthogonal Grid Patterns • Pure Whiteboard Rendering",
            { anchor: CENTER, fontSize: 0.23 }
        );
        subtitle.transform.position.set([0, 4.42, 0]);
        subtitle.paint.fill = MUTED_GRAY.clone();
        this.add(subtitle);

        // -------------------------------------------------------------
        // 2. HERO SECTION: THE TWO SIGNATURE STYLES
        // -------------------------------------------------------------

        // --- HERO A (LEFT): CONTINUOUS MARKER SCRIBBLE CIRCLE ---
        const cardLeft = new Rect(4.6, 4.6, { cornerRadius: 0.3 }).toExcalidraw({
            strokeColor: CARD_BORDER,
            strokeWidth: 0.04,
            roughness: 0.3,
            bowing: 0.2,
            fillStyle: 'none',
            fillBackground: false,
        });
        cardLeft.transform.position.set([-4.2, 1.7, 0]);
        this.add(cardLeft);
        boilingEntities.push(cardLeft);

        const heroATitle = new SDFText("Signature Zigzag Fill", { anchor: CENTER, fontSize: 0.26 });
        heroATitle.transform.position.set([-4.2, 3.5, 0.05]);
        heroATitle.paint.fill = PURPLE.clone();
        this.add(heroATitle);

        const heroASub = new SDFText("Continuous marker zigzag • bevel joint & butt cap", { anchor: CENTER, fontSize: 0.17 });
        heroASub.transform.position.set([-4.2, 3.15, 0.05]);
        heroASub.paint.fill = MUTED_GRAY.clone();
        this.add(heroASub);

        // The Signature Circle matching Reference 1 (Black outline, Purple zigzag fill)
        const scribbleCircle = new Star(8).toExcalidraw({
            stroke: CHARCOAL,
            fill: PURPLE,
            fillStyle: 'zigzag',
            fillBackground: false,
            strokeWidth: 0.065,
            preset: 'normal',
            seed: 42,
        });
        scribbleCircle.transform.position.set([-4.2, 1.45, 0.05]);
        this.add(scribbleCircle);
        boilingEntities.push(scribbleCircle);

        const heroACode = new SDFText("fillStyle: 'zigzag'", { anchor: CENTER, fontSize: 0.20 });
        heroACode.transform.position.set([-4.2, -0.15, 0.05]);
        heroACode.paint.fill = PURPLE.clone();
        this.add(heroACode);

        // --- HERO B (RIGHT): ORTHOGONAL GRID SQUARE ---
        const cardRight = new Rect(4.6, 4.6, { cornerRadius: 0.3 }).toExcalidraw({
            strokeColor: CARD_BORDER,
            strokeWidth: 0.04,
            roughness: 0.15,
            bowing: 0.15,
            fillStyle: 'none',
            fillBackground: false,
        });
        cardRight.transform.position.set([4.2, 1.7, 0]);
        this.add(cardRight);
        boilingEntities.push(cardRight);

        const heroBTitle = new SDFText("Orthogonal Grid Fill", { anchor: CENTER, fontSize: 0.26 });
        heroBTitle.transform.position.set([4.2, 3.5, 0.05]);
        heroBTitle.paint.fill = CHARCOAL.clone();
        this.add(heroBTitle);

        const heroBSub = new SDFText("Perpendicular 0 and 90 deg hatch mesh", { anchor: CENTER, fontSize: 0.17 });
        heroBSub.transform.position.set([4.2, 3.15, 0.05]);
        heroBSub.paint.fill = MUTED_GRAY.clone();
        this.add(heroBSub);

        // The Signature Grid Square matching Reference 2 (Architect square with dense grid)
        const gridSquare = new Rect(2.7, 2.7).toExcalidraw({
            stroke: CHARCOAL,
            fill: CHARCOAL,
            fillStyle: 'grid',
            fillBackground: false,
            fillGap: 0.16,
            strokeWidth: 0.065,
            fillLineWidth: 0.045,
            preset: 'architect',
            overshoot: 0.16,
            crossCorners: true,
            seed: 88,
        });
        gridSquare.transform.position.set([4.2, 1.45, 0.05]);
        this.add(gridSquare);
        boilingEntities.push(gridSquare);

        const heroBCode = new SDFText("fillStyle: 'grid'", { anchor: CENTER, fontSize: 0.20 });
        heroBCode.transform.position.set([4.2, -0.15, 0.05]);
        heroBCode.paint.fill = CHARCOAL.clone();
        this.add(heroBCode);

        // --- CENTER CONNECTOR ARROW ---
        const centerArrow = new Arrow([-1.4, 1.45, 0], [1.4, 1.45, 0], {
            headLength: 0.32,
            headWidth: 0.26,
            tipType: 'stealth',
            strokeWidth: 0.06,
        }).toExcalidraw({
            stroke: MUTED_GRAY,
            strokeWidth: 0.05,
            preset: 'clean',
        });
        this.add(centerArrow);
        boilingEntities.push(centerArrow);

        const centerLabel = new SDFText("Hand-Drawn", { anchor: CENTER, fontSize: 0.19 });
        centerLabel.transform.position.set([0, 1.82, 0]);
        centerLabel.paint.fill = MUTED_GRAY.clone();
        this.add(centerLabel);

        const centerSub = new SDFText("fillBackground: false", { anchor: CENTER, fontSize: 0.15 });
        centerSub.transform.position.set([0, 1.15, 0]);
        centerSub.paint.fill = MUTED_GRAY.clone();
        this.add(centerSub);

        // -------------------------------------------------------------
        // 3. COMPLETE 8-STYLE WHITEBOARD GALLERY (BOTTOM ROW)
        // -------------------------------------------------------------
        const galleryLabel = new SDFText("Complete Excalidraw Fill Style Palette", { anchor: CENTER, fontSize: 0.28 });
        galleryLabel.transform.position.set([0, -1.05, 0]);
        galleryLabel.paint.fill = CHARCOAL.clone();
        this.add(galleryLabel);

        type StyleConfig = {
            id: 'hachure' | 'cross-hatch' | 'grid' | 'zigzag' | 'scribble' | 'dots' | 'sketch' | 'solid';
            label: string;
            isNew?: boolean;
            color: Color;
            isCircle?: boolean;
        };

        const galleryStyles: StyleConfig[] = [
            { id: 'hachure', label: "Hachure", color: ACCENT_BLUE },
            { id: 'cross-hatch', label: "Cross-Hatch", color: ACCENT_EMERALD },
            { id: 'grid', label: "Grid", isNew: true, color: PURPLE },
            { id: 'zigzag', label: "Zigzag", color: ACCENT_AMBER, isCircle: true },
            { id: 'scribble', label: "Scribble", isNew: true, color: PURPLE, isCircle: true },
            { id: 'dots', label: "Dots", color: ACCENT_ROSE },
            { id: 'sketch', label: "Sketch", color: ACCENT_SLATE },
            { id: 'solid', label: "Solid", color: ACCENT_TEAL, isCircle: true },
        ];

        const startX = -6.65;
        const spacingX = 1.9;
        const rowY = -2.7;

        for (let i = 0; i < galleryStyles.length; i++) {
            const item = galleryStyles[i];
            const posX = startX + i * spacingX;

            // Title label above
            const itemTitle = new SDFText(item.label, { anchor: CENTER, fontSize: 0.19 });
            itemTitle.transform.position.set([posX, rowY + 1.15, 0]);
            itemTitle.paint.fill = item.color.clone();
            this.add(itemTitle);

            // Shape (Rect or Circle)
            let shape: VectorEntity;
            if (item.isCircle) {
                shape = new Circle(0.72).toExcalidraw({
                    fillStyle: item.id,
                    stroke: item.color,
                    fill: item.color,
                    fillBackground: false,
                    fillGap: item.id === 'dots' ? 0.16 : (item.id === 'zigzag' ? 0.10 : 0.14),
                    strokeWidth: 0.055,
                    preset: 'normal',
                });
            } else {
                shape = new Rect(1.44, 1.44).toExcalidraw({
                    fillStyle: item.id,
                    stroke: item.color,
                    fill: item.color,
                    fillBackground: false,
                    fillGap: 0.14,
                    strokeWidth: 0.055,
                    preset: 'normal',
                });
            }

            shape.transform.position.set([posX, rowY, 0]);
            this.add(shape);
            boilingEntities.push(shape);

            // Optional "NEW" pill text under new styles
            if (item.isNew) {
                const newTag = new SDFText("NEW", { anchor: CENTER, fontSize: 0.14 });
                newTag.transform.position.set([posX, rowY - 1.05, 0]);
                newTag.paint.fill = PURPLE.clone();
                this.add(newTag);
            }
        }

        // -------------------------------------------------------------
        // 4. ANIMATION: ENTRANCE CREATION & 12 FPS CONTINUOUS LINE BOIL
        // -------------------------------------------------------------
        // Progressive pen drawing animation for the hero shapes
        await this.play([
            createAnim(scribbleCircle, { duration: 1200, rate_func: Rate.easeOutQuad() }),
            createAnim(gridSquare, { duration: 1200, rate_func: Rate.easeOutQuad() }),
            createAnim(centerArrow, { duration: 800, rate_func: Rate.easeOutQuad() }),
        ]);

        // Continuous 12 FPS authentic Excalidraw line boil
        await this.play(new CustomAnimation((alpha) => {
            const t = alpha * 10.0; // 10 seconds of living whiteboard boil
            for (const ent of boilingEntities) {
                Excalidraw.setTime(ent, t);
            }
        }, { duration: 10000, rate_func: Rate.linear() }));
    }
}
