export default class MorphScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const circle = new Circle(1.8, { fill: hex("#38BDF8", 0.18), strokeWidth: 0.055, stroke: hex("#38BDF8") });
    this.add(circle);
    await this.wait(500);
    await this.play(Morph(circle, new Rect(3.6, 3.6, { fill: hex("#F59E0B", 0.18), strokeWidth: 0.055, stroke: hex("#F59E0B") }), { duration: 2400, rate_func: Rate.easeInOutCubic() }));
    await this.wait(1600);
  }
}
