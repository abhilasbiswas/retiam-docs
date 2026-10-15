import { Scene, CameraModel, Text, CENTER, hex } from 'retiam';

/** Text.getPaths exposes the glyph paths from one short word. */
export default class TextPathsExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const text = new Text('PATH', { fontSize: 1.2, anchor: CENTER, fill: hex('#e2e8f0') });
    this.add(text);
    const paths = text.getPaths();
    paths[1]?.setFill(hex('#38bdf8')).shiftWorld([0, 0.8, 0]);
    await this.wait(3600);
  }
}
