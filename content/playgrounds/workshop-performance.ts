import { Scene, Circle, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

export default class PerformanceWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    this.camera.orthoScale = 8;
    new InteractionManager(this);
    const count = 120;
    const dots: Circle[] = [];
    for (let i = 0; i < count; i++) {
      const dot = new Circle(0.045, { fill: hex('#38bdf8') }); dots.push(dot); this.add(dot);
    }
    const label = new SDFText('Click to freeze the retained entities', { fontSize: 0.33, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 3.1, 0]); this.add(label);
    let running = true, elapsed = 0;
    label.setEvent('click', () => { running = !running; });
    this.always((_time, dt) => {
      if (!running) return;
      elapsed += dt / 1000;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399963 + elapsed * 0.25;
        const radius = 2.5 * Math.sqrt((i + 1) / count);
        dots[i].move([radius * Math.cos(angle), radius * Math.sin(angle), 0]);
      }
    });
  }
}
