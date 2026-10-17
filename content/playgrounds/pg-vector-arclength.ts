import { CENTER, CameraModel, Color, CustomAnimation, Dot, Path, Rate, SDFText, Scene, hex } from 'retiam';

/** A marker follows a path by geometric distance rather than by its curve parameter. */
export default class VectorArclengthScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const path = new Path('M -3 -1 Q -1 2 1 0 Q 2 -2 3 1', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.055 });
    const length = path.getArcLength();
    const dot = new Dot([0, 0, 0], { radius: 0.1, fill: hex('#f59e0b') });
    const label = new SDFText('Length: ' + length.toFixed(2), { fontSize: 0.35, anchor: CENTER, fill: hex('#e2e8f0') }).move([0, 2.3, 0]);
    this.add(path, dot, label);
    await this.play(new CustomAnimation(t => {
      const point = path.getPointAtLength(t * length); dot.move([point.x, point.y, 0]);
    }), { duration: 3000, rate_func: Rate.linear() });
    await this.wait(1200);
  }
}
