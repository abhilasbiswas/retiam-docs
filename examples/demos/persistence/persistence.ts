import { CENTER } from "retiam";
import { demoBackground, framePerspective } from "../../shared/presentation";
import { Scene, Color, Circle, Rect, SDFText, Vec3, CameraModel, RenderTarget, Sprite } from "retiam";

export default class PersistentDemoScene extends Scene {
    private brushA!: Circle;
    private brushB!: Circle;

    // Frequencies for the mathematical curves
    private freqX = 3.01;
    private freqY = 2.0;

    public async run() {
        // ====================================================================
        // 1. PIXEL-PERFECT ORTHOGRAPHIC CAMERA
        // ====================================================================
        // Setting orthoScale to the canvas height makes 1 world unit = 1 pixel.
        // Origin (0,0) will be perfectly in the center of the screen.
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = this.canvas.height;
        this.camera.position.set([0, 0, 100]);
        this.clearColor(demoBackground());
        framePerspective(this); // Step back to look at Z=0

        // ====================================================================
        // 2. CONFIGURE PERSISTENT RENDER TARGET
        // ====================================================================
        // We create a drawing board with a 10% margin on all sides.
        const marginX = 0.1;
        const marginY = 0.1;
        const frameWidth = Math.floor(this.canvas.width * (1.0 - 2 * marginX));
        const frameHeight = Math.floor(this.canvas.height * (1.0 - 2 * marginY));

        const persistentTarget = new RenderTarget(this, "PersistentBoard", {
            width: frameWidth,
            height: frameHeight,
            type: "persistent"
        });

        // Display the persistent render target texture via a Sprite board
        const boardSprite = new Sprite(frameWidth, frameHeight, persistentTarget.texture!);
        boardSprite.z_index = 0;
        this.add(boardSprite);

        // ====================================================================
        // 3. SCENE ENTITIES
        // ====================================================================

        // A. The Frame (Draws exactly on the boundary of the persistent region)
        const frame = new Rect(frameWidth, frameHeight);
        frame.paint.fill = Color.NONE;
        frame.paint.stroke = new Color(0.2, 0.8, 1.0, 1.0); // Neon Cyan
        frame.paint.strokeWidth = 2;
        frame.z_index = 10; // Keep the frame hovering above the paint
        this.add(frame);

        // B. The Brushes (The objects that will leave trails)
        this.brushA = new Circle(3);
        this.brushA.paint.fill = new Color(1, 0, 0.5, 1);
        this.brushA.paint.stroke = Color.NONE;

        this.brushB = new Circle(3);
        this.brushB.paint.fill = new Color(0, 1, 0.5, 1);
        this.brushB.paint.stroke = Color.NONE;

        // Capture brushes into persistent render target (hides from main camera & assigns isolated layer)
        persistentTarget.capture(this.brushA, this.brushB);

        // C. UI Instructions (Placed OUTSIDE the persistent region so it doesn't smear)
        const uiText = new SDFText("Press 'C' to clear drawing board", { anchor: CENTER, fontSize: 18 });
        uiText.paint.fill = new Color(0.7, 0.7, 0.7, 1.0);
        // Position it at the bottom center of the screen
        uiText.transform.position = new Vec3(0, -this.canvas.height * 0.45, 0);
        this.add(uiText);

        // ====================================================================
        // 4. USER INTERACTIONS
        // ====================================================================
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'c') {
                // Instantly wipe the drawing board cleanly via RenderTarget
                persistentTarget.clear();
            }
        });

        // ====================================================================
        // 5. ANIMATION LOOP
        // ====================================================================
        this.always(() => {
            const t = this.time * 0.0015; // Time in seconds (scaled for speed)

            // Calculate the radius limits so the brushes bounce perfectly inside the frame
            const radiusX = frameWidth * 0.45;
            const radiusY = frameHeight * 0.45;

            // Phase drift slowly rotates the shape in 3D-like space
            const delta = t * 0.2;

            // Brush A Logic (Primary Curve)
            const ax = radiusX * Math.sin(this.freqX * t + delta);
            const ay = radiusY * Math.sin(this.freqY * t);
            this.brushA.transform.position = new Vec3(ax, ay, 0);

            // Brush B Logic (Inverted harmonic follower)
            const bx = radiusX * Math.sin(this.freqX * t - delta + Math.PI);
            const by = radiusY * Math.cos(this.freqY * t);
            this.brushB.transform.position = new Vec3(bx, by, 0);

            // Dynamic RGB Color Shifting based on time
            const r = Math.sin(t * 0.5) * 0.5 + 0.5;
            const g = Math.sin(t * 0.3 + 2.0) * 0.5 + 0.5;
            const b = Math.sin(t * 0.7 + 4.0) * 0.5 + 0.5;

            // Assign inverse colors to the two brushes
            this.brushA.paint.fill = new Color(r, g, b, 1.0);
            this.brushB.paint.fill = new Color(1.0 - r, 1.0 - g, 1.0 - b, 1.0);

            // Slowly mutate the frequencies to evolve the shape endlessly
            this.freqX += Math.sin(t * 0.05) * 0.0005;

            // Force WebGPU to redraw the frame
            this.invalidate();
        });
    }
}
