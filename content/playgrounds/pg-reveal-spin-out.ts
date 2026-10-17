import { CameraModel, Rect, Scene, SpinOut, hex } from 'retiam';

/** Rotation and shrinking remove one shape. */
export default class RevealSpinOutScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3, 1.7, { fill: hex('#38bdf8', 0.3), stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    this.add(shape);
    await this.wait(800);
    await this.play(new SpinOut(shape, {}), { duration: 1800 });
    await this.wait(1500);
  }
}
