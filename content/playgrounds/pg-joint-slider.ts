import { CameraModel, Circle, Scene, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** One fixed anchor and one dynamic body isolate a slider joint. */
export default class JointSliderScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',gravity:[0,-4]});
    const anchor=new Circle(0.12,{fill:hex('#f59e0b')}).move([0,1.5,0]);
    const bob=new Circle(0.4,{fill:hex('#38bdf8')}).move([1.5,-0.2,0]);
    physics.add(anchor,'static');physics.add(bob,{motion:'dynamic'});
    physics.addPrismaticJoint(anchor,bob,{axis:{x:0,y:1},enableLimit:true,limits:[-1,1]});
    await this.wait(4800);physics.destroy();
  }
}
