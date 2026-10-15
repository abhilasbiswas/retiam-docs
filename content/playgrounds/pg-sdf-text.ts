import { Scene, CameraModel, SDFText, CENTER, hex } from 'retiam';

/** One SDFText constructor call creates one texture-backed text line. */
export default class SDFTextExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.add(new SDFText('SDF text', { fontSize: 1.0, anchor: CENTER, fill: hex('#38bdf8') }));
    await this.wait(3600);
  }
}
