import { CameraModel, Scene, Tex, TransformMatchingTex, hex } from 'retiam';

/** Shared symbols keep their identity while the expression changes order. */
export default class MatchingTexScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = new Tex('x + y = y + x', {fontSize: 0.9, fill: hex('#38bdf8')});
    this.add(source);
    this.camera.frame(source, {padding: 0.6});
    await this.wait(800);
    await this.play(new TransformMatchingTex(source, new Tex('y + x = x + y', {fontSize: 0.9, fill: hex('#f59e0b')}), {duration: 2200}));
    await this.wait(1500);
  }
}
