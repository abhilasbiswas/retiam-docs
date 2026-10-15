export default class SequenceScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const a = new Circle(0.8, { fill: hex("#38BDF8") }).move([-2, 0, 0]);
    const b = new Rect(1.6, 1.6, { fill: hex("#F59E0B") }).move([2, 0, 0]);
    this.add(a, b);
    await this.play(new Concurrent([new Create(a, { duration: 1200 }), new Create(b, { duration: 1200 })]));
    await this.play(new Sequential([
      new CustomAnimation((t) => { a.move([-2 + 0.9 * t, 0, 0]); }, { duration: 900 }),
      new CustomAnimation((t) => { b.move([2 - 0.9 * t, 0, 0]); }, { duration: 900 })
    ]));
    await this.wait(1600);
  }
}
