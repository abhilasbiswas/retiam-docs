import { CameraModel, Circle, FadeIn, Intersection, Scene, hex } from 'retiam';

export default class BooleanScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const a = new Circle(1.8, { fill: hex("#38BDF8", 0.12), stroke: hex("#38BDF8"), strokeWidth: 0.045 }).move([-0.8, 0, 0]);
    const b = new Circle(1.8, { fill: hex("#F59E0B", 0.12), stroke: hex("#F59E0B"), strokeWidth: 0.045 }).move([0.8, 0, 0]);
    this.add(a, b);
    const overlap = new Intersection(a, b, { fill: hex("#38BDF8", 0.7), stroke: hex("#E2E8F0"), strokeWidth: 0.04 });
    overlap.z_index = 0.01;
    this.add(overlap);
    await this.play(new FadeIn(overlap, { duration: 1200 }));
    await this.wait(1000);
  }
}
