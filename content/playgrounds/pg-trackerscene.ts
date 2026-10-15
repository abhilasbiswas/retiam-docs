export default class TrackerScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const frequency = new ValueTracker(1);
    const axes = new Axes({ xRange: [-4, 4, 1], yRange: [-2, 2, 1], width: 8, height: 4, showGrid: true, gridColor: hex('#334155', 0.4), axisColor: hex('#64748b'), showLabels: false });
    const graph = new FunctionGraph2D(axes, (x) => Math.sin(frequency.value * x), { primitive: "path", stroke: hex("#38BDF8"), strokeWidth: 0.07 });
    this.add(axes, graph);
    this.always(() => graph.updateGraph(), { phase: "update" });
    await this.play(frequency.animateValue(3), { duration: 3500 });
    await this.wait(800);
  }
}
