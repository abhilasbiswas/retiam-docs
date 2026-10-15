// =============================================================================
// RenderTarget Demo: type = "persistent"
// USE CASE: Drawing canvas, paint programs, accumulation trails, heatmaps
//
// Persistent KEEPS the previous frame's pixels (loadOp: 'load') so every new
// draw call paints ON TOP of the old content. Only depth is cleared so new
// strokes render over old ones. Call renderTarget.clear() to wipe the board.
// =============================================================================
import { CENTER, Scene, Color, Circle, Rect, SDFText, Vec3, CameraModel, RenderTarget, Sprite } from "retiam";

export default class PersistentDemo extends Scene {
    public async run() {
        // Pixel-perfect 2D camera
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);

        if (this.composer) this.composer.ALWAYS_UPDATE = true;

        // --- 1. CREATE PERSISTENT RENDER TARGET ---
        const boardWidth = Math.floor(this.canvas.width * 0.85);
        const boardHeight = Math.floor(this.canvas.height * 0.85);

        const canvas = new RenderTarget(this, "DrawingCanvas", {
            width: boardWidth,
            height: boardHeight,
            type: "persistent"  // <-- Retains pixels between frames!
        });

        // --- 2. DISPLAY BOARD ---
        const board = new Sprite(boardWidth, boardHeight, canvas.texture!);
        board.z_index = 0;
        this.add(board);

        // Frame border
        const frame = new Rect(boardWidth, boardHeight);
        frame.paint.fill = Color.NONE;
        frame.paint.stroke = new Color(0.3, 0.6, 1.0, 0.8);
        frame.paint.strokeWidth = 3;
        frame.z_index = 10;
        this.add(frame);

        // --- 3. CREATE BRUSHES ---
        // These render exclusively into the persistent target (hidden from main camera)
        const brushA = new Circle(4);
        brushA.paint.fill = new Color(1.0, 0.2, 0.5, 1.0);
        brushA.paint.stroke = Color.NONE;

        const brushB = new Circle(3);
        brushB.paint.fill = new Color(0.2, 1.0, 0.6, 1.0);
        brushB.paint.stroke = Color.NONE;

        const brushC = new Circle(2);
        brushC.paint.fill = new Color(0.4, 0.6, 1.0, 1.0);
        brushC.paint.stroke = Color.NONE;

        canvas.capture(brushA, brushB, brushC);

        // --- 4. KEYBOARD: Press 'C' to clear ---
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'c') {
                canvas.clear();
            }
        });

        // UI hint
        const hint = new SDFText("Press 'C' to clear the canvas", { anchor: CENTER, fontSize: 20 });
        hint.paint.fill = new Color(0.5, 0.5, 0.5, 1.0);
        hint.transform.position = new Vec3(0, -this.canvas.height * 0.46, 0);
        this.add(hint);

        // --- 5. ANIMATE BRUSHES ---
        const radiusX = boardWidth * 0.42;
        const radiusY = boardHeight * 0.42;

        this.always(() => {
            const t = this.time * 0.0018;

            // Lissajous curves at different frequencies
            brushA.transform.position.set([
                radiusX * Math.sin(3.01 * t),
                radiusY * Math.sin(2.0 * t),
                0
            ]);

            brushB.transform.position.set([
                radiusX * Math.sin(2.0 * t + Math.PI),
                radiusY * Math.cos(3.0 * t),
                0
            ]);

            brushC.transform.position.set([
                radiusX * Math.cos(4.0 * t),
                radiusY * Math.sin(1.5 * t + 1.0),
                0
            ]);

            // Color cycling
            const r = Math.sin(t * 0.5) * 0.5 + 0.5;
            const g = Math.sin(t * 0.3 + 2) * 0.5 + 0.5;
            const b = Math.sin(t * 0.7 + 4) * 0.5 + 0.5;
            brushA.paint.fill = new Color(r, g, b, 1.0);
            brushB.paint.fill = new Color(1 - r, g, b, 1.0);
            brushC.paint.fill = new Color(r, 1 - g, b, 1.0);
        });
    }
}
