import { Axes, CameraModel, Scene, Streamlines2D, hex } from 'retiam';

/** Short particle traces follow a simple rotational field. */
export default class FieldStreamlinesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const trails = new Streamlines2D(axes, (x, y) => [-y, x], { numLines: 20, maxLength: 30, speed: 0.8, colorPalette: [hex('#38bdf8')] });
    this.add(axes, trails);
    await this.wait(4500);
  }
}
