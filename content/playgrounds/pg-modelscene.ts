export default class ModelScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const box = new Box(2, 2, 2, { materialColor: hex("#38BDF8"), roughness: 0.45, shading: "manim" });
    this.add(box);
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.fov = Math.PI / 4;
    this.camera.position.set([6, 5, 8]);
    this.camera.lookAt(box);
    // Refit the complete turn on resize, retaining the chosen viewing angle.
    let aspect = 0;
    this.always(() => {
      const next = this.canvas.width / this.canvas.height;
      if (next !== aspect) {
        aspect = next;
        this.camera.frame([[-2, -2, -2], [2, 2, 2]], { padding: 0.28 });
      }
    }, { phase: 'pre' });
    await this.play(box.animate.rotate([0, Math.PI * 2, 0]), { duration: 4000, rate_func: Rate.linear() });
    await this.wait(500);
  }
}
