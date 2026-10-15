import { demoBackground, demoCaption } from "../../shared/presentation";
import {
    Scene,
    Camera2DController,
    Circle,
    Rect,
    Vec3,
    Color,
    Text,
    Group
} from "retiam";

export default class Camera2DDemoScene extends Scene {
    private controller!: Camera2DController;
    private player!: Circle;
    private isFollowing: boolean = true;
    private hasBounds: boolean = true;

    public async run() {
        // 1. Initialize 2D Camera Controller with world bounds and initial position
        this.controller = new Camera2DController(this, this.camera, {
            bounds: { minX: -200, maxX: 200, minY: -200, maxY: 200 },
            moveSpeed: 80.0,
            damping: 12.0,
            zoomSpeed: 0.12,
            minZoom: 10.0,
            maxZoom: 400.0,
            orthoScale: 200
        });
        this.clearColor(demoBackground());
        demoCaption(this, "Camera follow and world bounds", "T: follow · B: bounds · WASD: pan · wheel: zoom");

        // 2. Build World Boundary Outline Box (-200 to 200)
        const boundsBox = new Rect(400, 400);
        boundsBox.paint.fill = new Color(0.05, 0.07, 0.12, 1.0);
        boundsBox.paint.setStroke(0.1, new Color(0.2, 0.5, 0.9, 0.8));
        this.add(boundsBox);

        // 3. Grid of decorative background world shapes
        const worldGroup = new Group();
        for (let x = -150; x <= 150; x += 50) {
            for (let y = -150; y <= 150; y += 50) {
                if (x === 0 && y === 0) continue;
                const shape = new Circle(4);
                shape.transform.position = new Vec3(x, y, 0);
                const hue = ((x + 200) + (y + 200)) / 800;
                shape.paint.fill = Color.fromHSL(hue, 0.7, 0.6, 0.8);
                worldGroup.add(shape);
            }
        }
        this.add(...worldGroup.entities);

        // 4. Create Moving Player Target Entity
        this.player = new Circle(8);
        this.player.paint.fill = new Color(0.9, 0.3, 0.2, 1.0);
        this.player.paint.setStroke(0.15, new Color(1.0, 0.8, 0.2, 1.0));
        this.add(this.player);

        // Start following player entity
        this.controller.follow(this.player, {
            damping: 8.0,
            deadzone: { width: 30, height: 30 },
            lookAheadFactor: 0.4
        });

        // 5. Animate Player moving in an orbiting figure-8 pattern
        let angle = 0;
        // this.always(() => {
        //     if (this.timeScale > 0) {
        //         const dt = (this.dt * 0.001) * this.timeScale;
        //         angle += dt * 0.8;
        //         const posX = Math.sin(angle) * 120;
        //         const posY = Math.sin(angle * 2) * 60;
        //         this.player.transform.position = new Vec3(posX, posY, 0.1);
        //     }
        // });

        // 6. Interactive Keyboard Shortcuts for Demo Features
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // 't' -> Toggle Target Following
            if (key === 't') {
                this.isFollowing = !this.isFollowing;
                if (this.isFollowing) {
                    this.controller.follow(this.player, {
                        damping: 8.0,
                        deadzone: { width: 30, height: 30 },
                        lookAheadFactor: 0.4
                    });
                } else {
                    this.controller.follow(null);
                }
            }

            // 'b' -> Toggle World Bounds Clamping
            if (key === 'b') {
                this.hasBounds = !this.hasBounds;
                this.controller.setBounds(this.hasBounds ? { minX: -200, maxX: 200, minY: -200, maxY: 200 } : null);
            }

            // 's' -> Trigger Camera Shake
            if (key === 's') {
                this.controller.shake(12.0, 0.6, 30);
            }

            // 'f' -> Zoom to Fit all world objects
            if (key === 'f') {
                this.controller.zoomToFit(worldGroup.entities, 1.2, 0.8);
            }

            // 'r' -> Reset Camera
            if (key === 'r') {
                this.controller.reset(0.5);
            }
        });
    }
}
