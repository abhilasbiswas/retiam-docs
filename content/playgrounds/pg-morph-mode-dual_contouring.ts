import { CameraModel, CustomAnimation, Math3D, Model, MorphMode, MorphModel, Scene, hex } from 'retiam';

/** Two small meshes isolate the DUAL_CONTOURING morph representation. */
export default class MorphModeDual_contouringScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.PERSPECTIVE;
    this.camera.position.set([5, 3.5, 10]);
    this.camera.lookAt([0, 0, 0]);

    const mesh=Math3D.createSphere(1.15,12,8);
    const targetVertices=new Float32Array(mesh.vertices);
    for(let i=0;i<targetVertices.length;i+=3){targetVertices[i]*=1.5;targetVertices[i+1]*=0.65;}
    const morph=new MorphModel(new Model(mesh,{color:hex('#38bdf8')}),new Model({...mesh,vertices:targetVertices},{color:hex('#f59e0b')}),{mode:MorphMode.DUAL_CONTOURING,particleCount:320,particleSize:0.035,noiseStrength:0,sdfResolution:16});
    this.add(morph);this.camera.frame([[-2,-1.5,-1.5],[2,1.5,1.5]],{padding:0.45});
    await this.wait(700);await this.play(new CustomAnimation(t=>morph.setWeight(t),{duration:2600}));await this.wait(1200);
  }
}
