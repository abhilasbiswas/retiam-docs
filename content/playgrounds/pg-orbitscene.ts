export default class OrbitScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const center = new Dot([0, 0, 0], { radius: 0.2, fill: hex("#F59E0B") });
    const actor = new Circle(0.5, { fill: hex("#38BDF8") }).move([3, 0, 0]);
    const orbit = new Circle(3, { fill: Color.NONE, stroke: hex("#334155"), strokeWidth: 0.025 });
    this.add(orbit, center, actor);
    await this.play(new OrbitAnimation(actor, center, { angle: Math.PI * 2, duration: 3500, rate_func: Rate.linear() }));
    await this.wait(500);
  }
}
