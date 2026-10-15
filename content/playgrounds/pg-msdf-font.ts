import { Scene, CameraModel, FontLoader, SDFText, CENTER, hex } from 'retiam';

/** Load one pre-baked MSDF atlas and render one line with it. */
export default class MSDFFontExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const font = await FontLoader.msdf('/src/assets/fonts/roboto-msdf.json');
    const text = new SDFText('Loaded MSDF font', { font, fontSize: 0.9, anchor: CENTER, fill: hex('#38bdf8') });
    this.add(text);
    this.camera.frame(text, { padding: 0.32 });
    await this.wait(2600);
  }
}
