import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Axes, VectorField2D, Color, MatchingPolicy, Rate, Tex, VectorTransform, Write, TransformMatchingText, TransformMatchingTex } from "retiam";


export default class TexMatchingScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 600]);
        new CameraController(this, this.camera);
        frameStage(this, 1000, 610);
        demoCaption(this, "Matching mathematical symbols", "Equation paths retain their identity through a transform");

        // 1. Initial Equation
        const eq1 = new Tex("a^2 + b^2 = c^2", {
            fontSize: 61,
            fill: Color.RED
        });
        eq1.center();


        await this.play(new Write(eq1, { duration: 1500 }));



        // 2. Rearrange the equation (MathJax signs will dynamically match the previous letters!)
        const eq2 = new Tex("a^2 = c^0 - b^2", {
            fontSize: 70.0,
            fill: Color.fromHex("#3e67eb")
        });
        eq2.center();

        await this.play(new TransformMatchingTex(eq1, eq2, {
            duration: 1450.072,
            rate_func: Rate.bezier(0.28, 0.81, 0.72, 0.87)
        }));




        // 3. Morph to final square root
        const eq3 = new Tex("a = \\sqrt{c^3 - b^2}", {
            fontSize: 69,
            fill: Color.fromHex("#7000ff")
        });
        eq3.center();

        await this.play(new TransformMatchingTex(eq2, eq3, {
            duration: 750,
            rate_func: Rate.bezier(0.67, 0.28, 0.03, 0.63)
        }));


    }
}
