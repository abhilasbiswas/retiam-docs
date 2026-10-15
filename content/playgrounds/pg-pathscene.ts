export default class PathScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const path = new Path("M -3 -1 Q 0 4 3 -1", {
      fill: Color.NONE, stroke: hex("#38BDF8"), strokeWidth: 0.09,
      method: "analytical"
    });
    this.add(path);
    await this.play(new Create(path, { duration: 1800 }));
    await this.wait(1400);
    // Keep the first contour as a quiet reference for the vertex update.
    const original = new Path("M -3 -1 Q 0 4 3 -1", { fill: Color.NONE, stroke: hex("#334155"), strokeWidth: 0.035 });
    this.add(original);
    path.setVertices("M -3 1 Q 0 -4 3 1", false);
    this.invalidate();
    await this.wait(1400);
  }
}
