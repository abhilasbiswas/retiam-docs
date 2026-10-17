import { Box, CameraModel, Scene, hex } from 'retiam';
import { Physics3D } from 'retiam/physics';

/** One gravity-free body receives a controlled impulse. */
export default class Body3dImpulseScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.ALWAYS_UPDATE=true;const physics=new Physics3D(this,{gravity:[0,0,0]});await physics.ready();
    const box=new Box(0.8,0.8,0.8,{shading:'manim',color:hex('#38bdf8')}).move([-2.5,0,0]);const body=physics.add(box,{motion:'dynamic',mass:1});await this.wait(700);
    body.applyImpulse([1.1,0,0]);
    await this.wait(3000);for (const entity of [...this.entities]) { if (physics.getBody(entity)) physics.remove(entity, false); }
    physics.destroy();
  }
}
