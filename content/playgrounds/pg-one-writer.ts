import { CameraModel, Rect, Scene, hex } from 'retiam';

/** One animation owns position, rotation, and scale for the entire move. */
export default class OneWriterScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const tile = new Rect(1.4, 0.8, {fill: hex('#38bdf8')}).move([-2.5, 0, 0]);
    this.add(tile);
    await this.wait(600);
    await this.play(tile.animate.move([2.5, 0, 0]).rotate(Math.PI).scale(1.4), {duration: 2200});
    await this.wait(1200);
  }
}
