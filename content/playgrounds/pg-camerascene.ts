export default class CameraScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const subject = new Box(2, 2, 2, { shading: "manim", materialColor: hex("#F59E0B") });
    this.add(subject);
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.fov = Math.PI / 4;
    this.camera.position.set([6, 4, 9]);
    this.camera.lookAt(subject);
    // Refit the complete turn on resize, retaining the chosen viewing angle.
    let aspect = 0;
    this.always(() => {
      const next = this.canvas.width / this.canvas.height;
      if (next !== aspect) {
        aspect = next;
        this.camera.frame([[-2, -2, -2], [2, 2, 2]], { padding: 0.28 });
      }
    }, { phase: 'pre' });
    await this.play(new CameraMove(this.camera, { position: [0, 3, 7], duration: 2500 }));
    await this.wait(800);
  }
}
