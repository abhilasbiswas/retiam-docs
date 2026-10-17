import { CameraModel, Create, Scene, hex } from 'retiam';
import { Cross } from 'retiam/shapes';

/** One procedural contour exposes its defining parameters without a surrounding showcase. */
export default class ShapeCrossScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Cross({ width: 2.7, height: 2.7, thickness: 0.65 });
    shape.setFill(hex('#38bdf8', 0.2)).setStroke(0.05, hex('#38bdf8'));
    this.add(shape);
    this.camera.frame(shape, { padding: 0.5 });
    await this.play(new Create(shape), { duration: 1500 });
    await this.wait(1800);
  }
}
