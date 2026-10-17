import { CameraModel, Circle, Rate, Scene, hex } from 'retiam';

/** One circle jumps to its destination; the second travels through intermediate positions. */
export default class ImmediateAnimatedScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const jump = new Circle(0.3, {fill: hex('#f59e0b')}).move([-2.5, 0.8, 0]);
    const tween = new Circle(0.3, {fill: hex('#38bdf8')}).move([-2.5, -0.8, 0]);
    this.add(jump, tween);
    await this.wait(700);
    jump.move([2.5, 0.8, 0]); this.invalidate();
    await this.play(tween.animate.move([2.5, -0.8, 0]), {duration: 2000, rate_func: Rate.linear()});
    await this.wait(1200);
  }
}
