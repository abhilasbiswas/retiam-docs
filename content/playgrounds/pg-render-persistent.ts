import { CameraModel, Circle, Rate, Scene, hex } from 'retiam';

/** One moving dot leaves a persistent trail; an explicit clear removes the accumulated image. */
export default class RenderPersistentScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.composer!.setPersistence(true);this.ALWAYS_UPDATE=true;
    const dot=new Circle(0.15,{fill:hex('#38bdf8')}).move([-2.5,0,0]);this.add(dot);
    await this.play(dot.animate.move([2.5,0,0]),{duration:2200,rate_func:Rate.linear()});
    await this.wait(700);this.composer!.clearNextFrame();this.invalidate();await this.wait(1000);this.composer!.setPersistence(false);
  }
}
