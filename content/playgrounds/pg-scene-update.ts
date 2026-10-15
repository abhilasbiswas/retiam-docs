import { Scene, CameraModel, Circle, Line, hex } from 'retiam';

/** Scene.update moves one dot from the frame time supplied by the engine. */
export default class SceneUpdateExample extends Scene {
  private dot?: Circle;

  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.dot = new Circle(0.28, { fill: hex('#38bdf8') });
    this.add(new Line([[-2.5, 0], [2.5, 0]], { stroke: hex('#334155'), strokeWidth: 0.04 }), this.dot);
    await this.wait(3600);
  }

  override async update(time: number, dt: number) {
    await super.update(time, dt);
    this.dot?.move([2.5 * Math.sin(time / 700), 0, 0]);
  }
}
