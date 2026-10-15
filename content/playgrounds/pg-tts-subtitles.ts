import { Scene, CameraModel, SDFText, CENTER, hex } from 'retiam';
import { Subtitles, speak } from 'retiam/tts';

/** One synthesized sentence with one synchronized subtitle track. */
export default class TTSSubtitlesExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 8;

    const subject = new SDFText('Voice + captions', { fontSize: 0.8, anchor: CENTER, fill: hex('#38bdf8') });
    const subtitles = new Subtitles({ fontSize: 0.5, showBackdrop: true, textColor: hex('#f8fafc') });
    subtitles.setBottomOffset(-3.1);
    this.add(subject, subtitles);
    const sentence = 'This sentence is synthesized and captioned on the same scene timeline.';
    // Keep the caption visible when a browser blocks speech playback, while speak()
    // synchronizes it to audio whenever the provider is available.
    subtitles.showText(sentence);
    await speak(this, sentence, {
      provider: 'msedge', voice: 'en-US-AndrewNeural', speed: 0.96, subtitles,
    });
    await this.wait(800);
  }
}
