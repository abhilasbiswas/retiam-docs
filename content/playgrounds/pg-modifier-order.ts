import { CameraModel, Color, Create, NONE, Path, Scene, TrimModifier, ZigZagModifier, hex } from 'retiam';

/** Trim and zigzag are applied in opposite orders to identical source lines. */
export default class ModifierOrderScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const first = new Path('M -3 0 L 3 0', { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.06 }).move([0, 0.8, 0]);
    const second = new Path('M -3 0 L 3 0', { fill: Color.NONE, stroke: hex('#f59e0b'), strokeWidth: 0.06 }).move([0, -0.8, 0]);
    first.addModifier(new TrimModifier({ end: 0.5 })).addModifier(new ZigZagModifier({ amplitude: 0.2, ridges: 10 }));
    second.addModifier(new ZigZagModifier({ amplitude: 0.2, ridges: 10 })).addModifier(new TrimModifier({ end: 0.5 }));
    this.add(first, second);
    await this.play(new Create(first), new Create(second), { duration: 1600 });
    await this.wait(1800);
  }
}
