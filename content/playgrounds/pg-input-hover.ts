import { CENTER, CameraModel, Circle, InteractionManager, SDFText, Scene, hex } from 'retiam';

/** One circle demonstrates only hover interaction. */
export default class InputHoverScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    new InteractionManager(this);
    const dot = new Circle(0.75, {fill: hex('#38bdf8')});
    const prompt = new SDFText('Hover over the circle', {fontSize: 0.42, anchor: CENTER}).move([0, 1.8, 0]);
    this.add(dot, prompt);
    dot.setEvent('pointerover', () => { dot.setFill(hex('#f59e0b')); this.invalidate(); });
    dot.setEvent('pointerout', () => {dot.setFill(hex('#38bdf8')); this.invalidate();});
    await this.wait(6000);
  }
}
