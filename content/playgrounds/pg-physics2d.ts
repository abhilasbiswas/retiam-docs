import { Scene, CameraModel, Circle, Rect, Color, hex } from 'retiam';
import { Physics2D } from 'retiam/physics';

/** Gravity acts on one dynamic ball above one fixed floor. */
export default class Physics2DExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 12;
    this.ALWAYS_UPDATE = true;

    const physics = new Physics2D(this, { backend: 'rapier', gravity: [0, -9.8] });
    const floor = new Rect(9, 0.35, { fill: hex('#334155'), stroke: Color.NONE });
    floor.move([0, -3, 0]);
    physics.add(floor, 'static');

    const ball = new Circle(0.55, { fill: hex('#38bdf8'), stroke: hex('#e2e8f0'), strokeWidth: 0.04 });
    ball.move([0, 2, 0]);
    physics.add(ball, { motion: 'dynamic', restitution: 0.45, friction: 0.2 });
    await this.wait(3600);
  }
}
