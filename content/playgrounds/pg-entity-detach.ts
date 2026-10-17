import { CameraModel, Circle, Color, Entity, Rect, Scene, hex } from 'retiam';

/** A child moves from one rotated parent to another while its world position is explicitly preserved. */
export default class EntityDetachScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const left = new Entity().move([-2, 0, 0]);
    const right = new Entity().move([2, 0, 0]).rotate(Math.PI / 4);
    left.add(new Rect(2, 2, { fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.04 }));
    right.add(new Rect(2, 2, { fill: Color.NONE, stroke: hex('#f59e0b'), strokeWidth: 0.04 }));
    const dot = new Circle(0.22, { fill: hex('#38bdf8') }); left.add(dot);
    this.add(left, right);
    await this.wait(1000);
    const worldPoint = dot.localToWorld([0, 0, 0]);
    left.remove(dot); right.add(dot); dot.move(right.worldToLocal(worldPoint));
    this.invalidate();
    await this.wait(800);
    await this.play(right.animate.rotate(Math.PI / 3), { duration: 1800 });
    await this.wait(1200);
  }
}
