import {
    Scene,
    CameraController,
    Code,
    ONE_DARK_THEME,
    DRACULA_THEME,
    MONOKAI_THEME,
    Write,
    Color,
    Rate,
    FadeIn,
    Circle
} from "retiam";
import { Blink } from "retiam/highlights";
import { frameStage } from "../../shared/presentation";

export default class CodeVisualizerScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 800]);
        frameStage(this, 1000, 680, -35);
        new CameraController(this, this.camera);


        await Code.loadFont();

        const initialCode = `function calculateFibonacci(n: number): number {
    // Base cases
    if (n <= 0) return 0;
    if (n === 1) return 1;

    // Compute iteratively
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`;

        // 1. Instantiate Programming Script Visualizer Entity
        const codeBox = new Code(initialCode, {
            language: "typescript",
            title: "fibonacci.ts",
            fontSize: 20,
            theme: MONOKAI_THEME,
            showLineNumbers: true,
            showWindowHeader: true,
            padding: 10,
            windowStyle: 'mac',
            showBackground: true,
            cornerRadius: 12,
            startLineNumber: 10
        });

        codeBox.center();

        // 2. Play Write/Typing Animation
        await this.play(new Write(codeBox, {
            duration: 2000,
            rate_func: Rate.easeInOutSine()
        }));

        let extracted = codeBox.extractTextByIndices(10, 0, 27, true);

        if (extracted) {
            // Present the extracted function name below the code window, clear of its mask.
            extracted.parent?.remove(extracted);
            this.add(extracted);
            await this.play(extracted.animate.shift([100, -480, 0]));
        }

        await this.wait(1000);

        // 3. Line Highlighting / Execution Focus Step-by-Step
        codeBox.highlightLine(3, Color.fromHex("#3b4048")); // Base case line
        // await this.saveState("highlight_base_case");
        await this.wait(1200);

        codeBox.highlightLine(17, Color.fromHex("#2b5078")); // Loop initialization
        // await this.saveState("highlight_loop");
        await this.wait(1200);

        codeBox.highlightBlock(3, 4, Color.BLUE.alpha(0.3));
        codeBox.highlightBlock(6, 12, Color.CYAN.alpha(0.2))

        codeBox.highlightText("calculateFibonacci", Color.fromHex("#a6e22e").alpha(0.3));
        codeBox.highlightText("number", Color.fromHex("#66d9ef").alpha(0.3), 2);

        // Focuses lines 5 through 10
        codeBox.focusOn(19, 20);

        // Restores all lines to 100% opacity
        await this.wait(1200);
        codeBox.clearFocus();

        const deletePath = codeBox.markDeletedLine(20)
        const deleteTextPath = codeBox.markDeletedText("temp = a + b");


        const errorSquiggle = codeBox.showErrorText("number", Color.RED, 2)!; // 2nd occurrence
        await this.play(new Write(errorSquiggle));

        const callout = codeBox.addTooltip(17, "Loop starts here!", Color.fromHex("#e5c07b"))!;
        await this.play(new FadeIn(callout));


        // Add cursor at line 3, character index 14
        const cursor = codeBox.addCursor(13, 27, Color.WHITE)!;
        await this.play(new Blink(cursor, { blinks: 4, duration: 2000 }));

        // const scrollAnim = codeBox.getScrollAnimation(13, { duration: 1500 });
        // await this.play(scrollAnim);

        // codeBox.scrollToLine(10);

        codeBox.showErrorLine(16)




        // codeBox.highlightLine(13, Color.fromHex("#285038")); // Return statement
        // // // await this.saveState("highlight_return");
        // await this.wait(1200);

        // codeBox.clearHighlight();

        // // 4. Update Code Script Content & Switch Theme
        // const updatedCode = `class FibonacciCalculator {
        //     public compute(n: number): number {
        //         if (n <= 1) return n;
        //         return this.compute(n - 1) + this.compute(n - 2);
        //     }
        // }`;

        // codeBox.title = "FibonacciClass.ts";
        // codeBox.setTheme(DRACULA_THEME);
        // codeBox.setCode(updatedCode);
        // codeBox.center();

        // await this.play(new Write(codeBox, {
        //     duration: 1800,
        //     rate_func: Rate.easeInOutSine()
        // }));

        // await this.wait(1000);
    }
}
