import { CameraModel, Color, FunctionalSpatialField, NONE, Path, Scene, VGroup, Vec3, hex } from 'retiam';

/** Each source point is mapped to an explicit output point; the source geometry can be restored. */
export default class FieldCustomScene extends Scene {
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

    const field=new FunctionalSpatialField(p=>new Vec3(p.x,p.y+0.45*Math.sin(p.x*2),p.z));
    await this.wait(800);grid.applyField(field);this.invalidate();await this.wait(1600);grid.resetDeformation();this.invalidate();await this.wait(1000);
  }
}
