import { CENTER, CameraModel, Circle, Instanced, InteractionManager, SDFText, Scene, Vec3, hex } from 'retiam';

/** Each clicked instance reports its real raycast instance index. */
export default class PickingInstanceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    new InteractionManager(this);
    const instances=new Instanced(new Circle(0.4,{fill:hex('#38bdf8')}),5);for(let i=0;i<5;i++)instances.setInstancePosition(i,new Vec3((i-2)*1.4,0,0));instances.updateInstances();
    const label=new SDFText('Click an instance',{fontSize:0.4,anchor:CENTER}).move([0,1.6,0]);this.add(instances,label);
    instances.setEvent('click',(_event:PointerEvent,hit?:{instanceId?:number})=>{if(hit?.instanceId===undefined)return;label.setText('Instance '+hit.instanceId);this.invalidate();});await this.wait(7000);
  }
}
