import { BlurPulse, CameraModel, Circle, RenderTarget, Scene, hex } from 'retiam';

/** One offscreen circle demonstrates BlurPulse without moving the camera. */
export default class BlurBlurpulseScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const target=new RenderTarget(this,{width:256,height:256,type:'offscreen',blur:0});
    const subject=new Circle(65,{fill:hex('#38bdf8')});target.add(subject);
    const output=target.toSprite(4,4);this.add(output);
    await this.wait(700);await this.play(new BlurPulse(target, {duration: 2200}));await this.wait(1200);
  }
}
