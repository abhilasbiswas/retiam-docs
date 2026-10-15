import { Scene, Circle, Line, SDFText, CameraModel, InteractionManager, Vec3, hex, CENTER } from 'retiam';

export default class DiagramProject extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.orthoScale = 9; this.camera.position.set([0, 0, 20]);
    const a = new Circle(0.7, { fill: hex('#38bdf8') }); a.move([-2, 0, 0]);
    const b = new Circle(0.7, { fill: hex('#f59e0b') }); b.move([2, 0, 0]);
    const edge = new Line([[-2, 0], [2, 0]], { stroke: hex('#94a3b8'), strokeWidth: 0.05 });
    const labels = ['Input', 'Output'].map(text => new SDFText(text, { fontSize: 0.32, anchor: CENTER, fill: hex('#e2e8f0') }));
    labels[0].move([-2, -1.1, 0]); labels[1].move([2, -1.1, 0]);
    this.add(edge, a, b, ...labels);
    new InteractionManager(this);
    [a, b].forEach(node => {
      node.setDraggable(true);
      node.setEvent('drag', (position: Vec3) => {
        node.move(position); this.invalidate();
      });
    });
    this.always(() => {
      const pa = a.getPosition(), pb = b.getPosition();
      edge.setVertices([pa, pb]);
      labels[0].move(pa.add([0, -1.1, 0])); labels[1].move(pb.add([0, -1.1, 0]));
    }, { phase: 'post' });
  }
}
