import { Scene, CameraModel, SDFText,Text, Path, Circle, Create, Write, FadeIn, CustomAnimation, Rate, Color, CENTER, hex } from 'retiam';

/** A quiet welcome: a word is written, a curve is drawn, and a point follows it. */
export default class WelcomeScene extends Scene {
  async run() {
    this.disablePlayer();
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);

    const title = new Text('Retiam', { fontSize: 2.1, anchor: CENTER, fill: hex('#f8fafc') }).move([0, 1.5, 0]);
    const caption = new Text('Ideas, in motion.', { fontSize: 0.64, anchor: CENTER, fill: hex('#94a3b8') }).move([0, 0.0, 0]);

    await this.play(new Write(title), { duration: 1200 });
    await this.play(new Write(caption), { duration: 1200 });
  }
}
