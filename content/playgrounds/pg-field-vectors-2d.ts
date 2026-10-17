import { Axes, CameraModel, Scene, VectorField2D, hex } from 'retiam';

/** A small rotational field displays a direction at each sample point. */
export default class FieldVectors2dScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1], width: 7, height: 4, showLabels: false, axisColor: hex('#64748b') });
    const field = new VectorField2D(axes, (x, y) => [-y, x], { xStep: 1, yStep: 1, arrowScale: 0.5, maxMagnitude: 3 });
    this.add(axes, field);
    await this.wait(3300);
  }
}
