import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
// File: examples/demos/media_textures/texture_atlas.ts

import { Scene } from "retiam";
import { OrbitCameraController } from "retiam";
import { Color } from "retiam";
import { Vec3 } from "retiam";
import { Math3D } from "retiam";
import { Model } from "retiam";
import { Sprite } from "retiam";
import { AnimatedSprite } from "retiam";
import { TextureAtlas, TexturePackerManifest } from "retiam";
import { light } from "retiam";

/**
 * Procedurally generates a clean, vibrant 512x512 Texture Atlas Sprite Sheet.
 * Contains 4 distinct stylized gemstone icons with glows and facets.
 */
function createAestheticAtlasCanvas(): HTMLCanvasElement {
    const size = 512;
    const tile = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const drawGemCard = (x: number, y: number, mainColor: string, lightColor: string, title: string, symbol: string) => {
        ctx.save();
        ctx.translate(x + tile / 2, y + tile / 2);

        // 1. Soft Radial Ambient Glow
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, tile * 0.45);
        glow.addColorStop(0, mainColor + '55');
        glow.addColorStop(0.8, mainColor + '08');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, tile * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 2. Glassmorphic Card Container
        ctx.fillStyle = 'rgba(25, 30, 42, 0.92)';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-100, -100, 200, 200, 24);
        ctx.fill();
        ctx.stroke();

        // Subtly lighter inner rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-94, -94, 188, 188, 20);
        ctx.stroke();

        // 3. Stylized Faceted Gem Structure
        // Main Base Poly
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(40, -15);
        ctx.lineTo(28, 38);
        ctx.lineTo(-28, 38);
        ctx.lineTo(-40, -15);
        ctx.closePath();
        ctx.fill();

        // Top Facet Highlight
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(40, -15);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();

        // Center Sparkle Symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, -2);

        // Frame Label Text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(title, 0, 68);

        ctx.restore();
    };

    // Draw 4 atlas quadrants
    drawGemCard(0, 0, '#3498db', '#85c1e9', 'SAPPHIRE', '❖');
    drawGemCard(256, 0, '#e74c3c', '#f1948a', 'RUBY', '♦');
    drawGemCard(0, 256, '#2ecc71', '#82e0aa', 'EMERALD', '✦');
    drawGemCard(256, 256, '#f1c40f', '#f9e79f', 'TOPAZ', '★');

    return canvas;
}

export default class TextureAtlasShowcaseScene extends Scene {
    private floatingSprites: { sprite: Sprite; baseY: number; speed: number; phase: number }[] = [];
    private rotatingCube!: Model;

    public async run() {
        this.camera.position.set([0, 0, 55]);
        new OrbitCameraController(this, this.camera, { radius: 55 });
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "One atlas, many sprites", "Static frames, animation and a textured model");

        // Lighting setup
        light.position.set([-25, 35, 45]);
        light.color = new Color(40, 40, 40);

        // 1. Generate Atlas Sheet Canvas
        const atlasCanvas = createAestheticAtlasCanvas();

        // 2. Define Manifest for the Atlas
        const manifest: TexturePackerManifest = {
            meta: { size: { w: 512, h: 512 } },
            frames: {
                "sapphire": { frame: { x: 0, y: 0, w: 256, h: 256 } },
                "ruby": { frame: { x: 256, y: 0, w: 256, h: 256 } },
                "emerald": { frame: { x: 0, y: 256, w: 256, h: 256 } },
                "topaz": { frame: { x: 256, y: 256, w: 256, h: 256 } }
            }
        };

        const atlas = await TextureAtlas.load(atlasCanvas, manifest);

        // =========================================================================
        // PANEL 1 (LEFT): Full Raw Atlas Sheet Preview
        // =========================================================================
        const fullSheetSprite = new Sprite(20, 20, atlasCanvas);
        fullSheetSprite.transform.position.set([-22, 0, 0]);
        this.add(fullSheetSprite);

        // =========================================================================
        // PANEL 2 (CENTER): Floating 2D SubTextures Extracted from Atlas
        // =========================================================================
        const sub1 = new Sprite(atlas.getTexture('sapphire')!);
        sub1.updateSize(11, 11);
        sub1.transform.position.set([-6, 8, 0]);
        this.add(sub1);
        this.floatingSprites.push({ sprite: sub1, baseY: 8, speed: 0.002, phase: 0 });

        const sub2 = new Sprite(atlas.getTexture('ruby')!);
        sub2.updateSize(11, 11);
        sub2.transform.position.set([-6, -8, 0]);
        this.add(sub2);
        this.floatingSprites.push({ sprite: sub2, baseY: -8, speed: 0.002, phase: Math.PI * 0.6 });

        // =========================================================================
        // PANEL 3 (CENTER-RIGHT): Animated Sprite Cycling Through Atlas Frames
        // =========================================================================
        const animSprite = new AnimatedSprite(atlas, 'sapphire', 2);
        animSprite.updateSize(13, 13);
        animSprite.transform.position.set([6, 0, 0]);
        animSprite.playAnimation(['sapphire', 'ruby', 'emerald', 'topaz'], 1.5, true);
        this.add(animSprite);
        this.floatingSprites.push({ sprite: animSprite, baseY: 0, speed: 0.0015, phase: Math.PI * 1.2 });

        // =========================================================================
        // PANEL 4 (RIGHT): 3D Model Mapped with an Atlas SubTexture
        // =========================================================================
        const cubeMesh = Math3D.createCube(12);
        this.rotatingCube = new Model(cubeMesh);
        this.rotatingCube.transform.position.set([22, 0, 0]);
        this.rotatingCube.setTextureMap(atlas.getTexture('topaz')!);
        this.rotatingCube.material.roughness = 0.25;
        this.rotatingCube.material.specular = 0.8;
        this.add(this.rotatingCube);

        // Smooth Update Loop: Floating bobbing motion & 3D rotation
        this.always(() => {
            const time = this.time;

            // Bobbing 2D sprites
            for (const item of this.floatingSprites) {
                const yOffset = Math.sin(time * item.speed + item.phase) * 1.5;
                item.sprite.transform.position.y = item.baseY + yOffset;
            }

            // Smooth 3D rotation
            this.rotatingCube.transform.rotateWorldY(this.dt * 0.0008);
            this.rotatingCube.transform.rotateWorldX(this.dt * 0.0004);

            this.invalidate();
        });
    }
}
