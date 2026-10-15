import { Scene, Color, Circle, Vec2, Delay, Probe, Vec3, CENTER } from "retiam";
import { frameStage, motionHeading } from "../../shared/presentation";

export default class DelayDemo extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 20]);
        frameStage(this, 24, 16);
        motionHeading(this, "Delayed motion · move your pointer", 6);
        // Track the mouse position
        const targetPos = new Vec3(0, 0, 0);

        this.setEvent("mousemove", (pos) => {
            targetPos.set(pos.x, pos.y, 0);
        });

        // Create a delay tracker for the mouse position with a max duration of 500ms
        const delay = new Delay<Vec3>(500, () => targetPos.clone(), 'continuous');

        // Create 5 probes at 100ms intervals
        const probes: Probe<Vec3>[] = [];
        const circles: Circle[] = [];

        // Colors for the trail
        const colors = [
            Color.RED,
            Color.CYAN,
            Color.YELLOW,
            Color.GREEN,
            Color.BLUE
        ];

        for (let i = 1; i <= 5; i++) {
            const probe = delay.probe(i * 100);
            probes.push(probe);

            const circle = new Circle(0.5);
            // circle.fill = true;
            circle.setFill(colors[i - 1]);
            // circle.stroke = false;
            circle.transform.position.set(0, 0); // initial position

            circles.push(circle);
            this.add(circle);
        }

        // Create a leading circle to show the immediate mouse position
        const leadCircle = new Circle(0.3);
        // leadCircle.fill = true;
        leadCircle.setFill(Color.WHITE);
        // leadCircle.stroke = false;
        this.add(leadCircle);

        // Update loop
        this.always(() => {
            // Update the delay tracker with the current time
            delay.update(this.time);

            // Update the leading circle
            leadCircle.transform.position.set(targetPos);

            // Update the trailing circles from the probes
            for (let i = 0; i < probes.length; i++) {
                const delayedPos = probes[i].value;
                if (delayedPos) {
                    circles[i].move(delayedPos, CENTER);
                }
            }
        });

        // Let the scene run indefinitely
        await this.wait(100000);
    }
}
