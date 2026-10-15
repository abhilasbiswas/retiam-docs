import { Scene, Entity, Rect, Circle, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class LocalWorldComparison extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.ALWAYS_UPDATE = true;
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    new InteractionManager(this);
    for (const [x, world] of [[-2.7, false], [2.7, true]] as const) {
      const parent = new Entity();
      const frame = new Rect(3, 1.3, { fill: hex('#1e293b', 0.3), stroke: hex('#64748b'), strokeWidth: 0.04 });
      const dot = new Circle(0.2, { fill: hex(world ? '#f59e0b' : '#38bdf8') });
      parent.add(frame, dot); parent.move([x, 0, 0]); parent.rotate(Math.PI / 4);
      const text = new SDFText(world ? 'shiftWorld([dx, 0, 0])' : 'shift([dx, 0, 0])', { fontSize: 0.3, anchor: CENTER, fill: hex('#e2e8f0') });
      text.move([x, 2.7, 0]); this.add(parent, text);
      frame.setEvent('click', () => { parent.rotate(Math.PI / 8); });
      this.always((time, dt) => {
        // Integrate the derivative of sin(time) so displacement stays bounded.
        const dx = Math.cos(time * 0.001) * dt * 0.001;
        if (world) dot.shiftWorld([dx, 0, 0]); else dot.shift([dx, 0, 0]);
      });
    }
  }
}
