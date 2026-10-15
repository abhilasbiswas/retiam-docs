import { frameStage, demoCaption } from "../../shared/presentation";
import { Scene, Vec3, Text, CameraController, Color, ThreeDAxes, VectorField3D, Group, CameraModel, Axes, Builder, DrawBorderThenFill, Path, PathEffect, Rate, FillEffect, Circle, Create, FeedbackZoomView, FunctionGraph2D, InteractionManager, RED } from "retiam";

export default class FeedbackDemoScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 100]);
        this.camera.orthoScale = 100;
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        frameStage(this, 150, 115);
        demoCaption(this, "A draggable feedback portal", "Drag the focus box · scroll to zoom");

        // 1. Enable Raycasting & Pointer Interaction System
        const interactionManager = new InteractionManager(this);

        // 2. IMPORTANT: Enable Frame Feedback in the Engine
        // Use the native helper if you added it to Scene.ts, or inject it manually if you haven't yet:
        if (typeof (this as any).enableFrameFeedback === 'function') {
            (this as any).feedbackFeature = (this as any).enableFrameFeedback();
        } else {
            console.error("FrameFeedbackFeature not found. Did you add it to the renderer?");
            return;
        }

        // 3. Create Background Scene Content
        const axes = new Axes({
            xRange: [-10, 10, 1], yRange: [-8, 8, 1],
            width: 100, height: 80, showGrid: true, strokeWidth: 0.3
        });

        const curve = new FunctionGraph2D(axes, (x) => Math.sin(x * 0.2) * 15.0, {
            stroke: new Color(0.2, 0.9, 0.6, 1.0),
            strokeWidth: 0.4
        });

        const orbitDot = new Circle(1.5);
        orbitDot.paint.fill = new Color(1.0, 0.8, 0.2, 1.0);

        this.add(axes, curve, orbitDot);

        await this.play([
            new Create(axes, { duration: 1000 }),
            new Create(curve, { duration: 1200 })
        ]);

        // 4. CREATE FEEDBACK ZOOM VIEW AT TOP-RIGHT
        const zoomView = new FeedbackZoomView(this, {
            position: [24.0, 20.0, 0],   // Top-Right Corner
            focusPos: [0, 0, 0],          // Initial region
            width: 45.0,
            height: 28.0,
            zoomFactor: 3.0,
            windowBorderColor: RED,
            focusBorderColor: new Color(1.0, 0.2, 0.3, 1.0),
        });

        // Add both Zoom Window and Focus Box to the Scene
        this.add(zoomView);
        this.add(zoomView.focusBox);

        // 5. MOUSE INTERACTION (Drag the red box to move the portal)
        zoomView.focusBox.setDraggable(true);
        zoomView.focusBox.setEvent("drag", (newPos: Vec3) => {
            zoomView.setFocusPosition(newPos);
        });

        if (this.canvas && this.canvas instanceof HTMLCanvasElement) {
            this.canvas.addEventListener("wheel", (e: WheelEvent) => {
                e.preventDefault();
                let z = zoomView.getZoomFactor();
                zoomView.setZoomFactor(e.deltaY < 0 ? z * 1.12 : z / 1.12);
                this.continue();
            }, { passive: false });
        }

        // 6. CONTINUOUS ANIMATION (Watch the dot travel into the infinite mirror!)
        this.always(() => {
            const t = this.time * 0.001;
            orbitDot.transform.position.set([Math.cos(t) * 30, Math.sin(t * 2) * 15, 0]);
            this.invalidate(); // Forces a render on every frame
        });
    }
}
