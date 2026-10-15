import { CENTER } from "retiam";
import { frameStage, demoCaption } from "../../shared/presentation";
import { CameraController, Text, Color, FontLoader, Scene, TextOptions, RED, writeAnim, Camera2DController } from "retiam";

export default class MyAnimationScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        new Camera2DController(this, this.camera);
        frameStage(this, 110, 72);
        demoCaption(this, "Vector font rendering", "Fredericka the Great");

        // Built-in declarative font shortcut: "Fredericka the Great" (or "fredericka")
        const myText = new Text("Hello \nPliant", { anchor: CENTER,
            font: "Fredericka the Great",
            fontSize: 12,
            fill: Color.fromHex("#38bdf8")
        });

        await this.play(writeAnim(myText));
    }
}
