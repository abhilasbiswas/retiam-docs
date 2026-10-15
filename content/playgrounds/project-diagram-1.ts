import { Scene, Circle, Line, SDFText, CameraModel, hex, CENTER } from 'retiam';

export default class DiagramProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    const a = new Circle(0.7, { fill: hex('#38bdf8') }); a.move([-2, 0, 0]);
    const b = new Circle(0.7, { fill: hex('#f59e0b') }); b.move([2, 0, 0]);
    const edge = new Line([a.getPosition(), b.getPosition()], { stroke: hex('#94a3b8'), strokeWidth: 0.05 });
    const labels = ['Input', 'Output'].map(text => new SDFText(text, { fontSize: 0.32, anchor: CENTER, fill: hex('#e2e8f0') }));
    [a, b].forEach((node, i) => {
      const position = node.getPosition(); labels[i].move([position.x, position.y - 1.1, 0]);
    });
    this.add(edge, a, b, ...labels);
  }
}
