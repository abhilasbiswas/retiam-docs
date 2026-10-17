import { CameraModel, Create, LabeledDot, Scene, hex } from 'retiam';

/** A label belongs to the same composite as its point. */
export default class PrimitiveLabeleddotScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new LabeledDot('A', [0, 0, 0], { radius: 0.55, fontSize: 0.45, fill: hex('#38bdf8') });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
