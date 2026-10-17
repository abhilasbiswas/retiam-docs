import { CameraModel, Circle, Rate, Scene, hex } from 'retiam';

/** One dot starts immediately; the other waits before following the same movement. */
export default class AnimationDelayScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a = new Circle(0.22, { fill: hex('#38bdf8') }).move([-3, 0.8, 0]);
    const b = new Circle(0.22, { fill: hex('#f59e0b') }).move([-3, -0.8, 0]);
    this.add(a, b);
    await this.play(a.animate.move([3, 0.8, 0]), b.animate.move([3, -0.8, 0]).applyOptions({ delay: 700 }), { duration: 1800, rate_func: Rate.linear() });
    await this.wait(1500);
  }
}
