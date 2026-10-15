import { Scene, CameraModel, hex } from 'retiam';
import { Helix3D } from 'retiam/shapes';

/** One procedural helix exposes radius, pitch and turn count. */
export default class ProceduralHelixExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([5, 3, 20]);
    this.camera.orthoScale = 7;
    const helix = new Helix3D({ radius: 1.2, pitch: 0.55, turns: 4, tubeRadius: 0.09 });
    helix.material.color = hex('#38bdf8').rgba;
    this.add(helix);
    this.camera.lookAt([0, 0, 0]);
    await this.wait(2800);
  }
}
