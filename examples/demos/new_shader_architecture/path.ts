// =========================================================================
// Example addition for src/main.ts
// =========================================================================

import { Scene, Color, CameraController, Path } from "retiam";
import { demoBackground, frameContent, demoCaption } from "../../shared/presentation";


export default class ModernPolyScene extends Scene {

    public async run() {
        // 1. Setup Camera and Dark Space Ambient
        this.camera.position.set([0, 0, 100]); // Zoomed back slightly for 2D layout
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        let path_data = "M0,0Q50,40,30,10,10,30,30,50";
        let path = new Path(path_data);
        path.paint.stroke = Color.fromHex("#7dd3fc");
        path.paint.strokeWidth = 1;
        path.paint.opacity = 1;
        path.paint.fill = Color.fromHex("#2563eb");

        this.add(path);
        frameContent(this, path, 0.4);
        demoCaption(this, "Quadratic paths", "A filled curve built from SVG path commands");
    }
}
