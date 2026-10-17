import { AudioPlugin, CENTER, CameraModel, InteractionManager, SDFText, Scene, hex } from 'retiam';

/** A local tone serves as a music bed; a frozen sentence ducks and restores its gain. */
export default class AudioDuckingScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.use(new AudioPlugin({masterVolume:0.5,bgmVolume:0.5}));new InteractionManager(this);
    const prompt=new SDFText('Click to compare music and narration',{fontSize:0.38,anchor:CENTER}).move([0,1.8,0]);
    const readout=new SDFText('Music bus',{fontSize:0.4,anchor:CENTER});this.add(prompt,readout);
    let busy=false;
    this.setEvent('click',async()=>{
     if(busy)return;busy=true;this.audio.resumeContext();
     await this.audio.playBGM('/res/media/docs/tone.wav',{volume:0.2,loop:true});
     await this.wait(800);await this.audio.playVoiceover('/res/media/docs/circle-narration.wav',{duckingRatio:0.15,fadeDurationMs:200});
     await this.wait(800);this.audio.stopBGM(200);busy=false;
    });
    this.always(()=>readout.setText('Music gain: '+this.audio.bgmGain.gain.value.toFixed(2)),{interval:80});await this.wait(8000);
  }
}
