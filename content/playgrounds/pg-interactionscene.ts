export default class InteractionScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    new InteractionManager(this);
    const dot = new Circle(1, { fill: hex("#38BDF8") });
    dot.setDraggable(true);
    dot.setEvent("pointerover", () => { dot.setFill(hex("#F59E0B")); this.invalidate(); });
    dot.setEvent("pointerout", () => { dot.setFill(hex("#38BDF8")); this.invalidate(); });
    dot.setEvent("click", () => { dot.scale(1.08); this.invalidate(); });
    this.add(dot);
    await this.wait(1000);
  }
}
