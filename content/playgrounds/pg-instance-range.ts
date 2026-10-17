import { CameraModel, Circle, Instanced, Scene, Vec3, hex } from 'retiam';

/** A stored row of six instances displays a middle range, then the complete range. */
export default class InstanceRangeScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const instances=new Instanced(new Circle(0.3,{fill:hex('#38bdf8')}),6,{firstInstance:2,activeCount:3});
    for(let i=0;i<6;i++)instances.setInstancePosition(i,new Vec3((i-2.5)*1.1,0,0));
    instances.updateInstances();this.add(instances);await this.wait(1400);
    instances.firstInstance=0;instances.activeCount=6;this.invalidate();await this.wait(1800);
  }
}
