import { CENTER, CameraModel, SDFText, Scene, hex } from 'retiam';

/** The same short phrase rendered with SDFText. */
export default class TextAtlasScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const phrase = new SDFText('Ideas in motion', {fontSize: 0.9, anchor: CENTER, fill: hex('#38bdf8')});
    this.add(phrase);
    this.camera.frame(phrase, {padding: 0.4});
    await this.wait(3200);
  }
}
