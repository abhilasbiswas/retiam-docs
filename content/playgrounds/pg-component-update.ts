import { Scene, Component, CameraModel, Rect, Color, hex } from 'retiam';

class Spin extends Component {
  update(_time: number, dt: number) {
    this.entity.rotate(dt * 0.001);
  }
}

/** One Component.update method rotates one rectangle. */
export default class ComponentUpdateExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.ALWAYS_UPDATE = true;

    const tile = new Rect(2.5, 1.2, {
      fill: Color.NONE,
      stroke: hex('#38bdf8'),
      strokeWidth: 0.08,
    });
    tile.addComponent(new Spin());
    this.add(tile);
    await this.wait(3000);
  }
}
