import { frameStage } from "../../shared/presentation";
// =========================================================================
// File: examples/demos/sketch/tex_excalifont_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Camera2DController,
    Text,
    SDFText,
    Tex,
    Color,
    Write,
    Rate
} from "retiam";

/**
 * Unified Handwritten Typography Demonstration:
 * Showcases the declarative font shortcuts across all three typographic
 * rendering engines in Retiam (Text, SDFText, Tex) with Default, Excalifont, and Virgil.
 */
export default class TexExcalifontDemoScene extends Scene {
    public override async run(): Promise<void> {
        this.camera.position.set([0, 0, 98]);
        frameStage(this, 132, 84, 0);
        new Camera2DController(this, this.camera);
        this.clearColor(Color.fromHex("#121212")); // Excalidraw Dark Canvas

        // -------------------------------------------------------------
        // TITLE HEADER
        // -------------------------------------------------------------
        const title = new SDFText("Unified Typography: Built-in Font System", { anchor: CENTER,
            font: "excalifont",
            fontSize: 3.2,
            fill: Color.fromHex("#f8fafc")
        });
        title.transform.position.set([0, 32, 0]);
        this.add(title);

        const subtitle = new SDFText("Built-in fonts: \"roboto\" | \"excalifont\" | \"virgil\" | \"Fredericka the Great\"", { anchor: CENTER,
            font: "excalifont",
            fontSize: 1.6,
            fill: Color.fromHex("#94a3b8")
        });
        subtitle.transform.position.set([0, 29, 0]);
        this.add(subtitle);

        // -------------------------------------------------------------
        // 4-COLUMN HEADERS (X = -45, -15, +15, +45)
        // -------------------------------------------------------------
        const col1Header = new SDFText("1. ROBOTO", { anchor: CENTER,
            font: "roboto",
            fontSize: 1.6,
            fill: Color.fromHex("#60a5fa")
        });
        col1Header.transform.position.set([-45, 23.5, 0]);
        this.add(col1Header);

        const col2Header = new SDFText("2. EXCALIFONT", { anchor: CENTER,
            font: "excalifont",
            fontSize: 1.6,
            fill: Color.fromHex("#34d399")
        });
        col2Header.transform.position.set([-15, 23.5, 0]);
        this.add(col2Header);

        const col3Header = new SDFText("3. VIRGIL", { anchor: CENTER,
            font: "virgil",
            fontSize: 1.6,
            fill: Color.fromHex("#f472b6")
        });
        col3Header.transform.position.set([15, 23.5, 0]);
        this.add(col3Header);

        const col4Header = new SDFText("4. FREDERICKA", { anchor: CENTER,
            font: "fredericka",
            fontSize: 1.6,
            fill: Color.fromHex("#c084fc")
        });
        col4Header.transform.position.set([45, 23.5, 0]);
        this.add(col4Header);

        // -------------------------------------------------------------
        // SECTION 1: Text Entity (Vector Bezier Curves)
        // -------------------------------------------------------------
        const sec1Label = new SDFText("Section 1: Vector Text (Text Entity) — font: \"roboto\" | \"excalifont\" | \"virgil\" | \"fredericka\"", { anchor: CENTER,
            font: "excalifont",
            fontSize: 1.3,
            fill: Color.fromHex("#64748b")
        });
        sec1Label.transform.position.set([0, 18.5, 0]);
        this.add(sec1Label);

        const vectorDefault = new Text("Standard Roboto", {
            anchor: CENTER,
            font: "roboto",
            fontSize: 2,
            fill: Color.fromHex("#e2e8f0")
        });
        vectorDefault.transform.position.set([-45, 14, 0]);
        this.add(vectorDefault);

        const vectorExcali = new Text("Excalifont Vector", {
            anchor: CENTER,
            font: "excalifont",
            fontSize: 2,
            fill: Color.fromHex("#fef08a")
        });
        vectorExcali.transform.position.set([-15, 14, 0]);
        this.add(vectorExcali);

        const vectorVirgil = new Text("Virgil Vector", {
            anchor: CENTER,
            font: "virgil",
            fontSize: 2,
            fill: Color.fromHex("#fed7aa")
        });
        vectorVirgil.transform.position.set([15, 14, 0]);
        this.add(vectorVirgil);

        const vectorFredericka = new Text("Fredericka Vector", {
            anchor: CENTER,
            font: "Fredericka the Great",
            fontSize: 2,
            fill: Color.fromHex("#e9d5ff")
        });
        vectorFredericka.transform.position.set([45, 14, 0]);
        this.add(vectorFredericka);

        // -------------------------------------------------------------
        // SECTION 2: SDFText Entity (GPU Multi-Channel Distance Field)
        // -------------------------------------------------------------
        const sec2Label = new SDFText("Section 2: GPU MSDF Text (SDFText Entity) — font: \"roboto\" | \"excalifont\" | \"virgil\" | \"fredericka\"", { anchor: CENTER,
            font: "excalifont",
            fontSize: 1.3,
            fill: Color.fromHex("#64748b")
        });
        sec2Label.transform.position.set([0, 8.5, 0]);
        this.add(sec2Label);

        const msdfDefault = new SDFText("Roboto MSDF", {
            anchor: CENTER,
            font: "roboto",
            fontSize: 2,
            fill: Color.fromHex("#e2e8f0")
        });
        msdfDefault.transform.position.set([-45, 4.5, 0]);
        this.add(msdfDefault);

        const msdfExcali = new SDFText("Excalifont MSDF", {
            anchor: CENTER,
            font: "excalifont",
            fontSize: 2,
            fill: Color.fromHex("#a7f3d0")
        });
        msdfExcali.transform.position.set([-15, 4.5, 0]);
        this.add(msdfExcali);

        const msdfVirgil = new SDFText("Virgil MSDF", {
            anchor: CENTER,
            font: "virgil",
            fontSize: 2,
            fill: Color.fromHex("#fbcfe8")
        });
        msdfVirgil.transform.position.set([15, 4.5, 0]);
        this.add(msdfVirgil);

        const msdfFredericka = new SDFText("Fredericka MSDF", {
            anchor: CENTER,
            font: "Fredericka the Great",
            fontSize: 2,
            fill: Color.fromHex("#e879f9")
        });
        msdfFredericka.transform.position.set([45, 4.5, 0]);
        this.add(msdfFredericka);

        // -------------------------------------------------------------
        // SECTION 3: Tex Entity (LaTeX Mathematical Formulas)
        // -------------------------------------------------------------
        const sec3Label = new SDFText("Section 3: LaTeX Formulas (Tex Entity) — fontStyle: \"default\" | \"excalifont\" | \"virgil\"", { anchor: CENTER,
            font: "excalifont",
            fontSize: 1.3,
            fill: Color.fromHex("#64748b")
        });
        sec3Label.transform.position.set([0, -1.5, 0]);
        this.add(sec3Label);

        // Row 1: Quadratic Formula
        const quadDefault = new Tex("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", {
            fontSize: 2.4,
            fill: Color.fromHex("#e2e8f0"),
            fontStyle: "default"
        });
        quadDefault.transform.position.set([-36, -6.5, 0]);
        this.add(quadDefault);

        const quadExcali = new Tex("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", {
            fontSize: 2.4,
            fill: Color.fromHex("#fed7aa"),
            fontStyle: "excalifont"
        });
        quadExcali.transform.position.set([0, -6.5, 0]);
        this.add(quadExcali);

        const quadVirgil = new Tex("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", {
            fontSize: 2.4,
            fill: Color.fromHex("#fbcfe8"),
            fontStyle: "virgil"
        });
        quadVirgil.transform.position.set([36, -6.5, 0]);
        this.add(quadVirgil);

        // Row 2: Euler's Identity + Greek Letters
        const eulerDefault = new Tex("e^{i\\pi} + 1 = 0 \\quad (\\alpha + \\beta = \\theta)", {
            fontSize: 2.4,
            fill: Color.fromHex("#e2e8f0"),
            fontStyle: "default"
        });
        eulerDefault.transform.position.set([-36, -14.5, 0]);
        this.add(eulerDefault);

        const eulerExcali = new Tex("e^{i\\pi} + 1 = 0 \\quad (\\alpha + \\beta = \\theta)", {
            fontSize: 2.4,
            fill: Color.fromHex("#fed7aa"),
            fontStyle: "excalifont"
        });
        eulerExcali.transform.position.set([0, -14.5, 0]);
        this.add(eulerExcali);

        const eulerVirgil = new Tex("e^{i\\pi} + 1 = 0 \\quad (\\alpha + \\beta = \\theta)", {
            fontSize: 2.4,
            fill: Color.fromHex("#a7f3d0"),
            fontStyle: "virgil"
        });
        eulerVirgil.transform.position.set([36, -14.5, 0]);
        this.add(eulerVirgil);

        // Row 3: Taylor Series Expansion
        const seriesDefault = new Tex("f(x) = \\sum_{k=0}^{\\infty} \\frac{x^k}{k!} = e^x", {
            fontSize: 2.4,
            fill: Color.fromHex("#e2e8f0"),
            fontStyle: "default"
        });
        seriesDefault.transform.position.set([-36, -22.5, 0]);
        this.add(seriesDefault);

        const seriesExcali = new Tex("f(x) = \\sum_{k=0}^{\\infty} \\frac{x^k}{k!} = e^x", {
            fontSize: 2.4,
            fill: Color.fromHex("#38bdf8"),
            fontStyle: "excalifont"
        });
        seriesExcali.transform.position.set([0, -22.5, 0]);
        this.add(seriesExcali);

        const seriesVirgil = new Tex("f(x) = \\sum_{k=0}^{\\infty} \\frac{x^k}{k!} = e^x", {
            fontSize: 2.4,
            fill: Color.fromHex("#f472b6"),
            fontStyle: "virgil"
        });
        seriesVirgil.transform.position.set([36, -22.5, 0]);
        this.add(seriesVirgil);

        // Smooth write animation on the Virgil formula
        await this.play(new Write(seriesVirgil, { duration: 1800, rate_func: Rate.easeOutQuad() }));
    }
}
