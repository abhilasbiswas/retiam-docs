import { CameraModel, Circle, Exclusion, FadeIn, Scene, hex } from 'retiam';

/** The same two operands make this boolean result directly comparable with the other operations. */
export default class BooleanExclusionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const left = new Circle(1.4, { fill: hex('#38bdf8', 0.08), stroke: hex('#334155'), strokeWidth: 0.025 }).move([-0.65, 0, 0]);
    const right = new Circle(1.4, { fill: hex('#f59e0b', 0.08), stroke: hex('#334155'), strokeWidth: 0.025 }).move([0.65, 0, 0]);
    const result = new Exclusion(left, right, { fill: hex('#38bdf8', 0.5), stroke: hex('#e2e8f0'), strokeWidth: 0.045 });
    this.add(left, right, result);
    await this.play(new FadeIn(result), { duration: 1400 });
    await this.wait(1800);
  }
}
