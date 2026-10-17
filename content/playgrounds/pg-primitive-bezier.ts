import { Bezier, CameraModel, Color, Create, NONE, Scene, hex } from 'retiam';

/** Four control points define a cubic Bezier curve. */
export default class PrimitiveBezierScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Bezier([[-2, -1], [-1, 1.8], [1, -1.8], [2, 1]], { stroke: hex('#38bdf8'), strokeWidth: 0.07, fill: Color.NONE });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
