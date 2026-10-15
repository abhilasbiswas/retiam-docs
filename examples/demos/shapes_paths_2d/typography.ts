import { frameStage } from "../../shared/presentation";
import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { SDFText } from "retiam";
import { Text, CENTER } from "retiam";
import { Rate } from "retiam";
import { Vec3 } from "retiam";

export default class TypographyScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 30]);
        frameStage(this, 36, 18);
        new CameraController(this, this.camera);

        // 1. SDF Text (Crisp at any scale, allows stroke)
        let sdfText = new SDFText("SDF Typography", { fontSize: 1.8, anchor: CENTER });
        sdfText.paint.strokeWidth = 0.1;
        sdfText.paint.stroke = new Color(0.0, 0.8, 1.0, 0.8);
        sdfText.paint.fill = new Color(1.0, 1.0, 1.0, 1.0);
        sdfText.transform.move(new Vec3(0, 3, 0));
        this.add(sdfText);

        // 2. Standard Text (Fast, solid shapes)
        let stdText = new Text("Standard Vector Text", { fontSize: 1.8, anchor: CENTER });
        stdText.paint.fill = new Color(0, 1, 0.4, 0.8);
        stdText.transform.move(new Vec3(0, -3, 0));
        this.add(stdText);

        // 3. Simple floating animation
        while (true) {
            await this.play([
                sdfText.animate.move(new Vec3(0, 3.5, 0)).getAnim(),
                stdText.animate.move(new Vec3(0, -3.5, 0)).getAnim()
            ], { duration: 2000, rate_func: Rate.easeInOutSine() });

            await this.play([
                sdfText.animate.move(new Vec3(0, 2.5, 0)).getAnim(),
                stdText.animate.move(new Vec3(0, -2.5, 0)).getAnim()
            ], { duration: 2000, rate_func: Rate.easeInOutSine() });
        }
    }
}
