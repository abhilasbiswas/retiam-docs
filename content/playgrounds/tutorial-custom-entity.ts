import { Scene, Entity, Dot, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

interface MarkerOptions { label: string; accent?: string; }

class LabeledMarker extends Entity {
  readonly dot: Dot;
  private caption: SDFText;
  constructor(options: MarkerOptions) {
    super();
    this.dot = new Dot([0, 0, 0], { radius: 0.22, fill: hex(options.accent || '#38bdf8') });
    this.caption = new SDFText(options.label, { fontSize: 0.42, anchor: CENTER, fill: hex('#e2e8f0') });
    this.caption.move([0, 0.8, 0]);
    this.add(this.dot, this.caption);
  }
  setLabel(text: string) { this.caption.setText(text); this.invalidate(); return this; }
}

export default class CustomEntityTutorial extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    new InteractionManager(this);
    const left = new LabeledMarker({ label: 'A' });
    const right = new LabeledMarker({ label: 'B', accent: '#f59e0b' });
    left.move([-2, 0, 0]); right.move([2, 0, 0]);
    this.add(left, right);
    let selected = false;
    left.dot.setEvent('click', () => { selected = !selected; left.setLabel(selected ? 'Selected' : 'A'); });
    this.camera.orthoScale = 5.1;
    await this.play(right.animate.rotate(Math.PI / 6), { duration: 1000 });
    await this.wait(500);
  }
}
