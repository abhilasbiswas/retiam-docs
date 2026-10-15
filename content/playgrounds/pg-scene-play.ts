import { Scene, CameraModel, Circle, Rate, hex } from 'retiam';

/** Scene.play applies one AnimOptions object to one entity animation. */
export default class ScenePlayExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    const dot = new Circle(0.35, { fill: hex('#38bdf8') }).move([-2.2, 0, 0]);
    this.add(dot);
    await this.play(dot.animate.move([2.2, 0, 0]), { duration: 1800, rate_func: Rate.easeInOutCubic() });
    await this.wait(1800);
  }
}
