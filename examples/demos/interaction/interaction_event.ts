import { demoBackground, framePerspective, demoCaption } from "../../shared/presentation";
import { Scene, InteractionManager, CameraController, Math3D, Model, Color, InteractionComponent } from "retiam";


export default class InteractionScene extends Scene {
    public async run() {
        // Setup Camera
        this.camera.position.set([0, 0, 85]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());
        framePerspective(this);
        demoCaption(this, "Hover and drag", "Hover to brighten the sphere · drag to move it");

        // Instantiate Interactive event loop
        this.interactionManager = new InteractionManager(this);


        // Create Sphere Mesh
        const sphereMesh = Math3D.computeSmoothShading(
            Math3D.createSphere(12, 64, 64).vertices,
            Math3D.createSphere(12, 64, 64).indices!
        );
        const sphere = new Model(sphereMesh);
        sphere.material.color = new Color(0.1, 0.5, 1.0, 1.0);
        sphere.material.emColor = new Color(0.0, 0.4, 0.8, 1.0);
        sphere.material.emStrength = 1.0;
        this.add(sphere);

        // Attach Interaction Component
        const interact = sphere.addComponent(new InteractionComponent());
        interact.isDraggable = true;

        // Custom Visual Feedback on hover
        interact.onPointerOver = () => {
            sphere.material.emStrength = 2.5; // Glow intensely on hover
            this.invalidate();
        };

        interact.onPointerOut = () => {
            sphere.material.emStrength = 1.0; // Dim back down
            this.invalidate();
        };

        interact.onDragStart = () => {
            sphere.material.color = new Color(0.1, 1.0, 0.5, 1.0); // Tint green during drag
        };

        interact.onDragEnd = () => {
            sphere.material.color = new Color(0.1, 0.5, 1.0, 1.0); // Reset color
            this.invalidate();
        };

        // Keeps background drawing
        this.always(() => {
            this.invalidate();
        });
    }
}
