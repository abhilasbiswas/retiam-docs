import { CENTER, CameraModel, CapType, Dot, Line, SDFText, Scene, hex } from 'retiam';

/** Butt, round, and square caps use the same centerline endpoints. */
export default class PaintCapsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    for (const [y, cap, text] of [[1.3, CapType.BUTT, 'Butt'], [0, CapType.ROUND, 'Round'], [-1.3, CapType.SQUARE, 'Square']] as const) {
      const line = new Line([[-2, y], [2, y]], { stroke: hex('#38bdf8'), strokeWidth: 0.35 });
      line.setCap(cap);
      this.add(line, new Dot([-2, y, 0], { radius: 0.045, fill: hex('#f59e0b') }), new Dot([2, y, 0], { radius: 0.045, fill: hex('#f59e0b') }));
      this.add(new SDFText(text, { fontSize: 0.3, anchor: CENTER, fill: hex('#e2e8f0') }).move([3, y, 0]));
    }
    await this.wait(3500);
  }
}
