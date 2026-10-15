import { Scene, CameraModel, Rect, hex } from 'retiam';

/** Entity.always attaches one rotation updater to its owning rectangle. */
export default class EntityAlwaysExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const tile = new Rect(2.4, 1.2, { fill: hex('#38bdf8', 0.2), stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(tile);
    tile.always((_time, dt) => tile.rotate(dt * 0.001));
    await this.wait(3600);
  }
}
