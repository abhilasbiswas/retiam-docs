import { CameraModel, Scene, Sprite, TextureAtlas, hex } from 'retiam';

/** The left sprite preserves a square atlas cell; the right stretches that cell into a rectangle. */
export default class SpriteAspectScene extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = Math.max(6.5, 10 / (this.canvas.width / this.canvas.height));

    const sheet = document.createElement('canvas'); sheet.width = 256; sheet.height = 64;
    const ctx = sheet.getContext('2d')!;
    for (let i = 0; i < 4; i++) {
     ctx.fillStyle = '#0f172a'; ctx.fillRect(i * 64, 0, 64, 64);
     ctx.fillStyle = i % 2 ? '#f59e0b' : '#38bdf8';
     ctx.beginPath(); ctx.arc(i * 64 + 16 + i * 10, 32, 10, 0, Math.PI * 2); ctx.fill();
    }
    const atlas = TextureAtlas.fromGrid(sheet, 4, 1, 64, 64, 256, 64);

    const square = new Sprite(2.4, 2.4, atlas.getTexture(1)!).move([-2, 0, 0]);
    const stretched = new Sprite(3, 1.2, atlas.getTexture(1)!).move([2, 0, 0]);
    this.add(square, stretched);
    await this.wait(3200);
  }
}
