export default class UpdateScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    this.composer!.ALWAYS_UPDATE = true;
    const dot = new Dot([3, 0, 0], { radius: 0.22, fill: hex("#38BDF8") });
    const guide = new Path("M 3 0 A 3 2 0 1 0 -3 0 A 3 2 0 1 0 3 0", { fill: Color.NONE, stroke: hex("#334155"), strokeWidth: 0.025 });
    this.add(guide, dot);
    this.always((time) => {
      const seconds = time / 1000;
      dot.move([3 * Math.cos(seconds), 2 * Math.sin(seconds), 0]);
    });
    await this.wait(6000);
  }
}
