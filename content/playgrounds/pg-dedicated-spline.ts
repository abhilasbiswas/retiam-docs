import { CameraModel, Circle, Scene, SplineAnimation, hex } from 'retiam';

/** One dot isolates the spline motion animation. */
export default class DedicatedSplineScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.23,{fill:hex('#38bdf8')}).move([-3,-1,0]);this.add(dot);
    await this.play(new SplineAnimation(dot,[[-3,-1,0],[-1,1.3,0],[1,-1.3,0],[3,1,0]],{duration:3000,alignToPath:true}));await this.wait(1200);
  }
}
