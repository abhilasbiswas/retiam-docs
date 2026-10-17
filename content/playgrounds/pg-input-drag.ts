import { CENTER, CameraModel, Circle, InteractionManager, SDFText, Scene, hex } from 'retiam';

/** One circle demonstrates only drag interaction. */
export default class InputDragScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    new InteractionManager(this);
    const dot = new Circle(0.75, {fill: hex('#38bdf8')});
    const prompt = new SDFText('Drag the circle', {fontSize: 0.42, anchor: CENTER}).move([0, 1.8, 0]);
    this.add(dot, prompt);
    dot.setDraggable(true);
    await this.wait(6000);
  }
}
