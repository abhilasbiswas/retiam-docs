import { Scene, Path, CustomModifier, SDFText, CameraModel, InteractionManager, Color, hex, CENTER } from 'retiam';

export default class ModifierWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    this.camera.orthoScale = 7;
    new InteractionManager(this);
    let amplitude = 0.7, running = true, phase = 0;
    const bend = new CustomModifier(contours => contours.map(contour => {
      const result = contour.slice();
      for (let i = 0; i < result.length; i += 2) {
        result[i + 1] += amplitude * Math.sin(result[i] + phase);
      }
      return result;
    }), 'Wave');
    const source = 'M -3 0 Q -1.5 0 0 0 Q 1.5 0 3 0';
    const original = new Path(source, { fill: Color.NONE, stroke: hex('#64748b'), strokeWidth: 0.04 });
    const deformed = new Path(source, { fill: Color.NONE, stroke: hex('#38bdf8'), strokeWidth: 0.1, modifiers: [bend] });
    const label = new SDFText('Click the curve to freeze the wave', { fontSize: 0.33, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 2.3, 0]); this.add(original, deformed, label);
    deformed.setEvent('click', () => { running = !running; });
    this.always((_time, dt) => {
      if (!running) return;
      phase += dt / 1000; bend.invalidate(); this.invalidate();
    });
  }
}
