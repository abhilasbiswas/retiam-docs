import { demoBackground, frameStage, demoCaption } from "../../shared/presentation";

import { Scene, Color, Camera2DController, Circle, Spline, Vec3, Vec2, WHITE, NONE, RED, CurveType, Instanced, Quaternion, Noise } from "retiam";

// ===================================================================
// Fish body builder — creates a chain of plain Dot objects + a visible
// B-Spline that is reshaped every frame to form a fish silhouette.
// Using plain objects instead of Entity instances avoids 6N scene-graph
// nodes (update/traverse/syncState overhead) for invisible physics dots.
// ===================================================================

/** Lightweight physics dot — no Entity overhead, just position + rotation. */
class Dot {
    pos: Vec3;
    rot: number = 0;
    constructor(x: number, y: number) { this.pos = new Vec3(x, y, 0); }
}

interface Fish {
    dots: Dot[];
    spline: Spline;
    ds: number[];
    n: number;
    r: number;
    outlinePoints: Vec3[];
}

function createFish(
    scene: Scene,
    n: number, r: number,
    bodyColor: Color, strokeColor: Color,
    strokeWidth: number, scale: number,
    startPos: Vec3
): Fish {
    const ds: number[] = [];
    const baseSizes = [2.0, 3.0, 2.8, 2.2, 1.4, 0.5];
    for (let i = 0; i < n; i++) {
        ds.push((baseSizes[i % baseSizes.length] ?? (n - i) * 0.5) * scale);
    }

    const rScaled = r * scale;
    const dots: Dot[] = [];
    for (let i = 0; i < n; i++) {
        dots.push(new Dot(startPos.x + rScaled * 2 * i, startPos.y));
    }

    const outlinePoints: Vec3[] = [];
    for (let i = 0; i < n * 2 + 2; i++) {
        outlinePoints.push(new Vec3(0, 0, 0));
    }

    const spline = new Spline(outlinePoints, {
        tension: 0.50,
        stroke: strokeColor,
        strokeWidth: strokeWidth * scale,
        fill: bodyColor,
        closed: true,
        overlap: true,
        type: CurveType.BSpline,
        maxSegments: 64,
        method: 'analytical',
        tolerance: 0.1,
        extruder: 'gpu',
        adaptivePixelTolerance: 1,
        adaptiveToleranceMargin: 0.5,
    });

    // Only add the spline — dots are plain JS objects, not scene entities.
    scene.add(spline);
    return { dots, spline, ds, n, r: rScaled, outlinePoints };
}

// ===================================================================
// Shared physics helpers
// ===================================================================
const directionAngle = (a: Vec3, b: Vec3): number => {
    return Math.atan2(b.y - a.y, b.x - a.x);
};

const clampAngle = (angle: number, refAngle: number, maxDelta: number): number => {
    let delta = angle - refAngle;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    if (delta > maxDelta) delta = maxDelta;
    if (delta < -maxDelta) delta = -maxDelta;
    return refAngle + delta;
};

