import { CameraModel, Poly, Scene, Vec2, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** A four-by-three soft-body lattice hangs from its top edge. */
export default class PhysicsPinnedClothScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',gravity:[0,-4]});
    const cloth=new Poly([new Vec2(-1.6, 1.4), new Vec2(1.6, 1.4), new Vec2(1.6, -1.4), new Vec2(-1.6, -1.4)],{isClosed:true,fill:hex('#38bdf8',0.3),stroke:hex('#38bdf8'),strokeWidth:0.05});
    physics.addSoftBody(cloth,{shape:'grid',columns:4,rows:3,pinned:'top-edge',frequencyHz:3,dampingRatio:0.2});
    await this.wait(4800);physics.destroy();
  }
}
