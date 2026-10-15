import { Scene, CameraModel, Axes, Circle, hex } from 'retiam';

/** Axes.c2p and Axes.p2c perform one coordinate round trip. */
export default class AxesConversionExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;

    const axes = new Axes({
      xRange: [-3, 3, 1],
      yRange: [-2, 2, 1],
      width: 8,
      height: 5,
      showGrid: true,
      showLabels: false,
    });
    const scenePoint = axes.c2p(1.5, 1);
    const [x, y] = axes.p2c(scenePoint);
    const marker = new Circle(0.16, { fill: hex('#f59e0b') });
    marker.setPosition(axes.c2p(x, y));
    this.add(axes, marker);
    await this.wait(2600);
  }
}
