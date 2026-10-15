export default class ModifierScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const trim = new TrimModifier({ start: 0, end: 0.1 });
    const path = new Path("M -3 -2 Q -3 3 0 2 Q 3 3 3 -2", {
      fill: Color.NONE, stroke: hex("#F59E0B"), strokeWidth: 0.1,
      modifiers: [trim]
    });
    const original = new Path("M -3 -2 Q -3 3 0 2 Q 3 3 3 -2", { fill: Color.NONE, stroke: hex("#334155"), strokeWidth: 0.035 });
    this.add(original, path);
    await this.play(new CustomAnimation((t) => { trim.end = 0.1 + 0.9 * t; trim.invalidate(); }, { duration: 2400 }));
    await this.wait(1400);
  }
}
