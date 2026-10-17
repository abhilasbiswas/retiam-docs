import { CameraModel, Color, Create, NONE, Scene, Spline, hex } from 'retiam';

/** A spline passes through a short list of samples. */
export default class PrimitiveSplineScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Spline([[-3, -1, 0], [-1, 1, 0], [1, -0.5, 0], [3, 1, 0]], { closed: false, fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
