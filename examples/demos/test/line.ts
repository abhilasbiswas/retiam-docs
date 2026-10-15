import { Scene, CameraController, Text, Vec3, Line3D, CapType, Color, Rect, JointType, Line, Vec2, CENTER } from "retiam";
import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";



export default class LineTestScene extends Scene {

    public async run() {
        // 1. Setup Camera and Background
        this.camera.position.set([0, 0, 30]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground()); // Dark grey-blue background
        frameStage(this, 28, 25);
        demoCaption(this, "Line joins and streaming vertices", "Miter, round and bevel joins alongside a changing path");

        // =========================================================
        // TEST 1: JOINT TYPES (Top Row)
        // =========================================================
        const createZigZag = (offsetX: number, joint: JointType, color: Color, label: string) => {
            // Very sharp acute angles to stress-test miter limits and joints
            const points = [
                new Vec2(offsetX - 2, 8),
                new Vec2(offsetX + 0, 4),
                new Vec2(offsetX - 1.5, 6),
                new Vec2(offsetX + 1.5, 4),
                new Vec2(offsetX + 2, 8)
            ];

            const line = new Line(points);
            line.paint.stroke = color;
            line.paint.strokeWidth = 0.6; // Thick stroke to make joints obvious
            line.paint.joint = joint;
            line.paint.cap = CapType.ROUND;
            this.add(line);

            const txt = new Text(label, { fontSize: 0.65, fill: Color.WHITE, anchor: CENTER });
            txt.move([offsetX, 2, 0]);
            this.add(txt);
        };

        createZigZag(-6, JointType.MITER, new Color(1.0, 0.3, 0.3, 0.5), "Miter Joint");
        createZigZag(0, JointType.ROUND, new Color(0.3, 1.0, 0.5, 0.5), "Round Joint");
        createZigZag(6, JointType.BEVEL, new Color(0.3, 0.6, 1.0, 0.75), "Bevel Joint");


        // =========================================================
        // TEST 2: TRANSFORMATIONS (Middle Row - Left)
        // =========================================================
        // Draw a star shape to test local matrix rotations and scaling
        const starPoints: Vec2[] = [];
        const numPoints = 5;
        const rOuter = 2;
        const rInner = 0.8;
        for (let i = 0; i <= numPoints * 2; i++) {
            const r = i % 2 === 0 ? rOuter : rInner;
            const a = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
            starPoints.push(new Vec2(Math.cos(a) * r, Math.sin(a) * r));
        }

        const rotatingStar = new Line(starPoints);
        rotatingStar.paint.stroke = new Color(1.0, 0.8, 0.2, 1.0); // Gold
        rotatingStar.paint.strokeWidth = 0.2;
        rotatingStar.paint.joint = JointType.ROUND;
        rotatingStar.shift(new Vec3(-6, -2, 0));
        this.add(rotatingStar);

        const starTxt = new Text("Matrix Transform", { fontSize: 0.6, fill: Color.WHITE });
        starTxt.move([-6, -5, 0]);
        this.add(starTxt);


        // =========================================================
        // TEST 3: HIGH-DENSITY DYNAMIC PERFORMANCE (Middle to Right)
        // =========================================================
        // 2,000 vertices streaming every single frame.
        // With Line3D this would lag heavily due to Compute Shaders.
        // With FastLine it should be completely instantaneous.
        const waveSamples = 2000;
        const waveData = new Float32Array(waveSamples * 2);

        const waveLine = new Line([]);
        waveLine.paint.stroke = new Color(0.0, 1.0, 0.8, 1.0); // Cyan
        waveLine.paint.strokeWidth = 0.1;
        this.add(waveLine);

        const waveTxt = new Text("2,000 Pts Dynamic Stream", { fontSize: 0.6, fill: Color.WHITE });
        waveTxt.move([3, -5, 0]);
        this.add(waveTxt);


        // =========================================================
        // TEST 4: THICKNESS OVERLAPS AND ALPHA BLENDING (Bottom)
        // =========================================================
        // Testing how well the geometry handles self-intersection and alpha
        const scribblePoints: Vec2[] = [];
        for (let i = 0; i < 50; i++) {
            scribblePoints.push(new Vec2(
                (Math.random() - 0.5) * 16,
                -9 + (Math.random() - 0.5) * 2
            ));
        }
        const scribbleLine = new Line(scribblePoints);
        scribbleLine.paint.stroke = new Color(1.0, 0.2, 0.8, 0.5); // 50% opacity Pink
        scribbleLine.paint.strokeWidth = 0.4;
        scribbleLine.paint.joint = JointType.ROUND;
        this.add(scribbleLine);


        // =========================================================
        // UPDATE LOOP
        // =========================================================
        this.always(() => {
            // 1. Rotate the star to verify local matrices apply correctly to the geometry
            rotatingStar.transform.rotateWorldZ(this.dt * 0.001);

            // 2. Stream 2,000 raw floats into the line buffer dynamically
            const timeOffset = this.time * 0.003;
            for (let i = 0; i < waveSamples; i++) {
                const t = i / (waveSamples - 1);

                // Map X from -2 to 10
                const x = -2 + t * 12;

                // Complex interference wave
                const y = -2 + Math.sin(x * 2 + timeOffset) * 1.5
                    + Math.cos(x * 5 - timeOffset * 1.5) * 0.5;

                waveData[i * 2] = x;
                waveData[i * 2 + 1] = y;
            }

            // Upload flat memory straight to the GPU
            waveLine.setRawVertices(waveData);

            // Force redraw since we mutated the buffer
            this.invalidate();
        });
    }
}
