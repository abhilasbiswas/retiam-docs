
import { Scene, Text, Color, CameraController, Circle, UP, Rect, LEFT, VGroup } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class LayoutTestScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 50]);
        this.clearColor(demoBackground());
        new CameraController(this, this.camera);


        // 1. Grid of circles (each radius 1.5, making them 3 units wide)
        const circles = [];
        for (let i = 0; i < 9; i++) {
            let c = new Circle(1.5);
            c.paint.fill = Color.random();
            circles.push(c);
        }

        const grid = new VGroup(...circles);
        grid.arrangeInGrid(3, 3, 0.5); // Grid elements spaced cleanly
        this.add(grid);

        // 2. Proportionate Text (fontSize = 2.5 to match the coordinate scale)
        const label = new Text("3x3 Circle Grid", { fontSize: 2.5 });
        label.paint.fill = Color.WHITE;
        label.nextTo(grid, UP, 1.0); // 1.0 unit above the grid
        this.add(label);

        // 3. Proportional side box
        const sideBox = new Rect(1.5, 9.5); // matches grid height
        sideBox.paint.fill = Color.BLUE;
        sideBox.nextTo(grid, LEFT, 1.0);
        sideBox.alignTo(grid, UP);
        this.add(sideBox);

        this.always(() => {
            this.invalidate();
        });
    }
}
