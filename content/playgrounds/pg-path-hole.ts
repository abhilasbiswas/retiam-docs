import { CameraModel, Create, Path, Rect, Scene, hex } from 'retiam';

/** An outer contour and oppositely wound inner contour form a single shape with a clear hole. */
export default class PathHoleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const stripe = new Rect(6, 0.3, { fill: hex('#f59e0b') });
    const path = new Path('M -2 -1.5 L 2 -1.5 L 2 1.5 L -2 1.5 Z M -0.8 -0.6 L -0.8 0.6 L 0.8 0.6 L 0.8 -0.6 Z', { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), strokeWidth: 0.04 });
    this.add(stripe, path);
    await this.play(new Create(path), { duration: 1700 });
    await this.wait(1800);
  }
}
