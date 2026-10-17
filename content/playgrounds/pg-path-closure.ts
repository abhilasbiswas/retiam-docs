import { CameraModel, Color, Create, Path, Scene, hex } from 'retiam';

/** The same three points form an open line and a closed, filled triangle. */
export default class PathClosureScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const points = [[-0.8, -0.7], [0, 0.9], [0.8, -0.7]];
    const open = new Path(points, { isClosed: false, fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.06 }).move([-2, 0, 0]);
    const closed = new Path(points, { isClosed: true, fill: hex('#f59e0b', 0.2), stroke: hex('#f59e0b'), strokeWidth: 0.06 }).move([2, 0, 0]);
    this.add(open, closed);
    await this.play(new Create(open), new Create(closed), { duration: 1600 });
    await this.wait(1700);
  }
}
