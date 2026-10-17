import { AnnotationDot, CameraModel, Create, Scene, hex } from 'retiam';

/** An outlined dot marks one annotation point. */
export default class PrimitiveAnnotationdotScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const shape = new AnnotationDot([0, 0, 0], { radius: 0.45, fill: hex('#38bdf8'), stroke: hex('#e2e8f0') });
    this.add(shape);
    await this.play(new Create(shape), { duration: 1200 });

    await this.wait(1800);
  }
}
