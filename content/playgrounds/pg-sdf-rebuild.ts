import { Scene, CameraModel, SDFText, CENTER, hex } from 'retiam';

/** SDFText.rebuild regenerates one text line after its size changes. */
export default class SDFRebuildExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const text = new SDFText('Rebuilt', { fontSize: 0.6, anchor: CENTER, fill: hex('#38bdf8') });
    this.add(text);
    text.fontSize = 1.1;
    text.rebuild();
    await this.wait(3600);
  }
}
