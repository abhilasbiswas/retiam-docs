import { frameStage } from "../../shared/presentation";
// =============================================================================
// RenderTarget Demo: First-Class Blur Animations
// Demonstrates blurIn, blurOut, blurPulse, and blurTo animation primitives
// integrated with Scene.play(), Rate easing curves, and entity lifecycles.
// =============================================================================

import {
    CENTER,
    Scene,
    Color,
    Circle,
    Rect,
    Triangle,
    RenderTarget,
    SDFText,
    Camera2DController,
    Sphere,
    Rate,
    blurIn,
    blurOut,
    blurPulse,
    blurTo
} from "retiam";

export default class BlurAnimationDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 1000]);
        frameStage(this, 1350, 780, 0);
        new Camera2DController(this, this.camera);

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        // Title Header
        const title = new SDFText("Retiam Blur Animation Suite", { anchor: CENTER, fontSize: 32 });
        title.paint.fill = new Color(1.0, 1.0, 1.0, 1.0);
        title.transform.position.set([0, 270, 0]);
        this.add(title);

        const subtitle = new SDFText("First-Class Blur Primitives: blurIn, blurOut, blurPulse, blurTo", { anchor: CENTER, fontSize: 18 });
        subtitle.paint.fill = new Color(0.6, 0.7, 0.8, 0.9);
        subtitle.transform.position.set([0, 230, 0]);
        this.add(subtitle);

        // =====================================================================
        // 1. CARD 1: blurIn & blurOut (Introducer & Exit Transitions)
        // =====================================================================
        const target1 = new RenderTarget(this, "Target_BlurInOut", {
            width: 380,
            height: 380,
            type: "offscreen",
            blur: 0
        });

        const c1A = new Circle(55);
        c1A.paint.fill = new Color(0.95, 0.25, 0.45, 1.0);
        c1A.transform.position.set([-50, 40, 0]);

        const c1B = new Rect(75, 75);
        c1B.paint.fill = new Color(0.2, 0.8, 0.95, 0.9);
        c1B.transform.position.set([40, -30, 0]);

        const c1C = new Circle(60);
        c1C.paint.fill = new Color(1.0, 0.8, 0.2, 0.95);
        c1C.transform.position.set([10, 45, 0]);

        target1.add(c1A, c1B, c1C);

        const sprite1 = target1.toSprite(340, 340);
        sprite1.transform.position.set([-380, 0, 0]);
        this.add(sprite1);

        const label1Title = new SDFText("blurIn & blurOut", { anchor: CENTER, fontSize: 22 });
        label1Title.paint.fill = new Color(0.95, 0.95, 0.95, 1.0);
        label1Title.transform.position.set([-380, -200, 0]);
        this.add(label1Title);

        const label1Status = new SDFText("Initializing...", { anchor: CENTER, fontSize: 16 });
        label1Status.paint.fill = new Color(0.3, 0.85, 1.0, 1.0);
        label1Status.transform.position.set([-380, -235, 0]);
        this.add(label1Status);

        // =====================================================================
        // 2. CARD 2: blurPulse (Defocus Shockwave / Impact Beat)
        // =====================================================================
        const target2 = new RenderTarget(this, "Target_BlurPulse", {
            width: 380,
            height: 380,
            type: "offscreen",
            blur: 0
        });

        const sphere2 = new Sphere(65);
        sphere2.paint.fill = new Color(0.9, 0.4, 1.0, 1.0);
        sphere2.transform.position.set([0, 0, 0]);

        const c2A = new Circle(35);
        c2A.paint.fill = new Color(1.0, 0.9, 0.2, 0.9);
        c2A.transform.position.set([-65, -45, 0]);

        const c2B = new Circle(35);
        c2B.paint.fill = new Color(0.2, 0.9, 0.6, 0.9);
        c2B.transform.position.set([65, 45, 0]);

        target2.add(sphere2, c2A, c2B);

        const sprite2 = target2.toSprite(340, 340);
        sprite2.transform.position.set([0, 0, 0]);
        this.add(sprite2);

        const label2Title = new SDFText("blurPulse", { anchor: CENTER, fontSize: 22 });
        label2Title.paint.fill = new Color(0.95, 0.95, 0.95, 1.0);
        label2Title.transform.position.set([0, -200, 0]);
        this.add(label2Title);

        const label2Status = new SDFText("Initializing...", { anchor: CENTER, fontSize: 16 });
        label2Status.paint.fill = new Color(1.0, 0.45, 0.85, 1.0);
        label2Status.transform.position.set([0, -235, 0]);
        this.add(label2Status);

        // =====================================================================
        // 3. CARD 3: blurTo (State Transitions & Focus Racking)
        // =====================================================================
        const target3 = new RenderTarget(this, "Target_BlurTo", {
            width: 380,
            height: 380,
            type: "offscreen",
            blur: 0
        });

        const c3A = new Circle(60);
        c3A.paint.fill = new Color(0.3, 0.85, 0.4, 1.0);
        c3A.transform.position.set([-45, 35, 0]);

        const c3B = new Rect(80, 80);
        c3B.paint.fill = new Color(1.0, 0.5, 0.2, 0.9);
        c3B.transform.position.set([45, -35, 0]);

        const c3C = new Circle(40);
        c3C.paint.fill = new Color(0.2, 0.5, 1.0, 0.85);
        c3C.transform.position.set([15, 40, 0]);

        target3.add(c3A, c3B, c3C);

        const sprite3 = target3.toSprite(340, 340);
        sprite3.transform.position.set([380, 0, 0]);
        this.add(sprite3);

        const label3Title = new SDFText("blurTo", { anchor: CENTER, fontSize: 22 });
        label3Title.paint.fill = new Color(0.95, 0.95, 0.95, 1.0);
        label3Title.transform.position.set([380, -200, 0]);
        this.add(label3Title);

        const label3Status = new SDFText("Initializing...", { anchor: CENTER, fontSize: 16 });
        label3Status.paint.fill = new Color(0.4, 0.9, 0.4, 1.0);
        label3Status.transform.position.set([380, -235, 0]);
        this.add(label3Status);

        // ---------------------------------------------------------------------
        // Continuous Internal Shape Animations
        // ---------------------------------------------------------------------
        this.always(() => {
            const t = this.time * 0.002;

            c1B.transform.rotateWorldZ(0.012);
            c1C.transform.rotateWorldZ(-0.015);
            c3B.transform.rotateWorldZ(0.015);

            const ox1 = Math.cos(t) * 25;
            const oy1 = Math.sin(t) * 25;
            c1A.transform.position.set([-50 + ox1, 40 + oy1, 0]);

            const ox2 = Math.cos(t * 1.5) * 35;
            const oy2 = Math.sin(t * 1.5) * 35;
            c2A.transform.position.set([-65 + ox2, -45 + oy2, 0]);
            c2B.transform.position.set([65 - ox2, 45 - oy2, 0]);

            const ox3 = Math.cos(t * 0.8) * 20;
            const oy3 = Math.sin(t * 0.8) * 20;
            c3A.transform.position.set([-45 + ox3, 35 + oy3, 0]);
        });

        // =====================================================================
        // INDEPENDENT ASYNC ANIMATION SEQUENCES
        // =====================================================================

        // Sequence 1: blurIn & blurOut Loop
        const runSeq1 = async () => {
            while (true) {
                label1Status.text = "blurIn(36px -> 0px, scale: 0.85)";
                await this.play(blurIn(sprite1, {
                    startRadius: 36,
                    endRadius: 0,
                    duration: 1400,
                    fadeIn: true,
                    startScale: 0.85,
                    rate_func: Rate.easeOutCubic()
                }));
                label1Status.text = "Focused (blur: 0px)";
                await this.wait(1000);

                label1Status.text = "blurOut(0px -> 36px, scale: 1.08)";
                await this.play(blurOut(sprite1, {
                    targetRadius: 36,
                    duration: 1400,
                    fadeOut: true,
                    targetScale: 1.08,
                    rate_func: Rate.easeInCubic()
                }));
                label1Status.text = "Blurred Out";
                await this.wait(600);
            }
        };

        // Sequence 2: blurPulse Loop (Defocus shockwaves)
        const runSeq2 = async () => {
            while (true) {
                label2Status.text = "blurPulse (Single Shock: 32px)";
                await this.play(blurPulse(target2, {
                    peakRadius: 32,
                    duration: 900,
                    rate_func: Rate.easeInOutQuad()
                }));
                label2Status.text = "Settled (blur: 0px)";
                await this.wait(1000);

                label2Status.text = "Double blurPulse (Beat 1: 18px)";
                await this.play(blurPulse(target2, {
                    peakRadius: 18,
                    duration: 450,
                    rate_func: Rate.easeInOutQuad()
                }));

                label2Status.text = "Double blurPulse (Beat 2: 38px)";
                await this.play(blurPulse(target2, {
                    peakRadius: 38,
                    duration: 750,
                    rate_func: Rate.easeInOutQuad()
                }));
                label2Status.text = "Settled (blur: 0px)";
                await this.wait(1200);
            }
        };

        // Sequence 3: blurTo Loop (State rack focus)
        const runSeq3 = async () => {
            while (true) {
                label3Status.text = "blurTo(24px) -> Frosted Background";
                await this.play(blurTo(target3, 24, {
                    duration: 1100,
                    rate_func: Rate.easeInOutCubic()
                }));
                await this.wait(900);

                label3Status.text = "blurTo(8px) -> Soft Focus";
                await this.play(blurTo(target3, 8, {
                    duration: 900,
                    rate_func: Rate.easeInOutCubic()
                }));
                await this.wait(900);

                label3Status.text = "blurTo(0px) -> Crisp Focus";
                await this.play(blurTo(target3, 0, {
                    duration: 1000,
                    rate_func: Rate.easeOutCubic()
                }));
                await this.wait(1200);
            }
        };

        // Launch all 3 independent sequences
        runSeq1();
        runSeq2();
        runSeq3();
    }
}
