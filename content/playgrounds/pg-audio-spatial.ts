import { AudioListenerComponent, AudioPlugin, CENTER, CameraModel, Circle, InteractionManager, Rate, SDFText, Scene, SpatialAudioComponent, hex } from 'retiam';

/** A local looping tone moves past a fixed listener; click to start the sound. */
export default class AudioSpatialScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.use(new AudioPlugin({masterVolume:0.5}));new InteractionManager(this);this.ALWAYS_UPDATE=true;
    this.camera.position.set([0,0,8]);this.camera.lookAt([0,0,0]);
    this.camera.addComponent(new AudioListenerComponent(this.audio));
    const source=new Circle(0.35,{fill:hex('#38bdf8')}).move([-3,0,0]);
    const sound=source.addComponent(new SpatialAudioComponent({src:'/res/media/docs/tone.wav',autoplay:false,volume:0.45,loop:true,refDistance:2,rolloffFactor:1,panningModel:'equalpower'},this.audio));
    this.add(source,new SDFText('Click the source to listen',{fontSize:0.37,anchor:CENTER}).move([0,1.8,0]));
    let moving=false;source.setEvent('click',async()=>{if(moving)return;moving=true;this.audio.resumeContext();sound.play();await this.play(source.animate.move([3,0,0]),{duration:4000,rate_func:Rate.linear()});source.removeComponent(sound);this.invalidate();});
    await this.wait(8000);
  }
}
