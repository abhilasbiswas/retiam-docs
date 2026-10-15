import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/excalidraw_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Camera2DController,
    SDFText,
    Color,
    Rect,
    Circle,
    Arrow,
    Path,
    Excalidraw,
    Rate,
    CustomAnimation,
    createAnim
} from "retiam";
import { Diamond } from "retiam/shapes";


// Authentic Excalidraw-inspired whiteboard palette
const hexAlpha = (hexStr: string, a: number = 0.45) => {
    const c = Color.fromHex(hexStr);
    return new Color(c.r, c.g, c.b, a);
};
const WHITE = Color.fromHex("#ffffff");
const GRAY = Color.fromHex("#868e96");
const LIGHT_GRAY = Color.fromHex("#e9ecef");
const BLUE = Color.fromHex("#1971c2");
const BLUE_FILL = hexAlpha("#a5d8ff", 0.45);
const ORANGE = Color.fromHex("#e8590c");
const ORANGE_FILL = hexAlpha("#ffd8a8", 0.45);
const TEAL = Color.fromHex("#099268");
const TEAL_FILL = hexAlpha("#96f2d7", 0.45);
const GRAPE = Color.fromHex("#9c36b5");
const GRAPE_FILL = hexAlpha("#eebefa", 0.45);
const YELLOW = Color.fromHex("#fab005");
const GREEN = Color.fromHex("#2f9e44");
const GREEN_FILL = hexAlpha("#b2f2bb", 0.45);
const PINK = Color.fromHex("#e64980");
const PINK_FILL = hexAlpha("#fcc2d7", 0.45);
const CYAN = Color.fromHex("#0c8599");
const CYAN_FILL = hexAlpha("#99e9f2", 0.45);
const VIOLET = Color.fromHex("#7048e8");
const VIOLET_FILL = hexAlpha("#d0bfff", 0.45);
const RED = Color.fromHex("#e03131");
const RED_FILL = hexAlpha("#ffc9c9", 0.45);

