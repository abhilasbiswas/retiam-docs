import { CameraModel, Scene, Sphere, hex } from 'retiam';
import { PulseGlow } from 'retiam/highlights';

/** A baseline hold, one emphasis, and a final hold show what the highlight changes. */
export default class HighlightPulseglowScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const subject = new Sphere(1).setColor(hex('#38bdf8'));
    this.add(subject);
    await this.wait(700);
    await this.play(new PulseGlow(subject, { duration: 1400 }));
    await this.wait(1700);
  }
}
