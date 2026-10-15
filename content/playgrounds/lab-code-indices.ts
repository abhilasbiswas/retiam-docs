import { Scene, Code, CameraModel, hex } from 'retiam';

export default class CodeIndicesScene extends Scene {
  async run() {
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.clearColor(hex('#090e1b'));

    const display = new Code(
      'const amount = 12;\nconst double = amount * 2;\nconsole.log(double);',
      { language: 'typescript', startLineNumber: 40, showLineNumbers: true }
    );
    this.add(display);

    // Displayed line 41 is the second source row.
    display.highlightLine(41);
    // Occurrence counts across the source, independently of line numbering.
    display.highlightText('amount', undefined, 2);
    // Columns 6..12 select "amount" on the first row; end is exclusive.
    const name = display.extractTextByIndices(40, 6, 12);
    if (name) {
      // This Code is at local origin with no transform. Detach the copy so
      // its movement can leave the code window and its clipping group.
      display.scrollGroup.remove(name);
      this.add(name);
    }

    this.camera.frame([display], { padding: 0.5 });
    if (name) {
      await this.play(name.animate.shift([0, display.fontSize * 4, 0]), {
        duration: 900
      });
    }
  }
}
