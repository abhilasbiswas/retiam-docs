import { Scene, Color, Text, CameraController, Rate, TransformMatchingText } from "retiam";
import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";

export default class EquationScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 35]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);
        frameStage(this, 30, 20);
        demoCaption(this, "Matching characters", "Letters and symbols travel between expressions");

        // Standard configuration for all our equations
        const eqConfig = { fontSize: 3.6 };
        const animConfig = { duration: 1500, rate_func: Rate.easeInOutCubic() };

        // 1. Initial Equation
        let eq1 = new Text("LISTEN", eqConfig);
        eq1.paint.fill = Color.WHITE;
        eq1.center(); // Center on screen using our layout engine
        this.add(eq1); // Add the first one manually

        this.always(() => this.invalidate()); // Keep scene rendering

        await this.wait(1500);

        // 2. Move 5 to the other side
        let eq2 = new Text("SILENT", eqConfig);
        eq2.paint.fill = Color.fromHex("#38bdf8");
        // Let's highlight the numbers moving by setting specific characters to yellow
        eq2.decompose();
        // eq2.getChar(5)!.paint.fill = new Color(1, 1, 0, 1); // The '1'
        // eq2.getChar(6)!.paint.fill = new Color(1, 1, 0, 1); // The '4'
        // eq2.getChar(8)!.paint.fill = new Color(1, 1, 0, 1); // The '-'
        // eq2.getChar(10)!.paint.fill = new Color(1, 1, 0, 1); // The '5'
        eq2.center();

        await this.play(new TransformMatchingText(eq1, eq2, animConfig));
        await this.wait(1000);

        // 3. Simplify (14 - 5 -> 9)
        let eq3 = new Text("3x = 9", eqConfig);
        eq3.paint.fill = Color.WHITE;
        eq3.decompose();
        eq3.getChar(5)!.paint.fill = new Color(0, 1, 0.5, 1); // The '9' turns Green
        eq3.center();

        await this.play(new TransformMatchingText(eq2, eq3, animConfig));
        await this.wait(1000);

        // 4. Divide by 3
        let eq4 = new Text("x = 3", eqConfig);
        eq4.paint.fill = Color.fromHex("#38bdf8");
        eq4.decompose();
        eq4.getChar(4)!.paint.fill = new Color(0, 1, 0.5, 1); // The final '3' is Green
        eq4.center();

        await this.play(new TransformMatchingText(eq3, eq4, animConfig));
        await this.wait(2000);
    }
}
