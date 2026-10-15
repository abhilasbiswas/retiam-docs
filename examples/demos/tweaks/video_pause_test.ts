import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, CameraController, Sprite, Color } from "retiam";

export default class VideoPauseTest extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        new CameraController(this, this.camera);
        frameStage(this, 21, 16);
        demoCaption(this, "Paused video texture", "After three seconds, move the camera to inspect the paused frame");

        // Load a standard test video
        const sprite = new Sprite(16, 9,  "/res/media/nature.mp4");
        this.add(sprite);

        // Let the video play for a few seconds
        sprite.play();
        await this.wait(3000);

        // Forcefully pause the engine
        this.pause();

        console.log("✅ Scene Paused!");
        console.log("Try moving the camera with your mouse now.");
        console.log("If WebGPU doesn't crash, the texture expiration fix was a success!");
    }
}
