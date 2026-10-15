export default class FirstScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const circle = new Circle(1, { fill: hex("#38BDF8"), stroke: hex("#E2E8F0"), strokeWidth: 0.06 });
    circle.move([-2, 0, 0]);
    this.add(circle);
    await this.play(new Create(circle, { duration: 1000 }));
    await this.play(circle.animate.move([2, 0, 0]), { duration: 1600, rate_func: Rate.easeInOutCubic() });
    await this.wait(1400);
    await this.play(new FadeOut(circle, { duration: 600 }));
  }
}
