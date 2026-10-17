import { CameraModel, Color, HomotopyAnimation, NONE, Path, Scene, VGroup, Vec3, hex } from 'retiam';

/** A subdivided grid bends continuously from its retained source points. */
export default class HomotopyScene extends Scene {
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

    await this.play(new HomotopyAnimation(grid,(p,t)=>new Vec3(p.x,p.y+t*0.55*Math.sin(p.x*2),p.z),{duration:2400}));
    await this.wait(1000);grid.resetDeformation();this.invalidate();await this.wait(800);
  }
}
