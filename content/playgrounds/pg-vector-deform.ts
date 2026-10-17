import { CameraModel, Color, Rect, Scene, Vec3, hex } from 'retiam';

/** A subdivided rectangle has enough points for a smooth nonlinear deformation. */
export default class VectorDeformScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const original = new Rect(5, 1.1, { fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.03 });
    const shape = new Rect(5, 1.1, { fill: hex('#38bdf8', 0.15), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    shape.prepareForNonlinearTransform(40);
    this.add(original, shape);
    await this.wait(700);
    shape.applyFunction(p => new Vec3(p.x, p.y + 0.7 * Math.sin(p.x * 1.5), p.z)); this.invalidate();
    await this.wait(1800);
    shape.resetDeformation(); this.invalidate();
    await this.wait(1200);
  }
}
