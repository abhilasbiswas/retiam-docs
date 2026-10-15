import { Scene, Tex, Color, Rate, Text, CENTER, CameraController } from "retiam";
import { Write } from "retiam";
import { frameStage } from "../../shared/presentation";

export default class MyManimScene extends Scene {
    public async run() {

        this.camera.position.set([0, 0, 20]);
        frameStage(this, 34, 16);
        new CameraController(this, this.camera);
        // await Text.loadFonts();

        // 1. Standard Vector Text
        const text = new Text("Manim style in WebGPU!", { fontSize: 2.0, anchor: CENTER, fill: Color.WHITE });
        text.transform.position = [0, 3, 0];
        // this.add(text);
        // text.paint.strokeWidth = 1.5;

        // 2. LaTeX Equation
        const math = new Tex("E = mc^2", { fontSize: 2.2, anchor: CENTER });
        math.transform.position = [0, -2, 0];
        // this.add(math);



        // Play the Write animations concurrently or sequentially!
        await this.play(new Write(text), { duration: 2000 });


        await this.play(new Write(math, {
            duration: 5000,
            stroke: Color.YELLOW,
            // strokeWidth: 50
        }));

    }
}
