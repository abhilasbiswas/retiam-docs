export default class HierarchyScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const parent = new Entity();
    const left = new Circle(0.8, { fill: hex("#38BDF8", 0.18), stroke: hex("#38BDF8"), strokeWidth: 0.05 }).move([-1.5, 0, 0]);
    const right = new Rect(1.5, 1.5, { fill: hex("#F59E0B", 0.18), stroke: hex("#F59E0B"), strokeWidth: 0.05 }).move([1.5, 0, 0]);
    parent.add(left, right);
    this.add(parent);
    await this.play(parent.animate.rotate(Math.PI / 2), { duration: 2400, rate_func: Rate.easeInOutCubic() });
    await this.wait(1400);
  }
}
