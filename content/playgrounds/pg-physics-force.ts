import { CameraModel, Circle, Scene, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** One body receives a bounded continuous force in a gravity-free world. */
export default class PhysicsForceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',gravity:[0,0]});
    const ball=new Circle(0.4,{fill:hex('#38bdf8')}).move([-2.5,0,0]);const body=physics.add(ball,{motion:'dynamic',linearDamping:0.4});
    await this.wait(700);
    this.always(()=>body.applyForce([0.7,0]),{duration:1600});
    await this.wait(2600);physics.destroy();
  }
}
