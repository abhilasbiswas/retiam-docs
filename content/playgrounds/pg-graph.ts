import { Scene, CameraModel, hex } from 'retiam';
import { Graph, DarkModernGraphTheme } from 'retiam/graphs';

/** One directed graph with three nodes and two edges. */
export default class GraphExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 9;

    const graph = new Graph({ theme: DarkModernGraphTheme, isDirected: true });
    graph.addNode('A', { radius: 0.65 });
    graph.addNode('B', { radius: 0.65 });
    graph.addNode('C', { radius: 0.65 });
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.applyLayout({ A: [-3.5, 0], B: [0, 0], C: [3.5, 0] });

    this.add(graph);
    this.camera.frame(graph, { padding: 0.3 });
    await this.wait(2200);
  }
}
