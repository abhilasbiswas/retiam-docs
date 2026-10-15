import { Scene, CameraModel, Circle, SDFText, InteractionManager, AudioPlugin, CustomAnimation, CENTER, hex } from 'retiam';

/** Click one circle to schedule one short tone on the SFX bus. */
export default class AudioCueExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;
    this.use(new AudioPlugin({ masterVolume: 0.8 }));
    new InteractionManager(this);

    const tone = this.makeTone(this.audio.context, 440, 0.3);
    const button = new Circle(1.2, { fill: hex('#38bdf8', 0.25), stroke: hex('#38bdf8'), strokeWidth: 0.07 });
    const label = new SDFText('Click for a 440 Hz tone', { fontSize: 0.32, anchor: CENTER, fill: hex('#e2e8f0') });
    label.move([0, 2, 0]);
    button.setEvent('click', async () => {
      this.audio.timeline.addClip(tone, this.time, this.audio.sfxGain, { volume: 0.8 });
      await this.play(new CustomAnimation(alpha => button.setScale(1 + Math.sin(alpha * Math.PI) * 0.18), { duration: 360 }));
    });
    this.add(button, label);
    await this.wait(3000);
  }

  private makeTone(context: AudioContext, frequency: number, seconds: number) {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / context.sampleRate;
      samples[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-10 * t) * 0.4;
    }
    return buffer;
  }
}
