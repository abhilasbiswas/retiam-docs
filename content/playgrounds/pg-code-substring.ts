import { CameraModel, Code, Scene, hex } from 'retiam';

/** A three-line program demonstrates one code annotation operation. */
export default class CodeSubstringScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const code = new Code('const radius = 1;\nconst area = Math.PI * radius * radius;\nconsole.log(area);', {fontSize: 0.32, showWindowHeader: false, showLineNumbers: true, padding: 0.25});
    this.add(code);
    this.camera.frame(code, {padding: 0.55});
    await this.wait(800);
    code.highlightText('radius', hex('#f59e0b', 0.35), 2); this.invalidate();
    await this.wait(1800);
  }
}
