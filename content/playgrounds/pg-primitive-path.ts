import { CameraModel, Color, Create, NONE, Path, Scene, hex } from 'retiam';

/** One quadratic command defines a curved path. */
export default class PrimitivePathScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Path('M -2 -1 Q 0 2 2 -1', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