function updateFishChain(fish: Fish, maxAngle: number) {
    const { dots, spline, ds, n, r, outlinePoints } = fish;

    // Constrain chain distances
    for (let i = 1; i < n; i++) {
        const dx = dots[i].pos.x - dots[i - 1].pos.x;
        const dy = dots[i].pos.y - dots[i - 1].pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.0001) {
            const k = r / dist;
            dots[i].pos.x = dots[i - 1].pos.x + dx * k;
            dots[i].pos.y = dots[i - 1].pos.y + dy * k;
        }
    }

    // Constrain max angle between segments
    for (let i = 2; i < n; i++) {
        const prevAngle = directionAngle(dots[i - 2].pos, dots[i - 1].pos);
        const currAngle = directionAngle(dots[i - 1].pos, dots[i].pos);
        const clamped = clampAngle(currAngle, prevAngle, maxAngle);
        if (clamped !== currAngle) {
            dots[i].pos.x = dots[i - 1].pos.x + Math.cos(clamped) * r;
            dots[i].pos.y = dots[i - 1].pos.y + Math.sin(clamped) * r;
        }
    }

    // Orient each dot
    dots[0].rot = directionAngle(dots[0].pos, dots[1].pos);
    for (let i = 1; i < n - 1; i++) {
        dots[i].rot = directionAngle(dots[i - 1].pos, dots[i + 1].pos);
    }
    dots[n - 1].rot = directionAngle(dots[n - 2].pos, dots[n - 1].pos);

    // Build body outline
    for (let i = 0; i < n; i++) {
        const a = dots[i].rot;
        const sinA = Math.sin(a);
        const cosA = Math.cos(a);

        const o1x = -sinA * ds[i];
        const o1y = cosA * ds[i];

        outlinePoints[i].x = dots[i].pos.x + o1x;
        outlinePoints[i].y = dots[i].pos.y + o1y;

        const o2x = -sinA * -ds[i];
        const o2y = cosA * -ds[i];

        outlinePoints[2 * n - i].x = dots[i].pos.x + o2x;
        outlinePoints[2 * n - i].y = dots[i].pos.y + o2y;
    }

    let angle = dots[0].rot;
    const startX = dots[0].pos.x + Math.cos(angle) * -ds[0];
    const startY = dots[0].pos.y + Math.sin(angle) * -ds[0];
    outlinePoints[2 * n + 1].x = startX;
    outlinePoints[2 * n + 1].y = startY;

    angle = dots[n - 1].rot;
    const endX = dots[n - 1].pos.x + Math.cos(angle) * ds[n - 1];
    const endY = dots[n - 1].pos.y + Math.sin(angle) * ds[n - 1];
    outlinePoints[n].x = endX;
    outlinePoints[n].y = endY;

    spline.setPoints(outlinePoints);
}

// ===================================================================
// Scene
// ===================================================================
export default class MyScene extends Scene {
    public async run() {
        this.disablePlayer();

        this.ALWAYS_UPDATE = true;
        this.setBackgroundColor(demoBackground());
        this.camera.toOrtho(500);
        new Camera2DController(this, this.camera);
        frameStage(this, 800, 620);
        demoCaption(this, "Procedural fish field", "Move the pointer to guide the red fish through the school");

        const maxAngle = Math.PI / 4;

        // -----------------------------------------------------------
        // 1. Hero fish (mouse-controlled)
        // -----------------------------------------------------------
        const hero = createFish(
            this, 6, 4,
            RED, WHITE, 0.3, 1.0,
            new Vec3(0, 0, 0)
        );

        // -----------------------------------------------------------
        // 2. Schooling fish (procedural spline fish, smaller)
        // -----------------------------------------------------------
        const SCHOOL_COUNT = 2500;
        const schoolFish: Fish[] = [];
        const schoolTargets: Vec3[] = [];
        const noise = Noise.perlin({ seed: 42 });

        const fishColors = [
            new Color(1.0, 0.55, 0.1, 1),   // orange
            new Color(0.2, 0.7, 1.0, 1),     // blue
            new Color(1.0, 0.85, 0.2, 1),    // gold
            new Color(0.3, 0.9, 0.5, 1),     // green
            new Color(0.9, 0.3, 0.6, 1),     // pink
            new Color(0.6, 0.4, 1.0, 1),     // purple
        ];

        for (let i = 0; i < SCHOOL_COUNT; i++) {
            const scale = 0.35 + Math.random() * 0.35;
            const color = fishColors[i % fishColors.length];
            const strokeC = new Color(color.r * 0.8, color.g * 0.8, color.b * 0.8, 1);
            const startX = (Math.random() - 0.5) * 560;
            const startY = (Math.random() - 0.5) * 360;

            const f = createFish(
                this, 6, 4,
                color, WHITE, 0.5, scale,
                new Vec3(startX, startY, 0)
            );
            schoolFish.push(f);
            schoolTargets.push(new Vec3(startX, startY, 0));
        }

        // -----------------------------------------------------------
        // 3. GPU Instanced background fish (small circles as particles)
        // -----------------------------------------------------------
        const INSTANCE_COUNT = 1;
        const baseParticle = new Circle(1.2);
        baseParticle.paint.fill = new Color(0.3, 0.6, 1.0, 0.5);

        const school = new Instanced(baseParticle, INSTANCE_COUNT);
        this.add(school);

        // Per-instance state
        const fishState = new Float32Array(INSTANCE_COUNT * 4); // x, y, vx, vy
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            const idx = i * 4;
            fishState[idx + 0] = (Math.random() - 0.5) * 600;     // x
            fishState[idx + 1] = (Math.random() - 0.5) * 400;     // y
            fishState[idx + 2] = (Math.random() - 0.5) * 0.3;     // vx
            fishState[idx + 3] = (Math.random() - 0.5) * 0.3;     // vy

            const s = 0.5 + Math.random() * 1.5;
            school.setInstanceScale(i, s);

            // Randomize color: ocean palette
            const hue = 0.5 + Math.random() * 0.15; // cyan-blue range
            const sat = 0.4 + Math.random() * 0.4;
            const lum = 0.3 + Math.random() * 0.4;
            const c = Color.fromHSL(hue, sat, lum);
            c.a = 0.4 + Math.random() * 0.4;
            school.setInstanceColor(i, c);
        }
        school.updateInstances();

