import { Scene, CameraModel, Circle, Line, hex } from 'retiam';

/** AlwaysOptions.interval throttles one scene updater to four visible steps per second. */
export default class AlwaysOptionsExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const dot = new Circle(0.28, { fill: hex('#38bdf8') }).move([-2.5, 0, 0]);
    this.add(new Line([[-2.5, 0], [2.5, 0]], { stroke: hex('#334155'), strokeWidth: 0.04 }), dot);
    let step = 0;
    this.always(() => {
      step = (step + 1) % 9;
      dot.move([-2.5 + step * 0.625, 0, 0]);
    }, { interval: 250 });
    await this.wait(3600);
  }
}
