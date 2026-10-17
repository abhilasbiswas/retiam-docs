import { CENTER, CameraModel, Component, Entity, GBufferRenderTarget, SDFText, Scene, Sprite, hex } from 'retiam';

/** One rasterized triangle writes albedo, normal, position, and depth attachments in a single GPU render pass. */
export default class GbufferChannelsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const target=new GBufferRenderTarget(this.device,{width:128,height:128});
    const module=this.device.createShaderModule({code:`
     struct V{@builtin(position) p:vec4f,@location(0) local:vec3f};
     @vertex fn vs(@builtin(vertex_index) i:u32)->V{
     let points=array<vec2f,3>(vec2f(-0.8,-0.7),vec2f(0.8,-0.7),vec2f(0.0,0.8));
     var o:V;o.local=vec3f(points[i],0.4);o.p=vec4f(o.local,1.0);return o;}
     struct G{@location(0) albedo:vec4f,@location(1) normal:vec4f,@location(2) position:vec4f};
     @fragment fn fs(v:V)->G{var o:G;o.albedo=vec4f(0.22,0.74,0.97,1);o.normal=vec4f(0.5,0.5,1,1);o.position=vec4f(v.local*0.5+0.5,1);return o;}`});
    const pipeline=this.device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format:'rgba8unorm'},{format:'rgba16float'},{format:'rgba16float'}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
    const encoder=this.device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:target.getColorAttachments(),depthStencilAttachment:target.getDepthAttachment()});
    pass.setPipeline(pipeline);pass.draw(3);pass.end();this.device.queue.submit([encoder.finish()]);
    const textures=[target.albedoTexture,target.normalTexture,target.positionTexture],names=['Albedo','Normal','Position'];
    for(let i=0;i<3;i++)this.add(new Sprite(2.1,2.1,textures[i]).move([(i-1)*2.5,0,0]),new SDFText(names[i],{fontSize:0.3,anchor:CENTER}).move([(i-1)*2.5,-1.5,0]));
    class Owner extends Component{onDestroy(){target.destroy();}}const owner=new Entity();owner.addComponent(new Owner());this.add(owner);
    await this.wait(3400);
  }
}
