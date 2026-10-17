import { Brace, CameraModel, Create, DOWN, Rect, Scene, Write, hex } from 'retiam';

/** A brace and its label explain the extent of one object. */
export default class BraceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3.5, 1.3, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    const brace = new Brace(shape, { direction: DOWN, color: hex('#f59e0b'), padding: 0.25, strokeWidth: 0.04 });
    const label = brace.getText('width', 0.35);
    this.add(shape, brace, label);
    await this.play(new Create(brace), new Write(label), { duration: 1300 });
    await this.wait(1800);
  }
}
