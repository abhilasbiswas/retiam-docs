import { Scene, Component, Rect, SDFText, CameraModel, InteractionManager, hex, CENTER } from 'retiam';

class Turntable extends Component {
  constructor(public radiansPerSecond = 0.7) { super(); }
  update(_time: number, dt: number) {
    this.entity.rotate(this.radiansPerSecond * dt / 1000);
  }
}

export default class ComponentWorkshop extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]); this.camera.lookAt([0, 0, 0]);
    this.ALWAYS_UPDATE = true;
    this.camera.orthoScale = 7;
    new InteractionManager(this);
    const tile = new Rect(2.5, 1.5, { fill: hex('#38bdf8') });
    const turntable = tile.addComponent(new Turntable());
    const label = new SDFText('Click to pause the component', { fontSize: 0.35, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 2.5, 0]); this.add(tile, label);
    tile.setEvent('click', () => {
      turntable.enabled = !turntable.enabled;
      label.setText(turntable.enabled ? 'Click to pause the component' : 'Click to resume the component');
    });
  }
}
