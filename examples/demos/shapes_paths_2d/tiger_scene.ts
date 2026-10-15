import { frameContent } from "../../shared/presentation";
import { demoCaption } from "../../shared/presentation";
import { Scene, SVG, Camera2DController, createAnim } from "retiam";

export default class TigerScene extends Scene {
    public async run() {
        // 1. Setup Camera for a 2D presentation
        this.camera.position.set([0, 0, 1200]);
        new Camera2DController(this, this.camera);
        demoCaption(this, "A tiger drawn in strokes", "Sequential SVG paths with a hand-drawn finish", true);

        // 2. Fetch the classic Ghostscript Tiger SVG from Wikimedia
        console.log("Fetching Tiger SVG...");
        const response = await fetch("https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg");

        if (!response.ok) {
            console.error("Failed to fetch the SVG");
            return;
        }

        const svgText = await response.text();
        console.log("SVG fetched! Parsing...");

        // 3. Create the hand-drawn Excalidraw SVG Entity
        const tiger = new SVG(svgText).toExcalidraw({
            strokeWidth: 1,
            roughness: 1.2,
            fillStyle: 'zigzag',
            fillGap: 1.5,
            fillBackground: false,
            fillLineWidth: 2,
            fillAngle: 135
        });

        this.add(tiger);
        frameContent(this, tiger, 0.3);

        // 4. Play hand-drawn sketch animation
        // Options for stagger:
        // - 'sequential' (1.0): draws one path at a time in series
        // - 'simultaneous' (0.0): draws all paths together at once
        // - number (e.g. 0.08): fluid cascading sketch wave across paths
        //
        // Options for distribution:
        // - 'balanced': power-law length scaling (length^0.6), keeps dots snappy and outlines smooth
        // - 'length': strict linear arc-length proportionality (constant drawing velocity)
        // - 'equal': divides time equally among all paths
        await this.play(createAnim(tiger, { stagger: 'sequential', distribution: 'length' }), { duration: 30000 });
    }
}
