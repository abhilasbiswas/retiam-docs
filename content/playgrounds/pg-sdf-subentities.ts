import { Scene, CameraModel, SDFText, CENTER, hex } from 'retiam';

/** SDFText.getSubEntities exposes independently transformable glyph entities. */
export default class SDFSubEntitiesExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const text = new SDFText('ABC', { fontSize: 1.1, anchor: CENTER, fill: hex('#e2e8f0') });
    this.add(text);
    const glyphs = text.getSubEntities();
    glyphs[1]?.setFill(hex('#38bdf8')).shiftWorld([0, 0.9, 0]);
    await this.wait(3600);
  }
}
