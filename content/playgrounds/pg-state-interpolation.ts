import { CameraModel, Circle, CustomAnimation, Scene, State, hex } from 'retiam';

/** A copied target state changes position and color; interpolation writes into one existing entity. */
export default class StateInterpolationScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.4,{fill:hex('#38bdf8')}).move([-2.5,0,0]);this.add(dot);
    const start=dot.state.copy(),target=start.copy();target.transform.position.set([2.5,0,0]);target.paint.fill=hex('#f59e0b');
    await this.play(new CustomAnimation(t=>{State.interpolate(start,target,t,dot.state);dot.state.invalidate();},{duration:2500}));await this.wait(1200);
  }
}
