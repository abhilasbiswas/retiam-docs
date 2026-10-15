import { frameStage } from "../../shared/presentation";
import {
    Scene,
    Color,
    Text,
    SDFText,
    Tex,
    Path,
    CameraController,
    Rate,
    Write,
    FadeIn,
    FadeOut,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    Vec3,
    CENTER
} from "retiam";

/**
 * TextSplittingShowcaseScene
 *
 * Demonstrates Retiam's high-performance text splitting architecture:
 * 1. Word-level splitting with Text.splitWords()
 * 2. Multi-line paragraph splitting with SDFText.splitLines()
 * 3. Glyph/character-level radial explosion & snap-back with Text.splitChars()
 * 4. Mathematical LaTeX symbol decomposition with Tex.split()
 *
 * All operations preserve 100% exact spatial positions, font metrics,
 * kerning, and parent scene graph hierarchy.
 */
export default class TextSplittingShowcaseScene extends Scene {
    public async run() {
        // --- 1. Scene & Camera Setup ---
        this.camera.position.set([0, 0, 36]);
        this.clearColor(Color.fromHex("#070A13")); // Deep cinematic obsidian canvas
        new CameraController(this, this.camera);
        frameStage(this, 64, 44);
        this.always(() => this.invalidate());

        const PALETTE = {
            CYAN: Color.fromHex("#38BDF8"),
            AMBER: Color.fromHex("#F59E0B"),
            EMERALD: Color.fromHex("#10B981"),
            ROSE: Color.fromHex("#F43F5E"),
            PURPLE: Color.fromHex("#A78BFA"),
            MUTED: Color.fromHex("#94A3B8"),
            WHITE: Color.fromHex("#F8FAFC")
        };

        // --- 2. Title & Subtitle ---
        const title = new SDFText("TEXT SPLITTING ARCHITECTURE", { fontSize: 1.8 , anchor: CENTER});
        title.paint.fill = PALETTE.CYAN;
        title.transform.position.set(0, 12.5, 0);

        const subtitle = new SDFText("Zero-Drift Typographic & Mathematical Formula Decomposition", { fontSize: 0.85 , anchor: CENTER});
        subtitle.paint.fill = PALETTE.MUTED;
        subtitle.nextTo(title, DOWN, 0.4);

        await this.play([
            new FadeIn(title, { duration: 800 }),
            new FadeIn(subtitle, { duration: 800 })
        ]);
        await this.wait(600);

        // =================================================================
        // ACT 1: Word-Level Splitting (Text.splitWords)
        // =================================================================
        const wordLabel = new SDFText("1. Word-Level Splitting (Text.splitWords)", { fontSize: 0.75 });
        wordLabel.paint.fill = PALETTE.MUTED;
        wordLabel.transform.position.set(-14, 9.2, 0);
        this.add(wordLabel);

        const sentence = new Text("Modular Vector Typography", { fontSize: 2.0 });
        sentence.paint.fill = PALETTE.WHITE;
        sentence.center();
        sentence.transform.position.y = 6.8;

        await this.play(new Write(sentence, { duration: 1200, rate_func: Rate.easeInOutCubic() }));
        await this.wait(400);

        // Split into independent words (replaces sentence in scene graph automatically)
        const words: Text[] = sentence.splitWords();

        // Color-code each word to prove individual entity identity
        words[0].paint.fill = PALETTE.CYAN;
        words[1].paint.fill = PALETTE.AMBER;
        words[2].paint.fill = PALETTE.EMERALD;

        // Animate each word independently along staggered arcs
        await this.play([
            words[0].animate.shift([-1.5, 1.2, 0]),
            words[1].animate.shift([0, -1.0, 0]),
            words[2].animate.shift([1.5, 1.2, 0]),
        ], {
            duration: 1000,
            rate_func: Rate.spring({ stiffness: 120, damping: 14 })
        });

        await this.wait(300);

        // Return words to their exact original positions
        await this.play([
            words[0].animate.shift([1.5, -1.2, 0]),
            words[1].animate.shift([0, 1.0, 0]),
            words[2].animate.shift([-1.5, -1.2, 0]),
        ], {
            duration: 900,
            rate_func: Rate.easeInOutCubic()
        });

        await this.wait(800);

        // =================================================================
        // =================================================================
        // ACT 2: Multi-Line Splitting (SDFText.splitLines)
        // =================================================================
        const lineLabel = new SDFText("2. Multi-Line Splitting (SDFText.splitLines)", { fontSize: 0.75 });
        lineLabel.paint.fill = PALETTE.MUTED;
        lineLabel.transform.position.set(-14, 3.8, 0);
        this.add(lineLabel);

        const paragraph = new SDFText(
            "High-Performance WebGPU Layout\nPreserves Exact Metrics & Baselines\nIndependent Staggered Motion",
            { fontSize: 1.1 }
        );
        paragraph.paint.fill = PALETTE.WHITE;
        paragraph.center();
        paragraph.transform.position.y = 1.6;

        await this.play(new FadeIn(paragraph, { duration: 800 }));
        await this.wait(400);

        // Split paragraph into separate line entities
        const lines: SDFText[] = paragraph.splitLines();

        // Tint each line
        lines[0].paint.fill = PALETTE.CYAN;
        lines[1].paint.fill = PALETTE.ROSE;
        lines[2].paint.fill = PALETTE.PURPLE;

        // Staggered horizontal accordion movement
        await this.play([
            lines[0].animate.shift([-2.0, 0, 0]),
            lines[1].animate.shift([2.0, 0, 0]),
            lines[2].animate.shift([-2.0, 0, 0]),
        ], {
            duration: 900,
            rate_func: Rate.easeInOutCubic()
        });

        await this.wait(300);

        // Align smoothly back to original line coordinates
        await this.play([
            lines[0].animate.shift([2.0, 0, 0]),
            lines[1].animate.shift([-2.0, 0, 0]),
            lines[2].animate.shift([2.0, 0, 0]),
        ], {
            duration: 800,
            rate_func: Rate.easeInOutCubic()
        });

        await this.wait(800);

        // =================================================================
        // ACT 3: Character-Level Explosion & Snapping (Text.splitChars)
        // =================================================================
        const charLabel = new SDFText("3. Character Radial Burst (Text.splitChars)", { fontSize: 0.75 });
        charLabel.paint.fill = PALETTE.MUTED;
        charLabel.transform.position.set(-14, -1.8, 0);
        this.add(charLabel);

        const burstWord = new Text("EXPLODE", { fontSize: 2.2 });
        burstWord.paint.fill = PALETTE.AMBER;
        burstWord.center();
        burstWord.transform.position.y = -4.2;

        await this.play(new Write(burstWord, { duration: 900 }));
        await this.wait(300);

        // Split into individual glyph characters
        const chars: Text[] = burstWord.splitChars();

        // Calculate radial explosion trajectories for each glyph
        const offsets: [number, number, number][] = chars.map((_, i) => {
            const angle = (i / chars.length) * Math.PI * 2;
            const dist = 2.8 + (i % 2) * 0.8;
            return [Math.cos(angle) * dist, Math.sin(angle) * dist, 0];
        });

        // Explode outward with spring overshoot
        await this.play(
            chars.map((char, i) => {
                char.paint.fill = (i % 2 === 0) ? PALETTE.CYAN : PALETTE.ROSE;
                return char.animate.shift(offsets[i]);
            }),
            {
                duration: 900,
                rate_func: Rate.easeOutQuad()
            }
        );

        await this.wait(400);

        // Reconverge back to millimeter-perfect positions with elastic settling
        await this.play(
            chars.map((char, i) => {
                char.paint.fill = PALETTE.EMERALD;
                return char.animate.shift([-offsets[i][0], -offsets[i][1], 0]);
            }),
            {
                duration: 900,
                rate_func: Rate.spring({ stiffness: 150, damping: 14 })
            }
        );

        await this.wait(800);

        // =================================================================
        // ACT 4: Mathematical Formula Decomposition (Tex.split)
        // =================================================================
        const texLabel = new SDFText("4. Mathematical Symbol Decomposition (Tex.split)", { fontSize: 0.75 });
        texLabel.paint.fill = PALETTE.MUTED;
        texLabel.transform.position.set(-14, -7.5, 0);
        this.add(texLabel);

        const formula = new Tex("E = mc^2", { fontSize: 1.5 });
        formula.paint.fill = PALETTE.WHITE;
        formula.center();
        formula.transform.position.y = -10.0;

        await this.play(new FadeIn(formula, { duration: 800 }));
        await this.wait(300);

        // Split LaTeX formula into independent symbol Path entities
        const symbols: Path[] = formula.split();

        // Color-code individual math symbols
        symbols[0].paint.fill = PALETTE.CYAN;    // 'E'
        symbols[1].paint.fill = PALETTE.MUTED;   // '='
        symbols[2].paint.fill = PALETTE.AMBER;   // 'm'
        symbols[3].paint.fill = PALETTE.ROSE;    // 'c'
        symbols[4].paint.fill = PALETTE.EMERALD; // '2' (superscript)

        // Animate individual math symbols: elevate the exponent and separate equation sides
        await this.play([
            symbols[0].animate.shift([-1.2, 0, 0]),
            symbols[4].animate.shift([0, 1.2, 0]),
        ], {
            duration: 800,
            rate_func: Rate.spring({ stiffness: 120, damping: 12 })
        });

        await this.wait(400);

        // Return symbols back to exact formula layout
        await this.play([
            symbols[0].animate.shift([1.2, 0, 0]),
            symbols[4].animate.shift([0, -1.2, 0]),
        ], {
            duration: 700,
            rate_func: Rate.easeInOutCubic()
        });

        // Rest and linger
        await this.wait(2000);
    }
}