        // -----------------------------------------------------------
        // Frame loop
        // -----------------------------------------------------------
        // Hero head target position — updated on mousemove, lerped in always().
        let heroTarget = hero.dots[0].pos.clone();

        this.setEvent("mousemove", (position: Vec3) => {
            heroTarget = position;
        }, { contextAware: false });

        // Pre-allocate temporaries outside the frame loop (zero per-frame allocation)
        const tmpPos = new Vec3();
        const tmpRot = new Quaternion();

        this.always(() => {
            const t = this.time * 0.001;

            // --- Hero fish physics: lerp head toward mouse ---
            const h = hero.dots[0].pos;
            h.x += (heroTarget.x - h.x) * 0.1;
            h.y += (heroTarget.y - h.y) * 0.1;
            updateFishChain(hero, maxAngle);

            // --- School fish: noise-driven swimming ---
            for (let si = 0; si < SCHOOL_COUNT; si++) {
                const f = schoolFish[si];
                const head = f.dots[0].pos;

                // Flow field from noise
                const nx = noise.sample2D(head.x * 0.008 + t * 0.3, head.y * 0.008 + si * 10) * 0.6;
                const ny = noise.sample2D(head.x * 0.008 + 100 + si * 10, head.y * 0.008 + t * 0.3) * 0.6;

                head.x += nx;
                head.y += ny;
                updateFishChain(f, maxAngle);

                // No boundary wrap-around, fishes swim infinitely
            }

            // --- Instanced background particles ---

            for (let i = 0; i < INSTANCE_COUNT; i++) {
                const idx = i * 4;
                let x = fishState[idx + 0];
                let y = fishState[idx + 1];
                let vx = fishState[idx + 2];
                let vy = fishState[idx + 3];

                // Perlin noise flow field
                const fx = noise.sample2D(x * 0.005 + t * 0.2, y * 0.005 + i * 0.1) * 0.015;
                const fy = noise.sample2D(x * 0.005 + 50, y * 0.005 + t * 0.2 + i * 0.1) * 0.015;

                vx = vx * 0.98 + fx;
                vy = vy * 0.98 + fy;

                // Clamp speed
                const speed = Math.sqrt(vx * vx + vy * vy);
                if (speed > 0.5) { vx *= 0.5 / speed; vy *= 0.5 / speed; }

                x += vx;
                y += vy;

                // No boundary wrap-around, particles swim infinitely

                fishState[idx + 0] = x;
                fishState[idx + 1] = y;
                fishState[idx + 2] = vx;
                fishState[idx + 3] = vy;

                tmpPos.x = x; tmpPos.y = y; tmpPos.z = -1;
                school.setInstancePosition(i, tmpPos);

                // Rotate to face movement direction
                const angle = Math.atan2(vy, vx);
                const halfAngle = angle * 0.5;
                tmpRot.x = 0;
                tmpRot.y = 0;
                tmpRot.z = Math.sin(halfAngle);
                tmpRot.w = Math.cos(halfAngle);
                school.setInstanceRotation(i, tmpRot);
            }
            school.updateInstances();
        });
    }
}
