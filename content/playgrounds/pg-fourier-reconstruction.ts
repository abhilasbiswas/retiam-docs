import { CENTER, CameraModel, Color, FourierTransform, NONE, Path, SDFText, Scene, Vec2, hex } from 'retiam';

/** Three reconstructions of the same sampled contour use increasing harmonic detail. */
export default class FourierReconstructionScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const samples = Array.from({ length: 48 }, (_, i) => {
      const t = i / 48 * Math.PI * 2;
      return new Vec2(1.2 * Math.cos(t) + 0.3 * Math.cos(3 * t), Math.sin(t));
    });
    const fourier = new FourierTransform(samples);
    for (const [x, count] of [[-3, 1], [0, 3], [3, 9]] as const) {
      const points = Array.from({ length: 100 }, (_, i) => fourier.evaluateTip(i / 99, count));
      const path = new Path(points, { isClosed: true, fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.05 }).move([x, 0, 0]);
      const label = new SDFText(String(count) + ' coefficients', { fontSize: 0.26, anchor: CENTER, fill: hex('#e2e8f0') }).move([x, -1.8, 0]);
      this.add(path, label);
    }
    await this.wait(3500);
  }
}
