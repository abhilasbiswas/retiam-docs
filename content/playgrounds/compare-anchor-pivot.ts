import { Scene, Rect, Circle, SDFText, CameraModel, InteractionManager, hex, CENTER, LEFT } from 'retiam';

export default class AnchorPivotComparison extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.ALWAYS_UPDATE = true;
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    new InteractionManager(this);
    for (const [text, x] of [['Local left edge', -2.7], ['World point', 2.7]] as const) {
      const label = new SDFText(text, { fontSize: 0.35, anchor: CENTER, fill: hex('#e2e8f0') });
      label.move([x, 2.7, 0]); this.add(label);
    }
    const left = new Rect(2.1, 1.1, { fill: hex('#38bdf8', 0.3), stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    const right = new Rect(2.1, 1.1, { fill: hex('#f59e0b', 0.3), stroke: hex('#f59e0b'), strokeWidth: 0.05 });
    left.move([-2.7, 0, 0]); right.move([2.7, 0, 0]);
    const edge = left.getBoundaryPoint(LEFT);
    const world: [number, number, number] = [1.2, -0.7, 0];
    left.setPivot(edge); right.setPivot(world);
    this.add(left, right, new Circle(0.09, { position: edge, fill: hex('#e2e8f0') }), new Circle(0.09, { position: world, fill: hex('#e2e8f0') }));
    let direction = 1;
    left.setEvent('click', () => { direction *= -1; }); right.setEvent('click', () => { direction *= -1; });
    this.always((_time, dt) => {
      left.rotate(dt * 0.0004 * direction); right.rotate(dt * 0.0004 * direction);
    });
  }
}
