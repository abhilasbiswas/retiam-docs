// =========================================================================
// File: examples/demos/shapes_paths_2d/path_vertex_animation.ts
// =========================================================================

import { Scene } from "retiam";
import { CameraController } from "retiam";
import { Color } from "retiam";
import { Vec2 } from "retiam";
import { Vec3 } from "retiam";
import { Path } from "retiam";
import { Spline } from "retiam";
import { CurveType } from "retiam";
import { Poly } from "retiam";
import { SDFText } from "retiam";
import { CENTER } from "retiam";
import { demoBackground } from "../../shared/presentation";

/**
 * 2D Procedural Vertex Kinematics Demo
 *
 * Demonstrates high-performance per-frame procedural vertex manipulation
 * across Retiam's 3 native 2D primitives without any engine modifications:
 *
 * 1. Path.setRawContour(flatArray)
 *    - Updates raw quadratic Bézier control poles & endpoints directly to GPU storage buffers.
 * 2. Spline.setPoints(Vec3[])
 *    - Zero-allocation per-frame control point updates with GPU Catmull-Rom spline tessellation.
 * 3. Poly.setVertices(Vec2[], isClosed)
 *    - Direct per-frame closed polygon vertex kinematic updates.
 */
export default class PathVertexAnimationScene extends Scene {
    public async run() {
        // 1. Camera & Canvas Dark Obsidian Palette
        this.camera.position.set([0, 0, 75]);
        new CameraController(this, this.camera);
        this.clearColor(demoBackground());

        // 2. Crisp Typographic Headers
        const mainTitle = new SDFText("2D Procedural Vertex Kinematics", {
            fontSize: 2.8,
            anchor: CENTER,
            position: [0, 20.0, 0],
            fill: new Color(0.95, 0.98, 1.0, 1.0)
        });
        this.add(mainTitle);

        const subtitle = new SDFText("Zero Engine Modifications • Native Path.setRawContour • Spline.setPoints • Poly.setVertices", {
            fontSize: 1.3,
            anchor: CENTER,
            position: [0, 17.0, 0],
            fill: new Color(0.55, 0.65, 0.8, 0.9)
        });
        this.add(subtitle);

        // =========================================================================
        // TRACK 1: Native Path.setRawContour (Dynamic Quadratic Bezier Wave)
        // =========================================================================
        const labelWave = new SDFText("1. Path.setRawContour  |  Dynamic GPU Quadratic Bezier Traveling Wave", {
            fontSize: 1.25,
            anchor: CENTER,
            position: [0, 13.5, 0],
            fill: new Color(0.0, 0.92, 1.0, 0.95)
        });
        this.add(labelWave);

        // Create Path with initial placeholder line
        const wavePath = new Path("M -32 8.5 L 32 8.5", {
            stroke: new Color(0.0, 0.92, 1.0, 0.95),
            strokeWidth: 0.4,
            fill: new Color(0.0, 0.0, 0.0, 0.0)
        });
        this.add(wavePath);

        // Pre-allocated flat contour array for zero GC pressure:
        // 32 quadratic segments = 32 * 2 + 1 = 65 points = 130 floats
        const waveSegments = 32;
        const wavePointCount = 1 + 2 * waveSegments;
        const waveContour = new Array<number>(wavePointCount * 2);

        function waveFn(x: number, time: number): number {
            const baseY = 8.5;
            const w1 = Math.sin(x * 0.18 + time * 3.0) * 2.4;
            const w2 = Math.cos(x * 0.36 - time * 2.1) * 1.0;
            const w3 = Math.sin(x * 0.55 + time * 4.2) * 0.4;
            return baseY + w1 + w2 + w3;
        }

        // =========================================================================
        // TRACK 2: Native Spline.setPoints (Kinematic Catmull-Rom Ribbon)
        // =========================================================================
        const labelSpline = new SDFText("2. Spline.setPoints  |  Zero-Allocation Catmull-Rom Kinematic Ribbon", {
            fontSize: 1.25,
            anchor: CENTER,
            position: [0, 2.8, 0],
            fill: new Color(1.0, 0.28, 0.72, 0.95)
        });
        this.add(labelSpline);

        const splineControlCount = 21;
        const initialSplinePoints: Vec3[] = [];
        for (let i = 0; i < splineControlCount; i++) {
            const u = i / (splineControlCount - 1);
            const x = -32 + u * 64;
            initialSplinePoints.push(new Vec3(x, -2.5, 0));
        }

        const ribbonSpline = new Spline(initialSplinePoints, {
            type: CurveType.CatmullRom,
            tension: 0.5,
            stroke: new Color(1.0, 0.28, 0.72, 0.95),
            strokeWidth: 0.45
        });
        this.add(ribbonSpline);

        // Persistent Vec3 points array to avoid allocation in render loop
        const activeSplinePoints: Vec3[] = initialSplinePoints.map(p => p.clone());

        // =========================================================================
        // TRACK 3: Native Poly.setVertices (Fourier Harmonic Morphing Blobs)
        // =========================================================================
        const labelPoly = new SDFText("3. Poly.setVertices  |  Per-Frame Closed Polygon Fourier Harmonics", {
            fontSize: 1.25,
            anchor: CENTER,
            position: [0, -7.5, 0],
            fill: new Color(0.0, 1.0, 0.65, 0.95)
        });
        this.add(labelPoly);

        const blobVertexCount = 64;
        const leftBlobCenter = new Vec2(-14, -15.0);
        const rightBlobCenter = new Vec2(14, -15.0);

        const leftBlobVertices: Vec2[] = [];
        const rightBlobVertices: Vec2[] = [];
        for (let i = 0; i < blobVertexCount; i++) {
            leftBlobVertices.push(new Vec2(leftBlobCenter.x, leftBlobCenter.y));
            rightBlobVertices.push(new Vec2(rightBlobCenter.x, rightBlobCenter.y));
        }

        // Emerald Star Harmonic Blob
        const leftBlob = new Poly(leftBlobVertices, {
            isClosed: true,
            stroke: new Color(0.0, 1.0, 0.65, 0.95),
            strokeWidth: 0.4,
            fill: new Color(0.0, 0.8, 0.45, 0.18)
        });
        this.add(leftBlob);

        // Amber/Gold Multi-Harmonic Blob
        const rightBlob = new Poly(rightBlobVertices, {
            isClosed: true,
            stroke: new Color(1.0, 0.82, 0.2, 0.95),
            strokeWidth: 0.4,
            fill: new Color(1.0, 0.65, 0.1, 0.18)
        });
        this.add(rightBlob);

        // Live Performance & Telemetry Readout
        const telemetryText = new SDFText("Kinematics: 60 FPS • 214 Dynamic Vertices Streamed • Zero Heap Allocations", {
            fontSize: 1.1,
            anchor: CENTER,
            position: [0, -20.5, 0],
            fill: new Color(0.48, 0.58, 0.72, 0.9)
        });
        this.add(telemetryText);

        // 3. High-Performance Per-Frame Procedural Animation Loop
        let startTime = performance.now();
        let frameCount = 0;
        let lastFpsTime = startTime;

        this.always(() => {
            const now = performance.now();
            const elapsed = (now - startTime) * 0.001;
            frameCount++;

            // -----------------------------------------------------------------
            // 1. Update Path.setRawContour (Dynamic Bézier Wave)
            // -----------------------------------------------------------------
            const xMin = -32;
            const xMax = 32;
            const step = (xMax - xMin) / waveSegments;

            // Start point (x0, y0)
            const startY = waveFn(xMin, elapsed);
            waveContour[0] = xMin;
            waveContour[1] = startY;

            let contourIdx = 2;
            for (let i = 0; i < waveSegments; i++) {
                const segX0 = xMin + i * step;
                const segX1 = xMin + (i + 1) * step;
                const segXMid = (segX0 + segX1) * 0.5;

                const yMid = waveFn(segXMid, elapsed);
                const y0 = waveFn(segX0, elapsed);
                const y1 = waveFn(segX1, elapsed);

                // Quadratic Bézier control point to interpolate through (segXMid, yMid):
                // B(0.5) = 0.25*y0 + 0.5*cpY + 0.25*y1  =>  cpY = 2*yMid - 0.5*(y0 + y1)
                const cpX = segXMid;
                const cpY = 2.0 * yMid - 0.5 * (y0 + y1);

                waveContour[contourIdx++] = cpX;
                waveContour[contourIdx++] = cpY;
                waveContour[contourIdx++] = segX1;
                waveContour[contourIdx++] = y1;
            }

            // Push the flat contour directly to the GPU
            wavePath.setRawContour(waveContour);

            // -----------------------------------------------------------------
            // 2. Update Spline.setPoints (Kinematic Catmull-Rom Ribbon)
            // -----------------------------------------------------------------
            for (let i = 0; i < splineControlCount; i++) {
                const u = i / (splineControlCount - 1);
                const x = -32 + u * 64;
                // Traveling sinusoidal serpentine ribbon centered at y = -2.5
                const yRibbon = -2.5
                              + Math.sin(x * 0.22 - elapsed * 3.5) * 2.2
                              + Math.cos(x * 0.44 + elapsed * 2.2) * 0.9;
                activeSplinePoints[i].x = x;
                activeSplinePoints[i].y = yRibbon;
            }
            ribbonSpline.setPoints(activeSplinePoints);

            // -----------------------------------------------------------------
            // 3. Update Poly.setVertices (Harmonic Breathing Blobs)
            // -----------------------------------------------------------------
            for (let i = 0; i < blobVertexCount; i++) {
                const angle = (i / blobVertexCount) * Math.PI * 2;

                // Left Blob: 5-pointed organic pulsating star
                const rLeft = 5.2
                    + 1.4 * Math.sin(5.0 * angle + elapsed * 3.2)
                    + 0.7 * Math.cos(3.0 * angle - elapsed * 2.1)
                    + 0.4 * Math.sin(10.0 * angle + elapsed * 4.5);
                leftBlobVertices[i].x = leftBlobCenter.x + Math.cos(angle) * rLeft;
                leftBlobVertices[i].y = leftBlobCenter.y + Math.sin(angle) * rLeft;

                // Right Blob: Pulsating amoeba with frequency-beating harmonic modulation
                const rRight = 5.2
                    + 1.3 * Math.cos(4.0 * angle - elapsed * 2.8)
                    + 0.9 * Math.sin(6.0 * angle + elapsed * 3.6)
                    + 0.5 * Math.cos(8.0 * angle - elapsed * 1.5);
                rightBlobVertices[i].x = rightBlobCenter.x + Math.cos(angle) * rRight;
                rightBlobVertices[i].y = rightBlobCenter.y + Math.sin(angle) * rRight;
            }
            leftBlob.setVertices(leftBlobVertices, true);
            rightBlob.setVertices(rightBlobVertices, true);

            // -----------------------------------------------------------------
            // 4. Update Telemetry Display Every ~500ms
            // -----------------------------------------------------------------
            if (now - lastFpsTime >= 500) {
                const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
                frameCount = 0;
                lastFpsTime = now;
                telemetryText.text = `Live Kinematics: ${fps} FPS • 214 Dynamic Vertices Streamed • Time: ${elapsed.toFixed(1)}s`;
            }

            this.invalidate();
        });
    }
}
