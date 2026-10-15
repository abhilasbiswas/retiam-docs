export default class FormulaScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const equation = new Tex("e^{i\\pi} + 1 = 0", { fontSize: 1.1, fill: hex("#E2E8F0") });
    this.add(equation);
    let aspect = 0;
    this.always(() => {
      const next = this.canvas.width / this.canvas.height;
      if (next !== aspect) { aspect = next; this.camera.frame(equation, { padding: 0.6 }); }
    }, { phase: 'pre' });
    await this.play(new Write(equation, { duration: 2200 }));
    await this.wait(1000);
  }
}
