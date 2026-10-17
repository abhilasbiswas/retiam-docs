import { CameraModel, Circle, Color, NONE, Poly, Scene, Spline, Vec2, hex } from 'retiam';
import { CurveType } from 'retiam';

/** The same visible control points define a Hermite curve. */
export default class CurveHermiteScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const points=[[-3,-1,0],[-1,1.5,0],[1,-1.5,0],[3,1,0]] as [number,number,number][];
    const curve=new Spline(points,{type:CurveType.Hermite,fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.08});
    const polygon=new Poly(points.map(p=>new Vec2(p[0],p[1])),{fill:Color.NONE,stroke:hex('#334155'),strokeWidth:0.025});
    this.add(curve,polygon);
    for(const p of points)this.add(new Circle(0.09,{fill:hex('#f59e0b')}).move(p));
    await this.wait(3400);
  }
}
