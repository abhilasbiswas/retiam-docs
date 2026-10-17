import { CameraModel, Line, Rect, Scene, hex } from 'retiam';

/** The same relative shift advances the rectangle again on every call. */
export default class ShiftRelativeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Rect(1.2, 1, { fill: hex('#38bdf8') }).move([-3, 0, 0]);
    const rail = new Line([[-3, -0.8], [3, -0.8]], { stroke: hex('#334155'), strokeWidth: 0.025 });
    this.add(shape, rail);
    for (let step = 0; step < 3; step++) {
      await this.wait(750);
      shape.shift([2, 0, 0]); this.invalidate();
    }
    await this.wait(1400);
  }
}
