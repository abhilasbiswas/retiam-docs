import { CameraModel, Circle, Scene, SpringAnimation, hex } from 'retiam';

/** One dot isolates the spring motion animation. */
export default class DedicatedSpringScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot=new Circle(0.23,{fill:hex('#38bdf8')}).move([-2.5,0,0]);this.add(dot);
    await this.play(new SpringAnimation(dot,[2.5,0,0],{stiffness:90,damping:8,duration:3000}));await this.wait(1200);
  }
}
