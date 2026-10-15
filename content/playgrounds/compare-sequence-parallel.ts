import { Scene, Circle, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class SequenceParallelComparison extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 8; this.camera.position.set([0, 0, 20]);
    new InteractionManager(this);
    const a = new Circle(0.45, { fill: hex('#38bdf8') });
    const b = new Circle(0.45, { fill: hex('#f59e0b') }); this.add(a, b);
    for (const [text, y] of [['Two awaited calls', 2.3], ['One combined target', -0.4]] as const) {
      const label = new SDFText(text, { fontSize: 0.34, anchor: CENTER, fill: hex('#e2e8f0') });
      label.move([0, y, 0]); this.add(label);
    }
    let busy = false;
    const replay = async () => {
      if (busy) return; busy = true;
      a.move([-2, 1.1, 0]).setScale(1); b.move([-2, -1.6, 0]).setScale(1);
      const sequential = async () => {
        await this.play(a.animate.move([2, 1.1, 0]), { duration: 900 });
        await this.play(a.animate.scale(1.8), { duration: 900 });
      };
      // One target state combines movement and scaling in the lower row.
      try {
        await Promise.all([sequential(), this.play(b.animate.move([2, -1.6, 0]).scale(1.8), { duration: 900 })]);
      } finally { busy = false; }
    };
    a.setEvent('click', () => { void replay(); }); b.setEvent('click', () => { void replay(); });
    await replay();
  }
}
