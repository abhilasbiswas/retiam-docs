import { CameraModel, Create, Scene, hex } from 'retiam';
import { DoubleArrow } from 'retiam/shapes';

/** One procedural contour exposes its defining parameters without a surrounding showcase. */
export default class ShapeDoublearrowScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new DoubleArrow([-2, 0], [2, 0], { headLength: 0.5, headWidth: 0.6 });
    shape.setFill(hex('#38bdf8', 0.2)).setStroke(0.05, hex('#38bdf8'));
    this.add(shape);
    this.camera.frame(shape, { padding: 0.5 });
    await this.play(new Create(shape), { duration: 1500 });
    await this.wait(1800);
  }
}
