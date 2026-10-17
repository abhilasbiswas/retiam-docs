import { CameraModel, Component, ComputeKernel, Res, Scene, Shader, hex } from 'retiam';

/** A single compute workgroup writes a four-by-four color grid, which the fragment shader reads. */
export default class ComputeTinyGridScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const pixels=this.device.createBuffer({size:16*16,usage:GPUBufferUsage.STORAGE});
    const kernel=new ComputeKernel({pixels:Res.buffer('array<vec4f>',pixels,'read_write')},`
     let i=global_id.x;if(i>=16u){return;}
     let checker=f32((i%4u+i/4u)%2u);
     pixels[i]=mix(vec4f(0.22,0.74,0.97,1),vec4f(0.96,0.62,0.04,1),checker);
    `,[16,1,1]);
    const output=new Shader(4,4,'let c=min(vec2u(input.uv*4.0),vec2u(3u)); finalColor=pixels[c.y*4u+c.x];');
    output.setStorageBuffer('pixels','array<vec4f>',pixels,'read');
    class Owner extends Component{onDestroy(){pixels.destroy();}}output.addComponent(new Owner());this.add(output);
    this.addCompute(kernel.dispatch(this.device,1));await this.wait(3400);
  }
}
