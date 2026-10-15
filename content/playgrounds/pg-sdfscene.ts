export default class SDFScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const shape = new SDFSphere(1.8).subtract(new SDFBox(2.2, 2.2, 4));
    const volume = new SDFEntity3D(shape);
    volume.material.color = hex("#38BDF8");
    volume.material.roughness = 0.4;
    this.add(volume);
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.fov = Math.PI / 4;
    this.camera.position.set([5, 4, 7]);
    this.camera.lookAt(volume);
    // Refit the complete turn on resize, retaining the chosen viewing angle.
    let aspect = 0;
    this.always(() => {
      const next = this.canvas.width / this.canvas.height;
      if (next !== aspect) {
        aspect = next;
        this.camera.frame([[-2, -2, -2], [2, 2, 2]], { padding: 0.28 });
      }
    }, { phase: 'pre' });
    await this.play(volume.animate.rotate([0, Math.PI, 0]), { duration: 3500 });
    await this.wait(700);
  }
}
