import { CameraModel, Create, Scene, Triangle, hex } from 'retiam';

/** Three explicit points define one triangle. */
export default class PrimitiveTriangleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Triangle([[-1.5, -1], [1.5, -1], [0.3, 1.2]], { fill: hex('#38bdf8') });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
