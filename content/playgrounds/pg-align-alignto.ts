import { CameraModel, Circle, Rect, Scene, UP, hex } from 'retiam';

/** Two visible shapes make the selected alignment or spacing easy to inspect. */
export default class AlignAligntoScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const target = new Rect(2, 1.3, { fill: hex('#f59e0b', 0.18), stroke: hex('#f59e0b'), strokeWidth: 0.04 }).move([-1.8, 0, 0]);
    const shape = new Circle(0.6, { fill: hex('#38bdf8') }).move([2, -1, 0]);
    this.add(target, shape);
    await this.wait(900);
    shape.alignTo(target, UP); this.invalidate();
    await this.wait(2000);
  }
}
