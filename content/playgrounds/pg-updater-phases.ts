import { CameraModel, Circle, Rate, Scene, hex } from 'retiam';

/** The cyan source moves first; the amber follower reads its updated position in the post phase. */
export default class UpdaterPhasesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = new Circle(0.25, {fill: hex('#38bdf8')}).move([-2.5, 0.6, 0]);
    const follower = new Circle(0.25, {fill: hex('#f59e0b')}).move([-2.5, -0.6, 0]);
    this.add(source, follower);
    const handle = this.always(() => {
      follower.move([source.transform.position.x, -0.6, 0]);
    }, {phase: 'post'});
    await this.play(source.animate.move([2.5, 0.6, 0]), {duration: 2200, rate_func: Rate.linear()});
    handle.stop();
    await this.wait(1000);
  }
}
