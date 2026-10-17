import { CameraModel, Poly, Rate, Rect, Scene, Vec2, hex } from 'retiam';

/** One shape grows to an absolute target scale. */
export default class StateScaleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const stripe = new Rect(7, 0.25, { fill: hex('#334155') });
    const shape = new Poly([new Vec2(-0.8, -0.65), new Vec2(0.8, -0.65), new Vec2(0.2, 0.9)], { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), strokeWidth: 0.045 }).move([0, 0, 0]);
    this.add(stripe, shape);
    await this.wait(600);
    await this.play(shape.animate.setScale(2), { duration: 1800, rate_func: Rate.easeInOutCubic() });
    await this.wait(1500);
  }
}
