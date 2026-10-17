import { AnimatedSprite, CameraModel, Scene, TextureAtlas, hex } from 'retiam';

/** An atlas advances four deliberately distinct frames, pauses, and resumes. */
export default class SpriteAnimationScene extends Scene {
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

    const sprite = new AnimatedSprite(atlas, atlas.getTexture(0)!, 3);
    sprite.updateSize(3, 3); this.add(sprite); this.ALWAYS_UPDATE = true;
    sprite.playAnimation(atlas.getFrameNames(), 3, true);
    await this.wait(1600); sprite.stopAnimation();
    await this.wait(1000); sprite.resumeAnimation();
    await this.wait(1600);
  }
}
