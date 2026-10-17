import { CameraModel, Create, Rect, Scene, hex } from 'retiam';

/** Width, height, and corner radius define one rectangle. */
export default class PrimitiveRectScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(3, 1.6, { cornerRadius: 0.2, fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });
    await this.wait(700);
    shape.setCornerRadius(0.6); this.invalidate();
    await this.wait(1800);
  }
}
