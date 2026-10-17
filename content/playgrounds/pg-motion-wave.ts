import { CameraModel, Circle, Color, MotionPath, NONE, Poly, Rate, Scene, Vec2, Vec3, hex } from 'retiam';

/** A small dot follows a visible wave trajectory with linear timing. */
export default class MotionWaveScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const start = new Vec3(-3, 0, 0), end = new Vec3(3, 0, 0);
    const path = MotionPath.wave(0.8, 2);
    const guide = new Poly(Array.from({length: 81}, (_, i) => {const p = path(start, end, i / 80); return new Vec2(p.x, p.y);}), {fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.04});
    const dot = new Circle(0.24, {fill: hex('#38bdf8')}).move(start);
    this.add(guide, dot);
    await this.play(dot.animate.move(end), {duration: 2600, rate_func: Rate.linear(), pathFunc: path});
    await this.wait(1200);
  }
}
