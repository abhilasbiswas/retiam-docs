export default class SketchScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const card = new Rect(5, 3, { fill: Color.NONE });
    card.toExcalidraw({ preset: "clean", seed: 42, stroke: "#38BDF8", strokeWidth: 0.08, fill: "#38BDF844", fillStyle: "hachure" });
    this.add(card);
    await this.play(new Create(card, { duration: 2000 }));
    await this.wait(1000);
  }
}
