import { CameraModel, Circle, Scene, hex } from 'retiam';

/** A move stops partway through; a fresh animation continues from that current state. */
export default class AnimationStopRestartScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.3,{fill:hex('#38bdf8')}).move([-2.5,0,0]);this.add(dot);
    const motion=dot.animate.move([2.5,0,0]);this.always(()=>motion.stop(),{delay:1000,times:1});
    await this.play(motion,{duration:3000});await this.wait(700);
    await this.play(dot.animate.move([2.5,0,0]),{duration:1500});await this.wait(1000);
  }
}
