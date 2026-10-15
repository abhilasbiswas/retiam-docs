import { Scene, CameraModel, Circle, InteractionManager, hex } from 'retiam';

/** One scene-level click handler moves one marker to the clicked world position. */
export default class SceneEventExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    new InteractionManager(this);

    const marker = new Circle(0.35, { fill: hex('#38bdf8') });
    this.add(marker);
    this.setEvent('click', (position) => {
      marker.move([position.x, position.y, 0]);
      this.invalidate();
    });
    await this.wait(3600);
  }
}
