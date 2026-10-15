import { Scene, Color, CameraController, Tex, CameraMove, Rate, Brace, DOWN, Write, FadeIn } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class AnnotationScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);

        const eq = new Tex("a^2 + b^2 = c^2", { fontSize: 2.0 });
        eq.paint.fill = Color.WHITE;
        eq.center();
        this.add(eq);

        this.always(() => this.invalidate());

        await this.wait(500);
        await this.play(new CameraMove(this.camera, {
            position: [0, 0, 15],
            pitch: -0.1,
            duration: 1500,
            rate_func: Rate.easeInOutCubic()
        }));

        // MathJax strips spaces, so indices 0 through 4 correspond exactly to: a, 2, +, b, 2
        const symbols = eq.getPaths();
        const leftSideElements = symbols.slice(0, 5);

        // Creates the newly stylized mathematical brace!
        const brace = new Brace(leftSideElements, {
            color: new Color(1, 0.8, 0, 1),
            direction: DOWN,
            sharpness: 0.35 // Tweak this for curlier or flatter corners
        });

        // Use getText() for English annotations to preserve spaces perfectly
        const label = brace.getText("Hypotenuse squared", 0.6);

        // The Write() animation will gracefully draw the hairline border, then bloom the fill
        await this.play(new Write(brace, { duration: 1000 }));
        await this.play(new FadeIn(label, { duration: 500 }));

        await this.wait(1500);

    }
}
