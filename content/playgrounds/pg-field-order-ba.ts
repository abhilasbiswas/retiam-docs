import { CameraModel, Color, Field, NONE, Path, Scene, VGroup, Vec3, hex } from 'retiam';

/** Two field mappings are applied in BA order to the same subdivided grid. */
export default class FieldOrderBaScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const grid=new VGroup();
    for(let i=-3;i<=3;i++){
     const p=i*0.45;
     grid.add(new Path([[-1.35,p],[1.35,p]],{fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.025}),new Path([[p,-1.35],[p,1.35]],{fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.025}));
    }
    grid.prepareForNonlinearTransform(32);this.add(grid);

    const a=Field.custom(p=>new Vec3(p.x*1.5,p.y,p.z));
    const b=Field.custom(p=>new Vec3(p.x,p.y+0.5*Math.sin(p.x*2),p.z));
    await this.wait(700);grid.applyField(Field.pipe(b,a));this.invalidate();await this.wait(2300);
  }
}
