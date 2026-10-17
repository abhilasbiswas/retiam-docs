import { CENTER, CameraModel, Scene, Text, Write, hex } from 'retiam';

/** A short vector word makes the letter-by-letter behavior easy to follow. */
export default class RevealWriteScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const text = new Text('Retiam', { fontSize: 0.8, anchor: CENTER, fill: hex('#38bdf8') });
    this.add(text);

    await this.play(new Write(text), { duration: 2000 });
    await this.wait(1500);
  }
}
