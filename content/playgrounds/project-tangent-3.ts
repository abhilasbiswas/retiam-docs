import { Scene, Axes, FunctionGraph2D, Circle, Line, ValueTracker, CameraModel, hex } from 'retiam';

export default class TangentProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-1, 5, 1], width: 8, height: 6, showGrid: true, gridColor: hex('#334155', 0.4), axisColor: hex('#64748b') });
    const f = (x: number) => x * x / 2;
    const curve = new FunctionGraph2D(axes, f, { stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    this.add(axes, curve);
    const x = new ValueTracker(-2);
    const dot = new Circle(0.1, { fill: hex('#f59e0b') }); this.add(x, dot);
    const tangent = new Line([], { stroke: hex('#f59e0b'), strokeWidth: 0.04 }); this.add(tangent);
    this.always(() => {
      const px = x.value; dot.move(axes.c2p(px, f(px)));
      const h = 0.01;
      const slope = (f(px + h) - f(px - h)) / (2 * h);
      tangent.setVertices([axes.c2p(px - 0.8, f(px) - 0.8 * slope), axes.c2p(px + 0.8, f(px) + 0.8 * slope)]);
    }, { phase: 'post' });
    await this.play(x.animateValue(2), { duration: 4500 });
    this.setEvent('pointermove', position => {
      x.value = Math.max(-2.5, Math.min(2.5, axes.p2c(position)[0])); this.invalidate();
    });
  }
}
