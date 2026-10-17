import { CameraModel, Circle, Create, Rect, Scene, TrackBuilder, Waiting, hex } from 'retiam';

/** TrackBuilder starts a parallel step, waits, then runs the next step. */
export default class TrackBuilderScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a = new Circle(0.45, { fill: hex('#38bdf8') }).move([-2, 0, 0]);
    const b = new Rect(0.9, 0.9, { fill: hex('#f59e0b') }).move([2, 0, 0]);
    this.add(a, b);
    const track = new TrackBuilder()
      .add(new Create(a, { duration: 800 }), new Create(b, { duration: 800 }))
      .add(new Waiting({ duration: 600 }))
      .add(a.animate.shift([0, 1, 0]).getAnim())
      .add(b.animate.shift([0, -1, 0]).getAnim());
    await this.play(track.build());
    await this.wait(1300);
  }
}
