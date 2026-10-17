import { CameraModel, Color, NONE, Path, Scene, ZigZagModifier, hex } from 'retiam';

/** The same retained path alternates between its source and modified shape. */
export default class ModifierEnabledScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const modifier = new ZigZagModifier({ amplitude: 0.18, ridges: 10 });
    const shape = new Path('M -3 0 L 3 0', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    shape.addModifier(modifier); this.add(shape);
    await this.wait(1100);
    modifier.enabled = false; shape.invalidateModifiers(); this.invalidate();
    await this.wait(1100);
    modifier.enabled = true; shape.invalidateModifiers(); this.invalidate();
    await this.wait(1600);
  }
}
