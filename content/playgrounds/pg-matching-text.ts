import { CameraModel, Scene, Text, TransformMatchingText, hex } from 'retiam';

/** Shared symbols keep their identity while the expression changes order. */
export default class MatchingTextScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const source = new Text('A + B', {fontSize: 0.9, fill: hex('#38bdf8')});
    const target = new Text('B + A', {fontSize: 0.9, fill: hex('#f59e0b')});
    this.add(source);
    this.camera.frame(source, {padding: 0.6});
    await this.wait(800);
    await this.play(new TransformMatchingText(source, target, {duration: 2200}));
    await this.wait(1500);
  }
}
