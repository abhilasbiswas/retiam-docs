import { CameraModel, Circle, Scene, hex } from 'retiam';
import { Subtitles } from 'retiam/tts';

/** One short caption demonstrates the glass subtitle preset with a safe bottom margin. */
export default class CaptionsGlassScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const subject = new Circle(0.6, {fill: hex('#38bdf8')}).move([0, 0.5, 0]);
    const captions = new Subtitles({preset: 'glass', fontSize: 0.38, maxWidth: 7, maxLineChars: 30, bottomOffset: -2});
    this.add(subject, captions);
    captions.showText('A circle moves from left to right.');
    await this.wait(3200); captions.clear();
    await this.wait(600);
  }
}
