import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';

/** A real image-pass chain is shown at one specific stage. */
export default class PassStage0Scene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.add(new Circle(0.85,{fill:hex('#38bdf8')}).move([-1.5,0,0]),new Rect(1.7,1.7,{fill:hex('#f59e0b')}).move([1.5,0,0]));
    await this.wait(3400);
  }
}
