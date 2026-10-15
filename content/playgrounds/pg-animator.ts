import { Scene, CameraModel, Rect, Rate, hex } from 'retiam';

/** Entity.animate builds one target-state animation for one rectangle. */
export default class AnimatorExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const tile = new Rect(1.4, 1.4, { fill: hex('#38bdf8') }).move([-2.2, 0, 0]);
    this.add(tile);
    await this.play(tile.animate.move([2.2, 0, 0]), { duration: 1800, rate_func: Rate.easeInOutCubic() });
    await this.wait(1800);
  }
}
