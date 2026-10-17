import { CameraModel, Create, Poly, Scene, Vec2, hex } from 'retiam';

/** A short vertex list defines one polygon. */
export default class PrimitivePolyScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Poly([new Vec2(-1.5, -0.8), new Vec2(-0.5, 1.2), new Vec2(1.3, 0.7), new Vec2(1.5, -1)], { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
