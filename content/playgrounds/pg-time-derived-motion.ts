import { CameraModel, Circle, Color, NONE, Scene, hex } from 'retiam';

/** A dot computes its position from elapsed time instead of accumulating frame-dependent increments. */
export default class TimeDerivedMotionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.28, {fill: hex('#38bdf8')});
    this.add(new Circle(1.8, {fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.035}), dot);
    const task = this.always((_time, _dt, context) => {
     const angle = context.elapsed * Math.PI / 2000;
     dot.move([1.8 * Math.cos(angle), 1.8 * Math.sin(angle), 0]);
    });
    await this.wait(5000); task.stop();
  }
}
