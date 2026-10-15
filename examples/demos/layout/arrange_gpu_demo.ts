// =========================================================================
// File: examples/demos/layout/arrange_gpu_demo.ts
// =========================================================================

import {
    CENTER,
    Scene,
    Color,
    CameraController,
    Circle,
    Text,
    Arrange,
    UP,
    Vec3,
    Camera2DController
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class ArrangeGPUDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 55]);
        this.clearColor(demoBackground());
        new Camera2DController(this, this.camera);

        // ---------------------------------------------------------------------
        // 1. Massive 10,000 Element Grid using GPU Instancing (1 Single Draw Call!)
        // ---------------------------------------------------------------------
        const COUNT = 10000;
        const COLS = 100;
        const ROWS = 100;

        const templateCircle = new Circle(0.18);
        templateCircle.paint.fill = Color.WHITE;

        const gpuGrid = new Arrange(templateCircle, COUNT, { gpu: true })
            .arrangeGrid(ROWS, COLS, 0.1)
            .forGrid(ROWS, COLS, (row, col, _i, circle) => {
                // Vibrant color gradient across the grid
                circle.paint.fill = Color.fromHSV((col + row) / (COLS + ROWS), 0.85, 1.0);
            });

        gpuGrid.transform.position.set(0, -2, 0);
        this.add(gpuGrid);

        // ---------------------------------------------------------------------
        // 2. Real-Time Sinusoidal Ripple Wave via .onUpdate()
        // ---------------------------------------------------------------------
        gpuGrid.onUpdate((time, dt, arrange) => {
            const t = time * 0.003;
            arrange.forAll((i, circle) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);

                // Distance from center
                const dx = col - COLS * 0.5;
                const dy = row - ROWS * 0.5;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Radial wave elevation
                const wave = Math.sin(dist * 0.25 - t * 3.0);
                circle.transform.scaling = new Vec3(1.0 + wave * 0.4, 1.0 + wave * 0.4, 1.0);
            });
        });

        // ---------------------------------------------------------------------
        // Title and Information Overlay
        // ---------------------------------------------------------------------
        const title = new Text("10,000 Circles Grid (WebGPU Instancing - 1 Draw Call)", { anchor: CENTER,
            fontSize: 1.5
        });
        title.paint.fill = Color.WHITE;
        title.nextTo(gpuGrid, UP, 1.5);
        this.add(title);

        const subtitle = new Text("Runs smoothly at 60+ FPS using Arrange with { gpu: true }", { anchor: CENTER,
            fontSize: 0.9
        });
        subtitle.paint.fill = Color.fromHex("#88aaff");
        subtitle.nextTo(title, UP, 0.4);
        this.add(subtitle);

        // Request continuous rendering for the real-time wave
        this.always(() => {
            this.invalidate();
        });
    }
}
