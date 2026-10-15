import { Scene, Circle, Line, CameraModel, Rate, SDFText, CENTER, hex } from 'retiam';

/** The upper dot keeps constant speed; the lower dot follows your chosen rate. */
export default class EasingLab extends Scene {
  private dots: Circle[] = [];
  private elapsed = 0;
  private duration = 2000;
  private easing = 'smooth';
  async run() {
    this.clearColor(hex('#080c14'));
    this.ALWAYS_UPDATE = true;
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    for (const [index, y] of [1, -1].entries()) {
      const caption = new SDFText(index === 0 ? 'Linear' : 'Eased', { fontSize: 0.36, anchor: CENTER, fill: hex('#e2e8f0') });
      caption.move([0, y + 0.6, 0]); this.add(caption);
      const rail = new Line([[-4, y], [4, y]], { stroke: hex('#334155'), strokeWidth: 0.035 });
      const dot = new Circle(0.25, { fill: hex(index === 0 ? '#f59e0b' : '#38bdf8') });
      dot.move([-4, y, 0]); this.add(rail, dot); this.dots.push(dot);
    }
    this.always((_time, dt) => {
      this.elapsed = (this.elapsed + dt) % (this.duration + 600);
      const t = Math.min(1, this.elapsed / this.duration);
      const rates = { linear: Rate.linear(), smooth: Rate.smooth(), cubic: Rate.easeInOutCubic(), bounce: Rate.easeOutBounce() };
      const rate = rates[this.easing as keyof typeof rates];
      this.dots[0].move([-4 + 8 * t, 1, 0]);
      this.dots[1].move([-4 + 8 * rate(t), -1, 0]);
      this.invalidate();
    });
  }
  setParameter(name: string, value: number | string) {
    if (name === 'duration') this.duration = Number(value);
    if (name === 'easing') this.easing = String(value);
    this.elapsed = 0;
  }
}
