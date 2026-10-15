import { Scene, CameraModel, hex } from 'retiam';
import { Star } from 'retiam/shapes';

/** One procedural Star, controlled only by its geometric parameters. */
export default class ProceduralStarExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;

    const star = new Star({ points: 5, outerRadius: 2.3, innerRadius: 1.0, cornerRadius: 0.12 });
    star.setFill(hex('#38bdf8', 0.18)).setStroke(0.07, hex('#38bdf8'));
    this.add(star);
    this.camera.frame(star, { padding: 0.3 });
    await this.wait(2800);
  }
}
