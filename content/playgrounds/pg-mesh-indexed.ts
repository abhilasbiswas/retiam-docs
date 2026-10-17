import { CameraModel, Circle, Line, Mesh2D, Scene, hex } from 'retiam';

/** Four visible vertices and two indexed triangles form one rectangle. */
export default class MeshIndexedScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const vertices=[-2,-1,2,-1,2,1,-2,1],indices=[0,1,2,0,2,3];
    const mesh=new Mesh2D(vertices,indices,{fill:hex('#38bdf8',0.3)});this.add(mesh,new Line([[-2,-1],[2,1]],{stroke:hex('#f59e0b'),strokeWidth:0.04}));
    for(let i=0;i<4;i++)this.add(new Circle(0.09,{fill:hex('#f59e0b')}).move([vertices[i*2],vertices[i*2+1],0]));await this.wait(3400);
  }
}
