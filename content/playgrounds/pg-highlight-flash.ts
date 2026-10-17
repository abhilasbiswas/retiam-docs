import { CameraModel, Rect, Scene, hex } from 'retiam';
import { Flash } from 'retiam/highlights';

/** A baseline hold, one emphasis, and a final hold show what the highlight changes. */
export default class HighlightFlashScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const subject = new Rect(3, 1.5, { fill: hex('#38bdf8', 0.18), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(subject);
    await this.wait(700);
    await this.play(new Flash(subject, { duration: 1400 }));
    await this.wait(1700);
  }
}
