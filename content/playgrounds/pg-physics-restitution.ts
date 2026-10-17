import { CameraModel, Circle, Rect, Scene, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** Two otherwise identical bodies differ only in restitution. */
export default class PhysicsRestitutionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',gravity:[0,-9.8]});
    const floor=new Rect(8,0.3,{fill:hex('#334155')}).move([0,-2.2,0]);physics.add(floor,'static');
    for(let i=0;i<2;i++){const ball=new Circle(0.35,{fill:hex(i?'#f59e0b':'#38bdf8')}).move([i*3-1.5,1.8,0]);const body=physics.add(ball,{motion:'dynamic',restitution:i?0.85:0});}
    await this.wait(4800);physics.destroy();
  }
}
