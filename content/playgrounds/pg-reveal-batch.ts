import { BatchIntroduce, CameraModel, Circle, FadeIn, GrowFromCenter, Rect, Scene, hex } from 'retiam';

/** Two different entrance animations form one awaited batch. */
export default class RevealBatchScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const circle = new Circle(0.65, { fill: hex('#38bdf8') }).move([-1.7, 0, 0]);
    const square = new Rect(1.3, 1.3, { fill: hex('#f59e0b') }).move([1.7, 0, 0]);
    this.add(circle, square);
    await this.play(new BatchIntroduce([new FadeIn(circle), new GrowFromCenter(square)], { lagRatio: 0.3, duration: 1800 }));
    await this.wait(1600);
  }
}
