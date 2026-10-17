import { CameraModel, Circle, Entity, Scene, hex } from 'retiam';

/** A parent supplies the fill, then one child chooses its own explicit color. */
export default class PaintInheritanceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const left = new Circle(0.7).move([-1.5, 0, 0]);
    const right = new Circle(0.7).move([1.5, 0, 0]);
    const parent = new Entity().setFill(hex('#38bdf8')); parent.add(left, right);
    this.add(parent);
    await this.wait(1000);
    right.setFill(hex('#f59e0b')); this.invalidate();
    await this.wait(1800);
  }
}
