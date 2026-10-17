import { CameraModel, Circle, Scene, hex } from 'retiam';

/** A host slider changes the size of one retained circle without restarting the scene. */
export default class HostStateScene extends Scene {
  private circle?: Circle;
  private amount=0.5;
  setParameter(name: string,value: number|string) {
    if(name!=='amount')return;
    this.amount=Math.max(0.1,Math.min(1,Number(value)));
    this.circle?.setScale(this.amount);
    this.invalidate();
  }
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.circle=new Circle(1.5,{fill:hex('#38bdf8')});this.add(this.circle);this.circle.setScale(this.amount);
    await this.wait(800);
  }
}
