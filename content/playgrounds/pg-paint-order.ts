import { CameraModel, Circle, Scene, hex } from 'retiam';

/** Changing z_index changes which overlapping shape is drawn in front. */
export default class PaintOrderScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const cyan = new Circle(1.2, { fill: hex('#38bdf8') }).move([-0.7, 0, 0]);
    const amber = new Circle(1.2, { fill: hex('#f59e0b') }).move([0.7, 0, 0]);
    this.add(cyan, amber);
    await this.wait(1100);
    cyan.z_index = 1; this.invalidate();
    await this.wait(1700);
  }
}
