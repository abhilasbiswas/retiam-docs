export default class PlotScene extends Scene {
  async run() {
    this.clearColor(hex("#080C14"));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 12;
    this.camera.position.set([0, 0, 20]);
    this.camera.lookAt([0, 0, 0]);

    const axes = new Axes({ xRange: [-4, 4, 1], yRange: [-2, 2, 1], width: 8, height: 4, showGrid: true, gridColor: hex('#334155', 0.4), axisColor: hex('#64748b'), showLabels: false, primitive: "path" });
    const graph = new FunctionGraph2D(axes, (x) => Math.sin(x), { primitive: "path", stroke: hex("#38BDF8"), strokeWidth: 0.07 });
    const point = axes.getDot([1, Math.sin(1)], { radius: 0.16, fill: hex("#F59E0B") });
    this.add(axes, graph, point);
    await this.play(new Create(graph, { duration: 1800 }));
    await this.wait(800);
  }
}
