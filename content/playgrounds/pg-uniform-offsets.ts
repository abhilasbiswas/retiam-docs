import { CENTER, CameraModel, Component, SDFText, Scene, Shader, UniformBufferData, UniformSchema, hex } from 'retiam';
import { DataType } from 'retiam';

/** A real schema packs a scalar, vector, and color; its byte offsets appear beside the shader output. */
export default class UniformOffsetsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const schema=new UniformSchema('Sample',{amount:DataType.f32,offset:DataType.vec2f,color:DataType.vec4f});
    const data=new UniformBufferData(schema);data.set('amount',0.65);data.set('offset',[0.5,0.5]);data.set('color',[0.22,0.74,0.97,1]);
    const buffer=this.device.createBuffer({size:schema.byteSize,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(buffer,0,data.buffer);
    const output=new Shader(4,3,'finalColor = vec4f(sample.color.rgb * sample.amount, 1.0);',{userFunctions:schema.generateWGSL(0,0,false)}).move([-1.5,0,0]);
    output.setUniformBuffer('sample','Sample',buffer);
    class Owner extends Component { onDestroy(){buffer.destroy();} }
    output.addComponent(new Owner());
    const labels=new SDFText([...schema.offsets].map(([name,offset])=>name+': '+offset+' B').join('\n')+'\nsize: '+schema.byteSize+' B',{fontSize:0.33,anchor:CENTER}).move([2.3,0,0]);
    this.add(output,labels);await this.wait(3600);
  }
}
