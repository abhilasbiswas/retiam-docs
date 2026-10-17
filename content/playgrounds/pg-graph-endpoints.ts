import { CameraModel, Scene, hex } from 'retiam';
import { Graph, Layouts, DarkModernGraphTheme } from 'retiam/graphs';

/** One moved node updates its incident edges after each animation frame. */
export default class GraphEndpointsScene extends Scene {
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

    graph.applyLayout({A:[-2,0],B:[0,1.2],C:[0,-1.2],D:[2,0]});this.add(graph);
    this.always(()=>graph.updateAllEdges(),{phase:'post'});
    await this.play(graph.getNode('B')!.animate.move([0,2.1,0]),{duration:2000});await this.wait(1400);
  }
}
