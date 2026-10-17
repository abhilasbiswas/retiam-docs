import { AudioPlugin, CENTER, CameraModel, Color, InteractionManager, NONE, Poly, SDFText, Scene, Vec2, Vec3, hex } from 'retiam';

/** A click starts a local tone; the line displays actual time-domain analyzer samples. */
export default class AudioWaveformScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.use(new AudioPlugin({masterVolume:0.5}));new InteractionManager(this);
    const tone=await this.audio.loader.load('/res/media/docs/tone.wav');
    const analyzer=this.audio.createAnalyzer({fftSize:256,smoothingTimeConstant:0.2});
    const waveform=new Poly(Array.from({length:128},(_,i)=>new Vec2((i/127-0.5)*6,0)),{fill:Color.NONE,stroke:hex('#38bdf8'),strokeWidth:0.04});
    const prompt=new SDFText('Click to hear and inspect the tone',{fontSize:0.37,anchor:CENTER}).move([0,1.8,0]);this.add(waveform,prompt);
    this.setEvent('click',()=>{this.audio.resumeContext();this.audio.timeline.addClip(tone,this.time,this.audio.sfxGain,{bus:'sfx'});});
    this.always(()=>{const data=analyzer.getWaveformData();waveform.setVertices(Array.from({length:128},(_,i)=>new Vec2((i/127-0.5)*6,(data[i]-128)/128*1.3)));},{fps:20});
    await this.wait(7000);
  }
}
