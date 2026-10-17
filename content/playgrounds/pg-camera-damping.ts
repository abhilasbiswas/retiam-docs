import { Camera2DController, CameraModel, Circle, Line, Rate, Scene, hex } from 'retiam';

/** A cyan target crosses a fixed row of reference marks while the controller follows it. */
export default class CameraDampingScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const dot = new Circle(0.3, {fill: hex('#38bdf8')}).move([-3, 0, 0]);
    for (let i = -6; i <= 6; i++) this.add(new Line([[i, -0.8], [i, -1]], {stroke: hex('#334155'), strokeWidth: 0.04}));
    this.add(dot);
    const controller = new Camera2DController(this, this.camera, {enableKeys: false, enablePan: false, enableTouch: false, enableZoom: false});
    controller.follow(dot, {damping: 2});
    await this.play(dot.animate.move([4, 0, 0]), {duration: 3200, rate_func: Rate.linear()});
    await this.wait(800); controller.destroy();
  }
}
