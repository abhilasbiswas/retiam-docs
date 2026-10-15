import { Scene, CameraModel, TextureAtlas, Sprite, hex } from 'retiam';
import type { TexturePackerManifest } from 'retiam';

/** Extract one named frame from one two-cell texture atlas. */
export default class TextureAtlasExample extends Scene {
  async run() {
    this.clearColor(hex('#080c14'));
    this.camera.model = CameraModel.ORTHOGRAPHIC;
    this.camera.position.set([0, 0, 20]);
    this.camera.orthoScale = 7;

    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#38bdf8'; context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#f59e0b'; context.fillRect(64, 0, 64, 64);
    const manifest: TexturePackerManifest = {
      meta: { size: { w: 128, h: 64 } },
      frames: {
        cyan: { frame: { x: 0, y: 0, w: 64, h: 64 } },
        amber: { frame: { x: 64, y: 0, w: 64, h: 64 } },
      },
    };
    const atlas = await TextureAtlas.load(canvas, manifest);
    const frame = new Sprite(4, 4, atlas.getTexture('amber')!);
    this.add(frame);
    await this.wait(2400);
  }
}
