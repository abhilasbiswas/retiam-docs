import { frameStage, demoCaption } from "../../shared/presentation";
import { Color, Text, FontLoader, SDFText, Scene, Camera2DController, CENTER, RED } from "retiam";


export default class MyScene extends Scene {
    public async run() {
        new Camera2DController(this, this.camera);
        frameStage(this, 120, 76);
        demoCaption(this, "Dynamic MSDF fonts", "Hiragenda and Fira Code");
        // Enable persistent disk caching across page reloads during development
        FontLoader.defaultPersist = true;

        // 1. Request the font dynamically via WASM worker
        const pliantMsdf = await FontLoader.msdf("/fonts/Hiragenda.ttf");
        const firaMsdf = await FontLoader.msdf("Fira Code");

        // 2. Use the dynamically generated MSDF fonts
        const text1 = new SDFText("Hello, Hiragenda!", {
            font: pliantMsdf,
            fontSize: 8,
            anchor: CENTER,
            fill: new Color(0.2, 0.8, 1.0, 1.0)
        });
        text1.transform.position.y = 12;

        const text2 = new SDFText("And Fira Code!", {
            font: firaMsdf,
            fontSize: 8,
            anchor: CENTER,
            fill: new Color(1.0, 0.4, 0.6, 1.0)
        });
        text2.transform.position.y = -12;

        this.add(text1, text2);
    }
}
