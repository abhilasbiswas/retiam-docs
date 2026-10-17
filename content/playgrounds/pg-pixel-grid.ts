import { CameraModel, Create, PixelGrid, Scene, hex } from 'retiam';

/** A small matrix maps known values to two explicit colors. */
export default class PixelGridScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const grid = new PixelGrid({ matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], colorMap: { 0: hex('#334155'), 1: hex('#38bdf8') }, tileSize: 0.8, strokeColor: hex('#080c14'), strokeWidth: 0.04 });
    this.add(grid);
    await this.play(new Create(grid), { duration: 1600 });
    await this.wait(1800);
  }
}
