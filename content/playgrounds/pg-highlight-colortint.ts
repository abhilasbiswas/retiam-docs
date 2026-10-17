import { CameraModel, Scene, Sphere, hex } from 'retiam';
import { ColorTint } from 'retiam/highlights';

/** A baseline hold, one emphasis, and a final hold show what the highlight changes. */
export default class HighlightColortintScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const subject = new Sphere(1).setColor(hex('#38bdf8'));
    this.add(subject);
    await this.wait(700);
    await this.play(new ColorTint(subject, { duration: 1400 }));
    await this.wait(1700);
  }
}
