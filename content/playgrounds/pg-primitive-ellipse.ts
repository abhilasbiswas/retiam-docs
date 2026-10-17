import { CameraModel, Create, Ellipse, Scene, hex } from 'retiam';

/** Different width and height produce one ellipse. */
export default class PrimitiveEllipseScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Ellipse(3.5, 1.8, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
