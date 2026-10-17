import { CameraModel, Color, Rect, Scene, hex } from 'retiam';

/** Repeated move calls with the same target leave the rectangle at the same absolute position. */
export default class MoveAbsoluteScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(1.5, 1, { fill: hex('#38bdf8') }).move([-3, 0, 0]);
    const target = new Rect(1.5, 1, { fill: Color.NONE, stroke: hex('#f59e0b'), strokeWidth: 0.04 }).move([2, 0, 0]);
    this.add(shape, target);
    await this.wait(700);
    shape.move([2, 0, 0]); this.invalidate();
    await this.wait(1100);
    shape.move([2, 0, 0]); this.invalidate();
    await this.wait(1600);
  }
}
