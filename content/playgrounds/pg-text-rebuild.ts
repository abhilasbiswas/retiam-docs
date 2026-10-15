import { Scene, CameraModel, Text, CENTER, hex } from 'retiam';

/** Text.rebuild regenerates one word after its font size changes. */
export default class TextRebuildExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const text = new Text('Rebuilt', { fontSize: 0.7, anchor: CENTER, fill: hex('#38bdf8') });
    this.add(text);
    text.fontSize = 1.3;
    text.rebuild();
    await this.wait(3600);
  }
}
