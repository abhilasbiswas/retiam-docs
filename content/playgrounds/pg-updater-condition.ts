import { CameraModel, Circle, Line, Scene, hex } from 'retiam';

/** An updater stops as soon as the dot reaches the marked boundary. */
export default class UpdaterConditionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.3, {fill: hex('#38bdf8')}).move([-2, 0, 0]);
    this.add(dot, new Line([[1.5, -0.7], [1.5, 0.7]], {stroke: hex('#f59e0b'), strokeWidth: 0.05}));
    this.always((_t, dt) => dot.shift([dt * 0.001, 0, 0]), {until: () => dot.transform.position.x >= 1.5});
    await this.wait(4500);
  }
}
