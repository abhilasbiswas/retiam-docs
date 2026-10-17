import { CENTER, CameraModel, Circle, SDFText, Scene, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** One body advances through the same sixty fixed simulation steps regardless of display cadence. */
export default class FixedStepPlanckScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.ALWAYS_UPDATE=true;
    const physics=new Physics2D(this,{backend:'planck',autoStep:false,gravity:[0,-4],timeStep:1/60});
    const ball=new Circle(0.3,{fill:hex('#38bdf8')}).move([0,1.7,0]);physics.add(ball,{motion:'dynamic'});
    const label=new SDFText('0 steps',{fontSize:0.35,anchor:CENTER}).move([0,2.5,0]);this.add(label);
    await this.wait(700);for(let i=1;i<=60;i++){physics.step(1/60);label.setText(i+' fixed steps');this.invalidate();await this.wait(25);}
    await this.wait(1200);physics.destroy();
  }
}
