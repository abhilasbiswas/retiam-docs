import { CameraModel, Component, PingPongRenderTarget, Scene, Sprite, hex } from 'retiam';

/** Two actual GPU textures exchange read and write roles after each compute update. */
export default class PingpongScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const targets=new PingPongRenderTarget(this.device,{width:32,height:32,format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST});
    const pixels=new Uint8Array(32*32*4);for(let i=0;i<32*32;i++){pixels[i*4]=i%32<16?56:245;pixels[i*4+1]=i%32<16?189:158;pixels[i*4+2]=i%32<16?248:11;pixels[i*4+3]=255;}
    this.device.queue.writeTexture({texture:targets.readTexture},pixels,{bytesPerRow:128},{width:32,height:32});
    const module=this.device.createShaderModule({code:`
     @group(0) @binding(0) var source:texture_2d<f32>;
     @group(0) @binding(1) var dest:texture_storage_2d<rgba8unorm,write>;
     @compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
     if(any(id.xy>=vec2u(32u))){return;}
     let p=vec2i((id.x+31u)%32u,id.y);textureStore(dest,vec2i(id.xy),textureLoad(source,p,0));
     }`});
    const pipeline=this.device.createComputePipeline({layout:'auto',compute:{module,entryPoint:'main'}});
    const output=new Sprite(4,4,targets.readTexture);this.add(output);
    class Owner extends Component{onDestroy(){targets.destroy();}}output.addComponent(new Owner());
    this.always(()=>{
     const bind=this.device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:targets.readView},{binding:1,resource:targets.writeView}]});
     const encoder=this.device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(4,4);pass.end();this.device.queue.submit([encoder.finish()]);
     targets.swap();output.setSource(targets.readTexture);
    },{interval:200,times:16});await this.wait(4200);
  }
}
