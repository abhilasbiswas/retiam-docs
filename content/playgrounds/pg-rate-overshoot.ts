import { CameraModel, Circle, Line, Rate, Scene, hex } from 'retiam';

/** A dot moves along one straight track using overshoot timing. */
export default class RateOvershootScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.28, {fill: hex('#38bdf8')}).move([-2.5, 0, 0]);
    this.add(new Line([[-2.5, 0], [2.5, 0]], {stroke: hex('#334155'), strokeWidth: 0.035}), dot);
    await this.play(dot.animate.move([2.5, 0, 0]), {duration: 2600, rate_func: Rate.easeOutBack()});
    await this.wait(1200);
  }
}
