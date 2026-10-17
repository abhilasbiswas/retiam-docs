import { packInstanceIndex } from 'retiam';
import { CENTER, CameraModel, Circle, Instanced, Rect, SDFText, Scene, Vec3, hex } from 'retiam';

/** The renderer state index of a real instance draw is packed with a local index and stroke flag, then decoded. */
export default class PackedInstanceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const instances=new Instanced(new Circle(0.4,{fill:hex('#38bdf8'),stroke:hex('#f59e0b'),strokeWidth:0.05}),3);
    for(let i=0;i<3;i++)instances.setInstancePosition(i,new Vec3((i-1)*1.5,0.8,0));instances.updateInstances();this.add(instances);await this.wait(700);
    const command=this.composer!.render_queue.find(command=>command.entity===instances);
    if(!command||command.stateIndex===undefined)throw new Error('No prepared instance state index.');
    const packed=packInstanceIndex(command.stateIndex,1,false,true);
    const state=(packed>>>14)&0xffff,local=packed&0x3fff,stroke=(packed>>>30)&1;
    const text=new SDFText('Packed: '+packed+' → state '+state+', local '+local+', stroke '+stroke,{fontSize:0.29,anchor:CENTER}).move([0,-1.3,0]);this.add(text);
    for(let bit=0;bit<32;bit++)this.add(new Rect(0.16,0.35,{fill:hex((packed>>>(31-bit))&1?(bit<2?'#e2e8f0':bit<18?'#38bdf8':'#f59e0b'):'#1e293b')}).move([(bit-15.5)*0.2,-0.3,0]));await this.wait(2800);
  }
}
