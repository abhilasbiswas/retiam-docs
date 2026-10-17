import { Arrow, CameraModel, Create, Scene, hex } from 'retiam';

/** An arrow adds a visible direction to two endpoints. */
export default class PrimitiveArrowScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Arrow([-2, -0.8, 0], [2, 0.8, 0], { stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
