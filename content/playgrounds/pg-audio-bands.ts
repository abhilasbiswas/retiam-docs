import { AudioPlugin, CENTER, CameraModel, InteractionManager, Rect, SDFText, Scene, hex } from 'retiam';

/** A local tone drives real bass, mid, and treble energy bars. */
export default class AudioBandsScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.use(new AudioPlugin({masterVolume:0.5}));new InteractionManager(this);
    const tone=await this.audio.loader.load('/res/media/docs/tone.wav');
    const analyzer=this.audio.createAnalyzer({fftSize:512});
    const names=['bass','mid','treble'] as const;
    const bars=names.map((name,i)=>{const bar=new Rect(0.7,1,{fill:hex('#38bdf8')}).move([(i-1)*1.6,-0.5,0]);this.add(bar,new SDFText(name,{fontSize:0.32,anchor:CENTER}).move([(i-1)*1.6,-1.5,0]));return bar;});
    this.add(new SDFText('Click to analyze a 440 Hz tone',{fontSize:0.36,anchor:CENTER}).move([0,1.8,0]));
    this.setEvent('click',()=>{this.audio.resumeContext();this.audio.timeline.addClip(tone,this.time,this.audio.sfxGain,{bus:'sfx'});});
    this.always(()=>{const bands=analyzer.getBands();names.forEach((name,i)=>{const height=Math.max(0.04,bands[name]*2.4);bars[i].setScale([1,height,1]);bars[i].move([(i-1)*1.6,-1+height/2,0]);});},{fps:20});
    await this.wait(7000);
  }
}
