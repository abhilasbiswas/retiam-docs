export default class LayoutScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const title = new SDFText("Measure before placing", { fontSize: 0.52, anchor: CENTER, fill: hex("#E2E8F0") });
    const circle = new Circle(1, { fill: hex("#38BDF8", 0.18), stroke: hex("#38BDF8"), strokeWidth: 0.045 });
    const box = new Rect(2.6, 0.9, { fill: hex("#F59E0B", 0.18), stroke: hex("#F59E0B"), strokeWidth: 0.045 });
    VBox.arrange<Entity>({ gap: 0.7, center: [0, 0, 0] }, title, circle, box);
    this.add(title, circle, box);
    // Refit only when the viewport changes, without following animated bounds.
    let aspect = 0;
    this.always(() => {
      const next = this.canvas.width / this.canvas.height;
      if (next !== aspect) { aspect = next; this.camera.frame([title, circle, box], { padding: 0.5 }); }
    }, { phase: 'pre' });
    await this.play(new Write(title, { duration: 1000 }));
    await this.play(new Create(circle, { duration: 800 }));
    await this.play(new FadeIn(box, { duration: 700 }));
    await this.wait(1400);
  }
}
