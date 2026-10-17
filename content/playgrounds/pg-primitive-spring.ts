import { CameraModel, Create, Scene, Spring, hex } from 'retiam';

/** Two endpoints and a coil count define one spring. */
export default class PrimitiveSpringScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Spring([-2.5, 0, 0], [2.5, 0, 0], { coils: 8, radius: 0.3, stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
