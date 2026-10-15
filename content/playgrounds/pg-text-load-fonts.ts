import { Scene, CameraModel, Text, CENTER, hex } from 'retiam';

/** Text.loadFonts loads one vector font before one Text entity uses it. */
export default class TextLoadFontsExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    await Text.loadFonts('/fonts/Hiragenda.ttf');
    this.add(new Text('Loaded font', { fontSize: 1.1, anchor: CENTER, fill: hex('#38bdf8') }));
    await this.wait(3600);
  }
}
