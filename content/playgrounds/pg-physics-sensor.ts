import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** A ball passes through a sensor; collision events change its color without creating a solid barrier. */
export default class PhysicsSensorScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',gravity:[0,0]});
    const sensor=new Rect(1,3,{fill:hex('#f59e0b',0.12),stroke:hex('#f59e0b'),strokeWidth:0.05});
    const ball=new Circle(0.3,{fill:hex('#38bdf8')}).move([-3,0,0]);
    const trigger=physics.add(sensor,{motion:'static',isSensor:true});
    const body=physics.add(ball,{motion:'dynamic'});body.setVelocity([1.5,0]);
    trigger.onCollisionStart(()=>{ball.setFill(hex('#f59e0b'));this.invalidate();});
    trigger.onCollisionEnd(()=>{ball.setFill(hex('#38bdf8'));this.invalidate();});
    await this.wait(4300);physics.destroy();
  }
}
