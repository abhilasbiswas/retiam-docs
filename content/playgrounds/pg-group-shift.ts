import { CameraModel, Circle, Group, Scene, hex } from 'retiam';

/** Two root entities share a Group animator; their separation survives a relative shift. */
export default class GroupShiftScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const a=new Circle(0.3,{fill:hex('#38bdf8')}).move([-1.2,-1,0]),b=new Circle(0.3,{fill:hex('#f59e0b')}).move([1.2,-1,0]);
    this.add(a,b);const group=new Group(a,b);
    await this.play(group.animate.shift([0,1.5,0]),{duration:2200});await this.wait(1200);
  }
}
