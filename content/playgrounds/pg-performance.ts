import { Scene, CameraModel, Circle, SDFText, InteractionManager, hex, CENTER } from 'retiam';

/** One switch isolates CPU transform-update work on retained entities. */
export default class PerformanceExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;
    this.ALWAYS_UPDATE = true;
    new InteractionManager(this);

    const count = 120;
    const dots = Array.from({ length: count }, () => new Circle(0.045, { fill: hex('#38bdf8') }));
    const toggle = new SDFText('Click to pause transform updates', {
      fontSize: 0.32,
      anchor: CENTER,
      fill: hex('#e2e8f0'),
    }).move([0, 3.1, 0]);
    this.add(...dots, toggle);

    let running = true;
    let elapsed = 0;
    toggle.setEvent('click', () => {
      running = !running;
      toggle.setText(running ? 'Click to pause transform updates' : 'Click to resume transform updates');
    });
    this.always((_time, dt) => {
      if (!running) return;
      elapsed += dt * 0.001;
      dots.forEach((dot, index) => {
        const angle = index * 2.399963 + elapsed * 0.25;
        const radius = 2.5 * Math.sqrt((index + 1) / count);
        dot.setPosition([radius * Math.cos(angle), radius * Math.sin(angle), 0]);
      });
    });
    await this.wait(3000);
  }
}
