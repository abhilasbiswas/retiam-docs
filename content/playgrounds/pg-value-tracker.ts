import { Scene, CameraModel, Circle, Line, ValueTracker, Vec3, hex } from 'retiam';

/** One ValueTracker animates one scalar used as a dot's x coordinate. */
export default class ValueTrackerExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const track = new Line([new Vec3(-2.5, 0, 0), new Vec3(2.5, 0, 0)], {
      stroke: hex('#334155'),
      strokeWidth: 0.04,
    });
    const value = new ValueTracker(-2.5);
    const dot = new Circle(0.3, { fill: hex('#38bdf8') });
    this.add(track, value, dot);
    this.always(() => dot.setPosition([value.value, 0, 0]));
    await this.play(value.animateValue(2.5), { duration: 2200 });
    await this.wait(800);
  }
}
