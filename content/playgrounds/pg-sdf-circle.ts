import { CameraModel, CustomAnimation, SDFCircle, Scene, hex } from 'retiam';

/** A two-dimensional distance-field circle changes radius while its stroke remains visible. */
export default class SdfCircleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const circle=new SDFCircle(1,{fill:hex('#38bdf8',0.2),stroke:hex('#38bdf8'),strokeWidth:0.12});this.add(circle);
    await this.play(new CustomAnimation(t=>circle.setRadius(1+0.6*Math.sin(t*Math.PI)),{duration:2200}));await this.wait(1200);
  }
}
