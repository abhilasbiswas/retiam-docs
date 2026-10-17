import { CameraModel, Circle, Color, Scene, hex } from 'retiam';

/** A hidden circle remains attached and reappears at its changed position. */
export default class EntityVisibilityScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new Circle(0.7, { fill: hex('#38bdf8') }).move([-2, 0, 0]);
    const destination = new Circle(0.7, { fill: Color.NONE, stroke: hex('#334155'), strokeWidth: 0.035 }).move([2, 0, 0]);
    this.add(shape, destination);
    await this.wait(800);
    shape.VISIBILITY = false; shape.move([2, 0, 0]); this.invalidate();
    await this.wait(1100);
    shape.VISIBILITY = true; this.invalidate();
    await this.wait(1600);
  }
}
