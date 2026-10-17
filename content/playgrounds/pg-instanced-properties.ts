import { CameraModel, Instanced, Quaternion, Rect, Scene, Vec3, hex } from 'retiam';

/** Six shared rectangles have independent color, rotation, and nonuniform scale. */
export default class InstancedPropertiesScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const instances=new Instanced(new Rect(0.65,0.65,{fill:hex('#38bdf8')}),6,{layout:'extended'});
    for(let i=0;i<6;i++){
     instances.setInstancePosition(i,new Vec3((i-2.5)*1.15,0,0));
     instances.setInstanceColor(i,hex(i%2?'#f59e0b':'#38bdf8'));
     instances.setInstanceRotation(i,Quaternion.fromAxisAngle(new Vec3(0,0,1),i*0.2));
     instances.setInstanceScale3D(i,new Vec3(1,0.6+i*0.16,1));
    }
    instances.updateInstances();this.add(instances);await this.wait(3200);
  }
}
