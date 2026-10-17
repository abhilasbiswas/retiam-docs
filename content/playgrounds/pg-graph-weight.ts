import { CameraModel, Scene, hex } from 'retiam';
import { Graph, Layouts, DarkModernGraphTheme } from 'retiam/graphs';

/** Two nodes share one directed edge with a weight label. */
export default class GraphWeightScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const graph=new Graph({isDirected:true,theme:DarkModernGraphTheme});
    graph.addNode('A',{radius:0.6});graph.addNode('B',{radius:0.6});
    const edge=graph.addEdge('A','B',{label:'3'});
    graph.applyLayout({A:[-2,0],B:[2,0]});this.add(graph);
    await this.wait(1200);edge.setLabel('5');this.invalidate();await this.wait(1800);
  }
}
