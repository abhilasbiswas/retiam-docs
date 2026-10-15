import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, InteractionManager, SDFText, Color, Axes, FunctionGraph2D, Tex, Circle, Entity, Create, ZoomView, Vec3, CameraModel, RED, WHITE } from "retiam";

export default class InteractiveZoomDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);

        this.camera.orthoScale = 100;
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        frameStage(this, 150, 116);
        demoCaption(this, "Interactive zoom view", "Drag the focus box · scroll to change magnification");

        // 1. Enable Raycasting & Pointer Interaction System
        const interactionManager = new InteractionManager(this);


        // 3. Create Scene Content
        const axes = new Axes({
            xRange: [-10, 10, 1],
            yRange: [-8, 8, 1],
            width: 100,
            height: 80,
            showGrid: true,
            strokeWidth: 0.3
        });

        // Math Curve
        const curve = new FunctionGraph2D(axes, (x) => Math.sin(x * 2) * 1.5 + Math.cos(x * 0.5), {
            stroke: new Color(0.2, 0.9, 0.6, 1.0), // Cyan/Green
            strokeWidth: 0.4
        });


        // Animated Orbiting Dot
        const orbitDot = new Circle(0.25);
        orbitDot.paint.fill = new Color(1.0, 0.8, 0.2, 1.0); // Gold

        const sceneContent = new Entity();
        sceneContent.add(axes, curve, orbitDot);

        this.add(sceneContent);

        // Play entrance animation
        await this.play([
            new Create(axes, { duration: 1000 }),
            new Create(curve, { duration: 1200 })
        ]);

        // =========================================================
        // 4. CREATE ZOOM VIEW (Placed at Top-Right Corner)
        // =========================================================
        const zoomView = new ZoomView(sceneContent, {
            position: [40.0, 30.0, 0],                       // Fixed in Top-Right Corner
            focusPos: [0, Math.sin(0) * 1.5 + 1.0, 0],      // Initial inspection spot
            width: 50.0,
            height: 30.4,
            zoomFactor: 3.0,                                 // Initial 3x zoom
            windowBorderColor: RED,                          // Gold Zoom Window Border
            focusBorderColor: new Color(1.0, 0.2, 0.3, 1.0), // Red Focus Area Border
            backgroundColor: WHITE
        });


        // Add both Zoom Window and Focus Box to the Scene
        this.add(zoomView);
        this.add(zoomView.focusBox);

        // =========================================================
        // 5. MOUSE DRAGGING INTERACTION
        // =========================================================
        zoomView.focusBox.setDraggable(true);
        zoomView.focusBox.setEvent("drag", (newPos: Vec3) => {
            // Update focus position as user drags the red box around
            zoomView.setFocusPosition(newPos);
        });

        // =========================================================
        // 6. MOUSE WHEEL ZOOM INTERACTION
        // =========================================================
        if (this.canvas && this.canvas instanceof HTMLCanvasElement) {
            this.canvas.addEventListener("wheel", (e: WheelEvent) => {
                e.preventDefault();

                const delta = e.deltaY;
                let currentZoom = zoomView.getZoomFactor();

                // Scroll Up (delta < 0) = Zoom IN; Scroll Down = Zoom OUT
                if (delta < 0) {
                    currentZoom *= 1.12;
                } else {
                    currentZoom /= 1.12;
                }

                zoomView.setZoomFactor(currentZoom);
                this.continue(); // Wake up rendering loop
            }, { passive: false });
        }

        // =========================================================
        // 7. CONTINUOUS ANIMATION (Proves real-time mirroring)
        // =========================================================
        this.always(() => {
            const t = this.time * 0.002;
            const dotX = Math.cos(t) * 3;
            const dotY = Math.sin(t * 2) * 1.5;
            orbitDot.transform.position.set([dotX, dotY, 0]);
            this.invalidate();
        });
    }
}
