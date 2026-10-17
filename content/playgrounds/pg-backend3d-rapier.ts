import { Box, CameraModel, Scene, hex } from 'retiam';
import { Physics3D } from 'retiam/physics';

/** One body and one fixed floor run on the explicitly selected rapier backend. */
export default class Backend3dRapierScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    this.ALWAYS_UPDATE=true;const physics=new Physics3D(this,{backend:'rapier',gravity:[0,-9.8,0]});await physics.ready();
    const floor=new Box(6,0.3,3,{shading:'manim',color:hex('#334155')}).move([0,-1.6,0]);
    const box=new Box(0.8,0.8,0.8,{shading:'manim',color:hex('#38bdf8')}).move([0,1.6,0]);physics.add(floor,'static');physics.add(box,{motion:'dynamic',restitution:0.35});
    await this.wait(4200);for (const entity of [...this.entities]) { if (physics.getBody(entity)) physics.remove(entity, false); }
    physics.destroy();
  }
}
