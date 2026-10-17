import { CameraModel, Color, Field, NONE, Path, Scene, VGroup, hex } from 'retiam';

/** A small subdivided grid makes the mapping of space visible. */
export default class MapRadialrippleScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const grid = new VGroup();
    for (let i = -4; i <= 4; i++) {
      const p = i * 0.35;
      const horizontal = new Path([[-1.4, p], [1.4, p]], { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.025 });
      const vertical = new Path([[p, -1.4], [p, 1.4]], { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.025 });
      grid.add(horizontal, vertical);
    }
    grid.prepareForNonlinearTransform(32); this.add(grid);
    this.camera.orthoScale = Math.max(8, 10 / (this.canvas.width / this.canvas.height));
    await this.wait(800);
    grid.applyField(Field.radialRipple({ amplitude: 0.2, frequency: 4 })); this.invalidate();
    await this.wait(1900);
    grid.resetDeformation(); this.invalidate();
    await this.wait(900);
  }
}
