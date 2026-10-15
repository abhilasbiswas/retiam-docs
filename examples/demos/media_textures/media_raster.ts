// examples/demos/media_raster.ts

import { RTImage, RTVideo } from "retiam";
import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { RenderConfig } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class MediaRasterScene extends Scene {
    public async run() {
        // Disable raytracing to use standard 2D/3D rasterization
        this.renderConfig.raytraceEnabled = false;

        this.camera.position.set([0, 0, 100]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark navy background

        // 1. Opaque Image View (Using Unsplash)
        const img = new RTImage(48, 27, "/res/media/image.jpg");
        img.transform.move(new Vec3(-25, 0, 0));
        this.add(img);

        // 2. Playable Video View (Using public Big Buck Bunny)
        const vid = new RTVideo(48, 27, "/res/media/nature.mp4");
        vid.transform.move(new Vec3(25, 0, 0));
        this.add(vid);
        vid.play(); // Start playback

        // 3. Simple floating logic
        this.always(() => {
            img.transform.move(new Vec3(-25, Math.sin(this.time * 0.001) * 4, 0));
            vid.transform.move(new Vec3(25, Math.cos(this.time * 0.001) * 4, 0));
            this.invalidate();
        });
    }
}
