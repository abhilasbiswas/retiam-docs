import { CameraModel, CustomAnimation, MeshSprite, Scene, Vec3, hex } from 'retiam';

/** A small checker image bends with a subdivided mesh while its UV coordinates follow the surface. */
export default class MeshSpriteScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){ctx.fillStyle=(x+y)%2?'#38bdf8':'#1e293b';ctx.fillRect(x*16,y*16,16,16);}
    const image=new MeshSprite({source:canvas,width:4,height:3,gridResolution:[12,8]});this.add(image);
    await this.play(new CustomAnimation(t=>image.applyFunction(p=>new Vec3(p.x,p.y+Math.sin(p.x*2)*0.5*t,p.z)),{duration:2400}));await this.wait(1200);
  }
}
