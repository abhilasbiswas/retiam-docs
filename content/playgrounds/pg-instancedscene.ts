export default class InstancedScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const field = new Instanced(new Circle(0.16, { fill: hex("#38BDF8") }), 64);
    for (let i = 0; i < 64; i++) {
      field.setInstancePosition(i, new Vec3((i % 8 - 3.5) * 0.7, (Math.floor(i / 8) - 3.5) * 0.7, 0));
      field.setInstanceColor(i, i % 2 ? hex("#F59E0B") : hex("#38BDF8"));
    }
    field.updateInstances();
    this.add(field);
    await this.play(field.animate.rotate(Math.PI / 2), { duration: 2500 });
    await this.wait(800);
  }
}
