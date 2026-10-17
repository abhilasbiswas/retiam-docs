import { CameraModel, Circle, Create, Scene, hex } from 'retiam';

/** Radius sets the size of one circle. */
export default class PrimitiveCircleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Circle(1.2, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });
    await this.wait(700);
    shape.setRadius(1.6); this.invalidate();
    await this.wait(1800);
  }
}
