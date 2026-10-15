import {
    Scene, CameraModel, Color, Axes, Vec3,
    Streamlines2D, VectorField2D
} from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class InteractiveFluidScene extends Scene {
    private mouseMathPos: [number, number] = [0, 0];
    private isMouseActive: boolean = false;

    public async run() {
        // 1. Setup Camera (Perfect 2D Flat view)
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 14;
        this.camera.position.set([0, 0, 10]);
        this.clearColor(demoBackground());

        // 2. Setup Axes
        const axes = new Axes({
            xRange: [-9, 9, 1],
            yRange: [-5, 5, 1],
            width: 18, height: 10,
            axisColor: new Color(0.9, 0.9, 0.9, 1.0),
            gridColor: new Color(0.3, 0.3, 0.3, 0.2),
            showGrid: true
        });
        this.add(axes);

        // 3. Track Mouse Position & Unproject to Math Coordinates
        this.setupMouseTracking(axes);

        // 4. Define the Dynamic Fluid Math Function
        const fluidEquation = (x: number, y: number, time: number): [number, number] => {
            // River flow
            let dx = 2.2 + Math.sin(y * 1.5 - time) * 0.5;
            let dy = Math.cos(x * 1.0 + time) * 0.5;

            // Swirling mouse vortex
            if (this.isMouseActive) {
                const [mx, my] = this.mouseMathPos;
                const distSq = (x - mx) ** 2 + (y - my) ** 2;

                if (distSq < 10.0) {
                    const force = Math.exp(-distSq * 0.4) * 9.0;
                    dx += -(y - my) * force;
                    dy += (x - mx) * force;
                }
            }

            return [dx, dy];
        };

        // 5. Add Background Vector Arrows
        const vectorField = new VectorField2D(axes, fluidEquation, {
            xStep: 0.5, yStep: 0.5,
            normalize: true,
            arrowScale: 0.75,
            maxMagnitude: 8.0,
            opacity: 0.5        // Dim background arrows for streamline visibility
        });
        this.add(vectorField);

        // 6. Add Aerodynamic Glowing Streamlines!
        const streamlines = new Streamlines2D(axes, fluidEquation, {
            numLines: 500,       // Density of flowing lines
            maxLength: 35,       // Max length of each dash
            maxAge: 2000,
            strokeWidth: 0.04,
            speed: 1.5,
            colorPalette: [
                new Color(0.0, 1.0, 0.8, 1.0), // Glowing Cyan
                new Color(1.0, 0.2, 0.6, 1.0), // Glowing Pink
                new Color(1.0, 0.8, 0.0, 1.0)  // Glowing Gold
            ]
        });
        this.add(streamlines);

        // 7. Render Loop
        this.always(() => {
            // FIX: Match the internal time multiplier of Streamlines2D (0.001)
            // so the background arrows animate perfectly in sync with the particles!
            const time = this.time * 0.001;
            vectorField.updateField(time);
            this.invalidate(); // Request redraw
        });
    }

    private setupMouseTracking(axes: Axes) {
        // FIX: Cast to HTMLCanvasElement because OffscreenCanvas does not support DOM pointer events
        const canvas = this.canvas as HTMLCanvasElement;

        canvas.addEventListener('pointermove', (e: PointerEvent) => {
            this.isMouseActive = true;

            const rect = canvas.getBoundingClientRect();
            const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

            const invVP = this.default_view.getViewProjection().inverse();
            const worldPos = invVP.transformPoint(new Vec3(ndcX, ndcY, 0));

            const [mathX, mathY] = axes.p2c(worldPos);
            this.mouseMathPos = [mathX, mathY];
        });

        canvas.addEventListener('pointerout', () => {
            this.isMouseActive = false;
        });
    }
}
