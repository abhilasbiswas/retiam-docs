import { CameraModel, Scene, hex } from 'retiam';
import { Graph, Layouts, DarkModernGraphTheme } from 'retiam/graphs';

/** The same four-node graph uses a force placement. */
export default class GraphForceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const graph = new Graph({isDirected:true,theme:DarkModernGraphTheme});
    const ids = ['A','B','C','D'];
    for(const id of ids) graph.addNode(id,{radius:0.45});
    const edges=[{source:'A',target:'B'},{source:'A',target:'C'},{source:'B',target:'D'},{source:'C',target:'D'}];
    for(const edge of edges) graph.addEdge(edge.source,edge.target);
    graph.applyLayout(Layouts.forceDirected(ids,edges,{width:5,height:3,iterations:100,seed:7}));this.add(graph);this.camera.frame(graph,{padding:0.45});await this.wait(3200);
  }
}
