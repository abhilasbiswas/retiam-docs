import { AudioPlugin, CENTER, CameraModel, Circle, InteractionManager, Rate, SDFText, Scene, hex } from 'retiam';
import { Subtitles } from 'retiam/tts';

/** A frozen local sentence, authored caption timing, and a single movement run on the scene timeline. */
export default class LocalNarrationScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    this.use(new AudioPlugin({masterVolume: 0.65}));
    new InteractionManager(this);
    const dot = new Circle(0.5, {fill: hex('#38bdf8')}).move([-2.5, 0.4, 0]);
    const captions = new Subtitles({preset: 'minimal', fontSize: 0.38, maxWidth: 7, bottomOffset: -2});
    const prompt = new SDFText('Click the circle to begin', {fontSize: 0.4, anchor: CENTER}).move([0, 1.8, 0]);
    this.add(dot, captions, prompt);
    const buffer = await this.audio.loader.load('/res/media/docs/circle-narration.wav');
    let playing = false;
    dot.setEvent('click', async () => {
     if (playing) return; playing = true;
     this.audio.resumeContext(); prompt.setText(''); dot.move([-2.5, 0.4, 0]);
     const start = this.time;
     this.audio.timeline.addClip(buffer, start, this.audio.voiceoverGain, {bus: 'voiceover', volume: 0.8});
     captions.showText('A circle moves from left to right.');
     await this.play(dot.animate.move([2.5, 0.4, 0]), {duration: buffer.duration * 1000, rate_func: Rate.linear()});
     captions.clear(); prompt.setText('Click to replay'); playing = false; this.invalidate();
    });
    await this.wait(6000);
  }
}
