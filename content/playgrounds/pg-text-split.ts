import { Scene, CameraModel, Text, CENTER, hex } from 'retiam';

/** Split one sentence into independently movable word entities. */
export default class TextSplitExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;
    const sentence = new Text('split words', { fontSize: 1.0, anchor: CENTER, fill: hex('#e2e8f0') });
    this.add(sentence);
    const words = sentence.splitWords();
    words[1].setFill(hex('#38bdf8')).shiftWorld([0, 1.2, 0]);
    await this.wait(3600);
  }
}
