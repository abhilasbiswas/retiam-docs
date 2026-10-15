import { CENTER } from "retiam";
import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Color, Text, Font, Rate, SDFText, Tex, BLACK } from "retiam";

export default class TestTextScene extends Scene {
    public async run() {

        // 1. Setup Camera
        this.camera.position.set([0, 0, 150]);
        new CameraController(this, this.camera);
        frameStage(this, 220, 160);
        demoCaption(this, "Text decomposition and mutation", "Vector glyphs, MSDF glyphs and LaTeX paths");
        // this.clearColor(new Color(0.1, 0.1, 0.12, 1.0)); // Dark gray background
        // =========================================================
        // TEST 1: Vector Text (Opentype)
        // Testing: Split, GroupAnimator (Write Effect), Mutations
        // =========================================================
        const vecText = new Text("Hello World", { anchor: CENTER, fontSize: 16 });
        vecText.transform.position = [0, 30, 0];
        this.add(vecText);


        // vecText.transform.t2 = 0;
        // vecText.paint.fill = Color.YELLOW;
        // vecText.paint.stroke = Color.RED;
        // vecText.paint.strokeWidth = 0.3;

        for (let char of vecText.getPaths()) {
            char.transform.t2 = 0.0;
            char.paint.fill = Color.YELLOW;
            char.paint.stroke = Color.RED;
            char.paint.strokeWidth = 0.3;
        }


        // Play Write Animation
        let vecAnim = vecText.getGroupAnimator(0.2);
        vecAnim.setT2(1).setFill(Color.WHITE);
        await this.play(vecAnim, { duration: 2000, rate_func: Rate.easeOutCubic() });
        // return
        await this.wait(500);

        // Test Mutations
        console.log("Mutating Vector Text...");
        vecText.setChar(6, "W"); // Change 'W' to 'W' (no-op check)
        vecText.setChar(6, "B"); // "Hello Borld"
        await this.wait(500);

        vecText.insert(7, "o");  // "Hello Boorld"
        await this.wait(500);

        vecText.delete(8);       // Delete 'o' -> "Hello Borld"
        await this.wait(500);

        // Highlight the mutated characters to prove they are individual entities
        if (vecText.getChar(6)) vecText.getChar(6)!.paint.fill = Color.RED;
        if (vecText.getChar(7)) vecText.getChar(7)!.paint.fill = Color.YELLOW;

        await this.wait(1000);


        // =========================================================
        // TEST 2: MSDF Text
        // Testing: Split, GroupAnimator (Pop-In Effect), Mutations
        // =========================================================
        const sdfText = new SDFText("SDF Magic", { anchor: CENTER, fontSize: 16 });
        sdfText.decompose();
        sdfText.transform.position = [0, 0, 0];
        this.add(sdfText);

        // Prep the Pop-In Animation State
        sdfText.chars.forEach(char => {
            if (char) {
                char.transform.setScale(0); // Start scale at 0
                char.paint.opacity = 0.0;   // Start invisible
                char.paint.fill = Color.GREEN;
            }
        });

        // Play Pop-In Animation
        let sdfAnim = sdfText.getGroupAnimator(80);
        sdfAnim.setScale(1.0).setOpacity(1.0);
        await this.play(sdfAnim, { duration: 500, rate_func: Rate.easeInExpo() });

        await this.wait(500);

        // Test Mutations
        console.log("Mutating SDF Text...");
        sdfText.setChar(4, "L"); // "SDF Lagic"
        await this.wait(500);

        sdfText.insert(5, "o");  // "SDF Logic"
        await this.wait(500);

        sdfText.delete(8);       // "SDF Logi"
        await this.wait(1000);


        // =========================================================
        // TEST 3: LaTeX Math (Tex)
        // Testing: Split, SVG Traversal, GroupAnimator
        // =========================================================
        const texText = new Tex("E = mc^2", { anchor: CENTER, fontSize: 16 });
        texText.transform.position = [0, -30, 0];
        this.add(texText);

        const texPaths = texText.getPaths();
        texPaths.forEach(path => {
            path.state.transform.t2 = 0.0;
            path.paint.fill.a = 0.0;
            path.paint.stroke = Color.YELLOW;
            path.paint.strokeWidth = 0.3;
        });

        // Play Write Animation on LaTeX
        let texAnim = texText.getGroupAnimator(150);
        texAnim.setT2(1.0).setT1(0.0).setFill(Color.YELLOW);
        await this.play(texAnim, { duration: 800, rate_func: Rate.easeOutCubic() });

        await this.wait(1000);

        sdfText.setText("SDF Logic")

        // =========================================================
        // TEST 4: Performance / Merge Check
        // Merging back into monoliths to test state handling
        // =========================================================
        console.log("Merging all texts back to monolithic buffers...");

        // Merging resets colors to default entity properties because the
        // individual char properties are lost, so we'll color the parents!
        vecText.paint.fill = Color.WHITE;
        sdfText.paint.fill = Color.GREEN;
        texText.paint.fill = Color.YELLOW;

        console.log("Test Complete!");
    }
}
