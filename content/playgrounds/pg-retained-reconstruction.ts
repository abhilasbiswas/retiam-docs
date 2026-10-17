import { CENTER, CameraModel, Circle, SDFText, Scene, hex } from 'retiam';

/** Two identical dots follow the same path; counters show actual constructor calls in this example. */
export default class RetainedReconstructionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const left=new Circle(0.2,{fill:hex('#38bdf8')}).move([-2,0,0]);
    let right=new Circle(0.2,{fill:hex('#f59e0b')}).move([2,0,0]);
    const label=new SDFText('Retained: 1 / reconstructed: 1',{fontSize:0.32,anchor:CENTER}).move([0,-2,0]);
    this.add(left,right,label);let constructions=1;
    const task=this.always((_t,_dt,ctx)=>{
     const y=Math.sin(ctx.elapsed*0.003);
     left.move([-2,y,0]);this.remove(right);right.destroy();
     right=new Circle(0.2,{fill:hex('#f59e0b')}).move([2,y,0]);this.add(right);constructions++;
     label.setText('Retained: 1 / reconstructed: '+constructions);
    },{fps:12,duration:3000});
    await this.wait(3400);task.stop();await this.wait(700);
  }
}
