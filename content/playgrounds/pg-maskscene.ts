export default class MaskScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const bitmap = document.createElement("canvas");
    bitmap.width = bitmap.height = 256;
    const ctx = bitmap.getContext("2d")!;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? "#F59E0B" : "#38BDF8";
      ctx.fillRect(0, i * 16, 256, 16);
    }
    const content = new Sprite(8, 8, bitmap);
    const mask = new Mask(new SDFText("GPU", { fontSize: 2.0, anchor: CENTER }), content);
    this.add(mask);
    await this.play(content.animate.rotate(Math.PI / 2), { duration: 2400 });
    await this.wait(800);
  }
}
