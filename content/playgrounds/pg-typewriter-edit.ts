import { CENTER, CameraModel, Scene, Text, Typewriter, hex } from 'retiam';

/** Typewriter edits one word using explicit type, pause, and delete steps. */
export default class TypewriterEditScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const text = new Text('', { fontSize: 0.8, anchor: CENTER, fill: hex('#38bdf8') });
    this.add(text);
    await this.play(new Typewriter(text, [
      { op: 'type', text: 'Hello!', charDelay: 120 },
      { op: 'pause', duration: 700 },
      { op: 'delete', count: 1 },
      { op: 'type', text: ', Retiam.', charDelay: 100 }
    ], { cursor: 'pipe', defaultJitter: 0 }));
    await this.wait(1500);
  }
}
