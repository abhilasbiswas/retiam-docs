import { CameraModel, Circle, Scene, ShakeAnimation, hex } from 'retiam';

/** One dot isolates the shake motion animation. */
export default class DedicatedShakeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.23,{fill:hex('#38bdf8')}).move([0,0,0]);this.add(dot);
    await this.play(new ShakeAnimation(dot,{amplitude:0.7,frequency:5,decay:2,axis:[1,0,0],duration:2200}));await this.wait(1200);
  }
}
