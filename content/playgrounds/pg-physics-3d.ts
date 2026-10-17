import { Box, CameraModel, Scene, hex } from 'retiam';
import { Physics3D } from 'retiam/physics';

/** One box drops onto one static floor using the 3D physics world. */
export default class Physics3dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.ALWAYS_UPDATE=true;
    const physics=new Physics3D(this,{gravity:[0,-9.8,0]});await physics.ready();
    const floor=new Box(6,0.3,4,{shading:'manim',color:hex('#334155')}).move([0,-1.6,0]);
    const box=new Box(0.8,0.8,0.8,{shading:'manim',color:hex('#38bdf8')}).move([0,1.5,0]);
    physics.add(floor,'static');physics.add(box,{motion:'dynamic',restitution:0.4});
    await this.wait(4400);for (const entity of [...this.entities]) { if (physics.getBody(entity)) physics.remove(entity, false); }
    physics.destroy();
  }
}
