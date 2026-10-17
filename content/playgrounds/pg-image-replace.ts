import { CameraModel, RTImage, Scene, hex } from 'retiam';

/** An RTImage changes source while preserving its scene dimensions. */
export default class ImageReplaceScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const makeImage = (color: string) => {
     const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 120;
     const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,240,120);
     ctx.fillStyle = color; ctx.beginPath(); ctx.arc(120,60,40,0,Math.PI*2); ctx.fill(); return canvas;
    };
    const image = new RTImage(6, 3, makeImage('#38bdf8'));
    this.add(image);
    await this.wait(1000); image.setSource(makeImage('#f59e0b')); this.invalidate();
    await this.wait(1800);
  }
}
