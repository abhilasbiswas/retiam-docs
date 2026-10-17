import { CameraModel, Circle, OrbitAnimation, Scene, hex } from 'retiam';

/** One dot isolates the orbit motion animation. */
export default class DedicatedOrbitScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.23,{fill:hex('#38bdf8')}).move([2,0,0]);this.add(dot);
    await this.play(new OrbitAnimation(dot,[0,0,0],{angle:Math.PI*2,duration:3000}));await this.wait(1200);
  }
}
