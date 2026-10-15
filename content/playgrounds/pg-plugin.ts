import { Scene, CameraModel, Rect, hex } from 'retiam';
import type { AlwaysHandle, Entity, IPlugin } from 'retiam';

class RotationPlugin implements IPlugin {
  readonly name = 'FocusedRotation';
  private update?: AlwaysHandle;
  constructor(private target: Entity) {}
  install(scene?: Scene) {
    this.update = scene?.always((_time, dt) => this.target.rotate(dt * 0.0007));
  }
  dispose() {
    this.update?.stop();
    this.update = undefined;
  }
}

/** One plugin installs and owns one rotation updater. */
export default class PluginExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const tile = new Rect(2.6, 1.6, { fill: hex('#38bdf8', 0.25), stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    this.add(tile);
    this.use(new RotationPlugin(tile));
    await this.wait(2800);
  }
}
