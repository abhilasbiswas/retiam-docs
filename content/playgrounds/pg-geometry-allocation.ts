import { CENTER, CameraModel, GlobalGeometryAllocator, SDFText, Scene, Triangle, hex } from 'retiam';

/** A small real allocator reports its returned vertex ranges before and after reuse. */
export default class GeometryAllocationScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const allocator=new GlobalGeometryAllocator(undefined,16,24);
    const vertices=[-1,-1,1,-1,0,1],indices=[0,1,2];
    const first=allocator.allocateAndWrite(vertices,indices);
    const second=allocator.allocateAndWrite(vertices,indices);
    const label=new SDFText('A: '+first.vertexStartIndex+' / B: '+second.vertexStartIndex,{fontSize:0.4,anchor:CENTER}).move([0,-1.5,0]);
    const a=new Triangle([[-1,-1],[1,-1],[0,1]],{fill:hex('#38bdf8')}).move([-1.7,0,0]);
    const b=new Triangle([[-1,-1],[1,-1],[0,1]],{fill:hex('#f59e0b')}).move([1.7,0,0]);this.add(a,b,label);
    await this.wait(1100);allocator.free(first);a.VISIBILITY=false;this.invalidate();
    await this.wait(800);const replacement=allocator.allocateAndWrite(vertices,indices);a.VISIBILITY=true;
    label.setText('Freed A, replacement starts at '+replacement.vertexStartIndex);this.invalidate();
    await this.wait(1800);allocator.free(second);allocator.free(replacement);allocator.destroy();
  }
}
