import { CameraModel, Circle, LissajousAnimation, Scene, hex } from 'retiam';

/** One dot isolates the lissajous motion animation. */
export default class DedicatedLissajousScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.23,{fill:hex('#38bdf8')}).move([0,0,0]);this.add(dot);
    await this.play(new LissajousAnimation(dot,{freqX:1,freqY:2,amplitudeX:2,amplitudeY:1.2,duration:3000}));await this.wait(1200);
  }
}
