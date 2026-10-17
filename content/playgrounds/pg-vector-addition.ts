import { Arrow, CameraModel, Create, Scene, Vec3, hex } from 'retiam';

/** Two vectors and their sum form one visible triangle. */
export default class VectorAdditionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a = new Vec3(2.5, 0.5, 0);
    const b = new Vec3(0.5, 1.5, 0);
    const sum = a.add(b);
    const first = new Arrow([0, 0, 0], a, { stroke: hex('#38bdf8'), strokeWidth: 0.06 });
    const second = new Arrow(a, sum, { stroke: hex('#f59e0b'), strokeWidth: 0.06 });
    const result = new Arrow([0, 0, 0], sum, { stroke: hex('#e2e8f0'), strokeWidth: 0.035 });
    this.add(first, second, result);
    await this.play(new Create(first), { duration: 800 });
    await this.play(new Create(second), new Create(result), { duration: 1000 });
    await this.wait(1700);
  }
}
