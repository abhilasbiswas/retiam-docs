import { Scene, Color, CameraController, Vec2, CustomAnimation, Poly, Rate, SDFText, SDFVolume, OrbitCameraController, VGroup, CameraModel, DOWN, Entity, GrowFromCenter, SDF2D } from "retiam";
import { demoBackground } from "../../shared/presentation";





export default class SDF2DDemo extends Scene {

    public async run() {
        // 1. Setup Camera for a clean 2D Orthographic view
        // this.camera.model = CameraModel.ORTHOGRAPHIC;
        // this.camera.orthoScale = 24;
        this.camera.position.set([0, 0, 30]);
        this.clearColor(demoBackground()); // Dark slate background
        new OrbitCameraController(this, this.camera);

        // 2. Define the Catalog of SDF Shapes
        const shapesConfig = [
            { name: "Circle", logic: `return sdCircle(p, 1.8);`, color: new Color(1.0, 0.3, 0.3, 1.0) },
            { name: "Box", logic: `return sdBox(p, vec2<f32>(1.8, 1.2));`, color: new Color(1.0, 0.6, 0.2, 1.0) },
            { name: "Rounded Box", logic: `return sdRoundedBox(p, vec2<f32>(1.5, 1.0), vec4<f32>(0.5, 0.3, 0.1, 0.8));`, color: new Color(1.0, 0.9, 0.2, 1.0) },

            { name: "Segment", logic: `return sdSegment(p, vec2<f32>(-1.2, -1.0), vec2<f32>(1.2, 1.0)) - 0.3;`, color: new Color(0.6, 1.0, 0.2, 1.0) },
            { name: "Rhombus", logic: `return sdRhombus(p, vec2<f32>(1.5, 1.2));`, color: new Color(0.2, 1.0, 0.4, 1.0) },
            { name: "Eq Triangle", logic: `return sdEquilateralTriangle(p, 1.8);`, color: new Color(0.2, 1.0, 0.8, 1.0) },

            { name: "Iso Triangle", logic: `return sdTriangleIsosceles(p, vec2<f32>(1.2, -2.0));`, color: new Color(0.2, 0.8, 1.0, 1.0) },
            { name: "Hexagon", logic: `return sdHexagon(p, 1.5);`, color: new Color(0.2, 0.4, 1.0, 1.0) },
            { name: "Octagon", logic: `return sdOctagon(p, 1.6);`, color: new Color(0.5, 0.2, 1.0, 1.0) },

            { name: "Hexagram", logic: `return sdHexagram(p, 1.0);`, color: new Color(0.8, 0.2, 1.0, 1.0) },
            { name: "Star", logic: `return sdStar(p, 1.8, 5.0, 3.0);`, color: new Color(1.0, 0.2, 0.8, 1.0) },
            { name: "Pie", logic: `return sdPie(p, vec2<f32>(0.866, 0.5), 1.8);`, color: new Color(1.0, 0.2, 0.5, 1.0) },

            { name: "Arc", logic: `return sdArc(p, vec2<f32>(0.866, 0.5), 1.5, 0.2);`, color: new Color(0.9, 0.4, 0.4, 1.0) },
            { name: "Vesica", logic: `return sdVesica(p, 2.0, 0.8);`, color: new Color(0.9, 0.6, 0.4, 1.0) },
            { name: "Cross", logic: `return sdCross(p, vec2<f32>(1.5, 0.5), 0.2);`, color: new Color(0.9, 0.9, 0.4, 1.0) },
        ];

        // 3. Build the Grid Layout
        const grid = new VGroup();
        const cards: Entity[] = [];

        for (const config of shapesConfig) {
            const card = this.createCard(config.name, config.logic, config.color);
            grid.add(card);
            cards.push(card);
        }

        // Arrange in 5 Columns, 3 Rows with spacing
        grid.arrangeInGrid(3, 5, [1.5, 2.0]);
        this.add(grid);

        // 4. Pre-Animation Setup: Hide elements safely
        for (const card of cards) {
            card.VISIBILITY = false;
        }

        await this.wait(500);

        // 5. Sequential Pop-in Animation
        for (const card of cards) {
            card.VISIBILITY = true;

            this.play(new GrowFromCenter(card, {
                duration: 600,
                rate_func: Rate.easeOutBack(1.5) // Adds a nice bouncy overshoot
            }));
            await this.wait(100);
        }

        // 6. Ambient Hover effect
        this.always(() => {
            const time = this.time * 0.002;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                // Smoothly Bob up and down (Y scale is mapped natively to Transform shifts)
                const yOffset = Math.sin(time + i * 0.5) * 0.01;
                card.transform.shift([0, yOffset, 0]);
            }
            this.invalidate();
        });
    }

    /**
     * Helper to create a single display card containing the SDF and its label
     */
    private createCard(name: string, mapLogic: string, color: Color): Entity {
        const container = new Entity();

        // Ensure the Container computes a safe bounding box for the Grid system
        // The VGroup uses .width and .height or duck-types existing bounding box bounds
        (container as any).width = 4.0;
        (container as any).height = 4.0;

        // The SDF shape itself - Set 4.5 bounds so 2.0 radiuses fit comfortably
        const shape = new SDF2D(4.5, 4.5, mapLogic);
        shape.paint.fill = color;
        shape.paint.stroke = Color.WHITE;
        shape.paint.strokeWidth = 0.06;

        // Add subtle glass/gradient effect using alpha
        shape.paint.opacity = 0.85;

        // The Text Label
        const label = new SDFText(name, { fontSize: 0.5 });
        label.paint.fill = Color.WHITE;

        // Add to container
        container.add(shape, label);

        // Align label text perfectly underneath the shape
        label.nextTo(shape, DOWN, 0.2);

        return container;
    }
}
