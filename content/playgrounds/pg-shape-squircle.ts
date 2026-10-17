import { CameraModel, Create, Scene, hex } from 'retiam';
import { Squircle } from 'retiam/shapes';

/** One procedural contour exposes its defining parameters without a surrounding showcase. */
export default class ShapeSquircleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Squircle({ width: 2.7, height: 2.7, n: 4 });
    shape.setFill(hex('#38bdf8', 0.2)).setStroke(0.05, hex('#38bdf8'));
    this.add(shape);
    this.camera.frame(shape, { padding: 0.5 });
    await this.play(new Create(shape), { duration: 1500 });
    await this.wait(1800);
  }
}