export default class ExcalidrawDemoScene extends Scene {
    public override async run(): Promise<void> {
        frameStage(this, 20, 16, 0);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });
        this.clearColor(Color.fromHex("#121212")); // Authentic Excalidraw Dark Canvas

        // -------------------------------------------------------------
        // HEADER & TITLE
        // -------------------------------------------------------------
        const title = new SDFText("Excalidraw Whiteboard Style", { anchor: CENTER, fontSize: 0.65 });
        title.transform.position.set([0, 6.2, 0]);
        title.paint.fill = WHITE.clone();
        this.add(title);

        const subtitle = new SDFText(
            "Hand-Drawn Vector Engine • Rough.js Geometry • Sketch Pen Dynamics • 12 FPS Line Boil",
            { anchor: CENTER, fontSize: 0.26 }
        );
        subtitle.transform.position.set([0, 5.65, 0]);
        subtitle.paint.fill = GRAY.clone();
        this.add(subtitle);

        // -------------------------------------------------------------
        // SECTION 1: ARCHITECTURE WHITEBOARD DIAGRAM (TOP HALF)
        // -------------------------------------------------------------
        const diagLabel = new SDFText("System Architecture Diagram", { fontSize: 0.32 });
        diagLabel.transform.position.set([-6.5, 4.8, 0]);
        diagLabel.paint.fill = BLUE.clone();
        this.add(diagLabel);

        // 1. Client App Card (Left)
        const clientBox = new Rect(2.4, 1.8, { cornerRadius: 0.15 }).toExcalidraw({
            fillStyle: 'hachure',
            fill: BLUE_FILL,
            stroke: BLUE,
            strokeWidth: 0.1,
            preset: 'architect'
        });
        clientBox.transform.position.set([-6.2, 3.2, 0]);

        await this.play(createAnim(clientBox));

        const clientTitle = new SDFText("Web & Mobile", { anchor: CENTER, fontSize: 0.24 });
        clientTitle.transform.position.set([-6.2, 3.4, 0.02]);
        clientTitle.paint.fill = WHITE.clone();
        this.add(clientTitle);

        const clientSub = new SDFText("React / Native", { anchor: CENTER, fontSize: 0.18 });
        clientSub.transform.position.set([-6.2, 3.0, 0.02]);
        clientSub.paint.fill = GRAY.clone();
        this.add(clientSub);

        // 2. Gateway Decision Diamond (Center-Left)
        const gatewayDiamond = new Diamond({ width: 2.2, height: 1.8 }).toExcalidraw({

            fillStyle: 'cross-hatch',
            fill: ORANGE_FILL,
            stroke: ORANGE,
            strokeWidth: 0.09,
            fillGap: 0.20
        });
        gatewayDiamond.transform.position.set([-2.2, 3.2, 0]);
        this.add(gatewayDiamond);

        const gwTitle = new SDFText("API Gateway", { anchor: CENTER, fontSize: 0.22 });
        gwTitle.transform.position.set([-2.2, 3.3, 0.02]);
        gwTitle.paint.fill = WHITE.clone();
        this.add(gwTitle);

        const gwSub = new SDFText("Rate Limit & Auth", { anchor: CENTER, fontSize: 0.16 });
        gwSub.transform.position.set([-2.2, 2.95, 0.02]);
        gwSub.paint.fill = GRAY.clone();
        this.add(gwSub);

        // Arrow: Client -> Gateway
        const arrow1 = new Arrow([-4.9, 3.2, 0], [-3.4, 3.2, 0], {
            headLength: 0.35,
            headWidth: 0.30,
            tipType: 'stealth',
            strokeWidth: 0.07,
        }).toExcalidraw({
            anchorEnds: true,
            stroke: LIGHT_GRAY,
            strokeWidth: 0.07,
        });
        this.add(arrow1);

        const arrow1Label = new SDFText("HTTPS / WSS", { anchor: CENTER, fontSize: 0.16 });
        arrow1Label.transform.position.set([-4.15, 3.45, 0.02]);
        arrow1Label.paint.fill = GRAY.clone();
        this.add(arrow1Label);

        // 3. Core Microservices Container (Center-Right)
        const serviceBox = new Rect(2.6, 1.8, { cornerRadius: 0.12 }).toExcalidraw({
            fillStyle: 'zigzag',
            fill: TEAL_FILL,
            stroke: TEAL,
            strokeWidth: 0.09,
            fillGap: 0.10
        });
        serviceBox.transform.position.set([2.0, 3.2, 0]);
        this.add(serviceBox);

        const srvTitle = new SDFText("Compute Cluster", { anchor: CENTER, fontSize: 0.22 });
        srvTitle.transform.position.set([2.0, 3.4, 0.02]);
        srvTitle.paint.fill = WHITE.clone();
        this.add(srvTitle);

        const srvSub = new SDFText("Rust + WebGPU Worker", { anchor: CENTER, fontSize: 0.16 });
        srvSub.transform.position.set([2.0, 3.0, 0.02]);
        srvSub.paint.fill = GRAY.clone();
        this.add(srvSub);

        // Arrow: Gateway -> Services
        const arrow2 = new Arrow([-1.0, 3.2, 0], [0.6, 3.2, 0], {
            headLength: 0.35,
            headWidth: 0.30,
            tipType: 'stealth',
            strokeWidth: 0.07,
        }).toExcalidraw({
            anchorEnds: true,
            stroke: LIGHT_GRAY,
            strokeWidth: 0.07,
        });
        this.add(arrow2);

        const arrow2Label = new SDFText("gRPC Payload", { anchor: CENTER, fontSize: 0.16 });
        arrow2Label.transform.position.set([-0.2, 3.45, 0.02]);
        arrow2Label.paint.fill = GRAY.clone();
        this.add(arrow2Label);

        // 4. Database Circle Node (Right)
        const dbCircle = new Circle(1.0).toExcalidraw({
            fillStyle: 'hachure',
            fill: GRAPE_FILL,
            stroke: GRAPE,
            strokeWidth: 0.09,
            fillGap: 0.18
        });
        dbCircle.transform.position.set([6.2, 3.2, 0]);
        this.add(dbCircle);

        const dbTitle = new SDFText("PostgreSQL", { anchor: CENTER, fontSize: 0.22 });
        dbTitle.transform.position.set([6.2, 3.35, 0.02]);
        dbTitle.paint.fill = WHITE.clone();
        this.add(dbTitle);

        const dbSub = new SDFText("Persistent Store", { anchor: CENTER, fontSize: 0.16 });
        dbSub.transform.position.set([6.2, 2.95, 0.02]);
        dbSub.paint.fill = GRAY.clone();
        this.add(dbSub);

        // Arrow: Services -> Database
        const arrow3 = new Arrow([3.4, 3.2, 0], [5.1, 3.2, 0], {
            headLength: 0.35,
            headWidth: 0.30,
            tipType: 'stealth',
            strokeWidth: 0.07,
        }).toExcalidraw({
            anchorEnds: true,
            stroke: LIGHT_GRAY,
            strokeWidth: 0.07,
        });
        this.add(arrow3);

        const arrow3Label = new SDFText("SQL Queries", { anchor: CENTER, fontSize: 0.16 });
        arrow3Label.transform.position.set([4.25, 3.45, 0]);
        arrow3Label.paint.fill = GRAY.clone();
        this.add(arrow3Label);

        // -------------------------------------------------------------
        // SECTION 2: FILL STYLE SHOWCASE GALLERY (BOTTOM HALF)
        // -------------------------------------------------------------
        const fillLabel = new SDFText("Hand-Drawn Procedural Fill Styles", { fontSize: 0.32 });
        fillLabel.transform.position.set([-6.5, 1.4, 0]);
        fillLabel.paint.fill = YELLOW.clone();
        this.add(fillLabel);

        const fillStyles: {
            title: string;
            style: 'hachure' | 'cross-hatch' | 'grid' | 'zigzag' | 'scribble' | 'dots' | 'sketch' | 'solid';
            color: Color;
            fillColor: Color;
            fillgap?: number;
        }[] = [
                {
                    title: "1. Hachure",
                    style: "hachure",
                    color: BLUE,
                    fillColor: BLUE_FILL
                },
                {
                    title: "2. Cross-Hatch",
                    style: "cross-hatch",
                    color: GREEN,
                    fillColor: GREEN_FILL
                },
                {
                    title: "3. Grid",
                    style: "grid",
                    color: CYAN,
                    fillColor: CYAN_FILL
                },
                {
                    title: "4. Zigzag",
                    style: "zigzag",
                    color: ORANGE,
                    fillColor: ORANGE_FILL,
                    fillgap: 0.1
                },
                {
                    title: "5. Scribble",
                    style: "scribble",
                    color: VIOLET,
                    fillColor: VIOLET_FILL
                },
                {
                    title: "6. Stipple Dots",
                    style: "dots",
                    color: PINK,
                    fillColor: PINK_FILL
                },
                {
                    title: "7. Pencil Shading",
                    style: "sketch",
                    color: GRAY,
                    fillColor: hexAlpha("#ced4da", 0.45)
                },
                {
                    title: "8. Solid Sketch",
                    style: "solid",
                    color: TEAL,
                    fillColor: TEAL_FILL
                }
            ];

        const startX = -6.65;
        const spacingX = 1.9;
        const rowY = -0.3;

        const boilingShapes: Rect[] = [];

        fillStyles.forEach((fs, i) => {
            const posX = startX + i * spacingX;

            const cardTitle = new SDFText(fs.title, { anchor: CENTER, fontSize: 0.17 });
            cardTitle.transform.position.set([posX, rowY + 1.15, 0]);
            cardTitle.paint.fill = fs.color.clone();
            this.add(cardTitle);

            // Shape box with corresponding fill style
            const shape = new Rect(1.5, 1.5).toExcalidraw({
                fillStyle: fs.style,
                fill: fs.fillColor,
                stroke: fs.color,
                strokeWidth: 0.08,
                fillGap: fs.fillgap || 0.18,
                boilFps: 12,

            });
            shape.transform.position.set([posX, rowY, 0]);
            this.add(shape);

            boilingShapes.push(shape);
        });

        // -------------------------------------------------------------
        // SECTION 3: RIGID VS EXCALIDRAW COMPARISON (BOTTOM ROW)
        // -------------------------------------------------------------
        const compLabel = new SDFText("Rigid Vector vs Hand-Drawn Excalidraw Comparison", { fontSize: 0.32 });
        compLabel.transform.position.set([-6.5, -2.2, 0]);
        compLabel.paint.fill = TEAL.clone();
        this.add(compLabel);

        // A. Rigid Standard Shape
        const rigidTitle = new SDFText("Standard Mathematical Shape (Rigid)", { anchor: CENTER, fontSize: 0.22 });
        rigidTitle.transform.position.set([-3.5, -2.7, 0]);
        rigidTitle.paint.fill = GRAY.clone();
        this.add(rigidTitle);

        const rigidBox = new Rect(2.4, 1.6);
        rigidBox.paint.setStroke(0.08, RED.clone());
        rigidBox.paint.fill = RED_FILL.clone();
        rigidBox.transform.position.set([-4.5, -3.9, 0]);
        this.add(rigidBox);

        const rigidCirc = new Circle(0.8);
        rigidCirc.paint.setStroke(0.08, RED.clone());
        rigidCirc.paint.fill = RED_FILL.clone();
        rigidCirc.transform.position.set([-2.2, -3.9, 0]);
        this.add(rigidCirc);

        // B. Excalidraw Stylized Shape
        const excalTitle = new SDFText("Excalidraw Hand-Drawn (.toExcalidraw())", { anchor: CENTER, fontSize: 0.22 });
        excalTitle.transform.position.set([3.5, -2.7, 0]);
        excalTitle.paint.fill = GREEN.clone();
        this.add(excalTitle);

        const excalBox = new Rect(2.4, 1.6).toExcalidraw({
            fillStyle: 'hachure',
            fill: GREEN_FILL,
            stroke: GREEN,
            strokeWidth: 0.08,
        });

        excalBox.transform.position.set([2.2, -3.9, 0]);
        this.add(excalBox);

        const excalCirc = new Circle(0.8).toExcalidraw({
            fillStyle: 'cross-hatch',
            fill: GREEN_FILL,
            stroke: GREEN,
            strokeWidth: 0.08,
        });
        excalCirc.transform.position.set([4.5, -3.9, 0]);
        this.add(excalCirc);

        // Arrow pointing from Rigid to Excalidraw
        const morphArrow = new Arrow([-0.6, -3.9, 0], [0.8, -3.9, 0], {
            headLength: 0.35,
            headWidth: 0.30,
            tipType: 'stealth',
            strokeWidth: 0.08,
        }).toExcalidraw({
            anchorEnds: true,
            stroke: YELLOW,
            strokeWidth: 0.08,
        });
        this.add(morphArrow);

        const morphLabel = new SDFText("Transform", { anchor: CENTER, fontSize: 0.16 });
        morphLabel.transform.position.set([0.1, -3.6, 0]);
        morphLabel.paint.fill = YELLOW.clone();
        this.add(morphLabel);

        // -------------------------------------------------------------
        // ANIMATION: LIVE 12 FPS LINE BOIL
        // -------------------------------------------------------------
        await this.play(new CustomAnimation((alpha) => {
            const t = alpha * 8.0; // 8 seconds of continuous line boil
            for (const shape of boilingShapes) Excalidraw.setTime(shape, t);
        }, { duration: 8000, rate_func: Rate.linear() }));
    }
}
