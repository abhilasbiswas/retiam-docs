import { CameraModel, Circle, Line, Scene, hex } from 'retiam';

/** After a short delay, an updater advances a dot four times and unregisters itself. */
export default class UpdaterBoundedScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.3, {fill: hex('#38bdf8')}).move([-2, 0, 0]);
    this.add(new Line([[-2, 0], [2, 0]], {stroke: hex('#334155'), strokeWidth: 0.035}), dot);
    this.always(() => dot.shift([1, 0, 0]), {delay: 800, interval: 500, times: 4});
    await this.wait(4200);
  }
}
