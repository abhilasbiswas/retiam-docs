import { Scene, Circle, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class GeometryPaintComparison extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.ALWAYS_UPDATE = true;
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 8; this.camera.position.set([0, 0, 20]);
    new InteractionManager(this);
    const geometry = new Circle(1, { stroke: hex('#38bdf8'), strokeWidth: 0.05 });
    const paint = new Circle(1, { stroke: hex('#f59e0b'), strokeWidth: 0.05 });
    geometry.move([-2.5, 0, 0]); paint.move([2.5, 0, 0]); this.add(geometry, paint);
    for (const [text, x] of [['Change scale', -2.5], ['Change stroke width', 2.5]] as const) {
      const label = new SDFText(text, { fontSize: 0.35, anchor: CENTER, fill: hex('#e2e8f0') });
      label.move([x, 2.4, 0]); this.add(label);
    }
    let animate = true;
    geometry.setEvent('click', () => { animate = !animate; }); paint.setEvent('click', () => { animate = !animate; });
    this.always(time => {
      if (!animate) return;
      const amount = (Math.sin(time * 0.001) + 1) / 2;
      geometry.setScale(0.75 + amount * 0.7); paint.setStrokeWidth(0.05 + amount * 0.45); this.invalidate();
    });
  }
}
