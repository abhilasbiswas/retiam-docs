import { CameraModel, Component, ComputeStorageTexture, Scene, Sprite, hex } from 'retiam';

/** A compute shader writes an eight-by-eight checker pattern directly into a sampled storage texture. */
export default class StorageTextureScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const target=new ComputeStorageTexture(this.device,{width:8,height:8,format:'rgba8unorm'});
    const module=this.device.createShaderModule({code:`@group(0) @binding(0) var output:texture_storage_2d<rgba8unorm,write>;
    @compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) p:vec3u){let c=f32((p.x+p.y)%2u);textureStore(output,vec2i(p.xy),mix(vec4f(0.22,0.74,0.97,1),vec4f(0.96,0.62,0.04,1),c));}`});
    const pipeline=this.device.createComputePipeline({layout:'auto',compute:{module,entryPoint:'main'}});
    const bind=this.device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:target.storageView}]});
    const encoder=this.device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(1);pass.end();this.device.queue.submit([encoder.finish()]);
    const output=new Sprite(4,4,target.texture);class Owner extends Component{onDestroy(){target.destroy();}}output.addComponent(new Owner());this.add(output);await this.wait(3400);
  }
}
