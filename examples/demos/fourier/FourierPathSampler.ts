// =========================================================================
// File: examples/demos/fourier/FourierPathSampler.ts
// =========================================================================

import { Vec2 } from "retiam";
import { Vec3 } from "retiam";
import type { VectorEntity } from "retiam";
import { PathGeometryUtils } from "retiam";

export interface PathSampleOptions {
    /** Target number of equispaced points to sample for Fourier Transform (default: 1024). */
    sampleCount?: number;
    /** Whether to center the shape at (0, 0) by subtracting bounding box center. Default: true. */
    center?: boolean;
    /** Target height or uniform scale in world units. If specified, scales the shape to this size. */
    scale?: number | [number, number];
    /** Whether to flip the Y axis (useful because SVG coordinates are Y-down, Retiam is Y-up). Default: false. */
    flipY?: boolean;
    /** Number of subdivisions per quadratic bezier segment before arc-length resampling. Default: 16. */
    subdivisionsPerSegment?: number;
}

export type FourierPathInput =
    | VectorEntity
    | string
    | (Vec2 | Vec3 | [number, number])[];

/**
 * Universal path discretization and normalization engine for Fourier Series animations.
 * 
 * Extracts 2D geometry from any VectorEntity (Path, SVG, Circle, Poly, etc.), raw SVG strings,
 * or coordinate arrays, and resamples them strictly equidistant by arc length.
 * Arc-length equispaced parameterization is crucial for Fourier path drawing to prevent
 * velocity jitter, clustering, and high-frequency ringing at bezier control points.
 */
export class FourierPathSampler {

    /**
     * Extracts and resamples points from any supported vector path input.
     * 
     * @param input VectorEntity, SVG string, or point array.
     * @param options Sampling, centering, scaling, and orientation options.
     * @returns Array of equispaced Vec2 points ready for Fourier analysis.
     */
    public static sample(
        input: FourierPathInput,
        options: PathSampleOptions = {}
    ): Vec2[] {
        const sampleCount = options.sampleCount ?? 1024;
        const subdivisions = options.subdivisionsPerSegment ?? 16;

        let rawPoints: Vec2[] = [];

        // 1. Ingest input into initial dense polyline
        if (Array.isArray(input)) {
            rawPoints = this.fromPointArray(input);
        } else if (typeof input === 'string') {
            rawPoints = this.fromSvgString(input, subdivisions);
        } else if (input && typeof input === 'object') {
            rawPoints = this.fromVectorEntity(input as VectorEntity, subdivisions);
        }

        if (rawPoints.length < 2) {
            return rawPoints;
        }

        // 2. Resample equidistant by arc length
        let resampled = this.resampleByArcLength(rawPoints, sampleCount);

        // 3. Normalize: Flip Y, Center, Scale
        resampled = this.normalizePoints(resampled, options);

        return resampled;
    }

    /**
     * Converts an array of Vec2 / Vec3 / tuple points into Vec2 array.
     */
    private static fromPointArray(points: (Vec2 | Vec3 | [number, number])[]): Vec2[] {
        const result: Vec2[] = new Array(points.length);
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p instanceof Vec2) {
                result[i] = p.clone();
            } else if (p instanceof Vec3) {
                result[i] = new Vec2(p.x, p.y);
            } else if (Array.isArray(p)) {
                result[i] = new Vec2(p[0], p[1]);
            } else {
                result[i] = new Vec2((p as any).x ?? 0, (p as any).y ?? 0);
            }
        }
        return result;
    }

    /**
     * Parses an SVG string (either full <svg>...</svg> or raw d="...") into points.
     */
    private static fromSvgString(svgStr: string, subdivisions: number): Vec2[] {
        const trimmed = svgStr.trim();
        const dStrings: string[] = [];

        if (trimmed.startsWith('<')) {
            // Extract all d="..." attributes from SVG tags using regex
            const dRegex = /d\s*=\s*["']([^"']+)["']/gi;
            let match: RegExpExecArray | null;
            while ((match = dRegex.exec(trimmed)) !== null) {
                if (match[1] && match[1].trim().length > 0) {
                    dStrings.push(match[1]);
                }
            }
            if (dStrings.length === 0) {
                // Try polyline/polygon points="..."
                const pointsRegex = /points\s*=\s*["']([^"']+)["']/gi;
                while ((match = pointsRegex.exec(trimmed)) !== null) {
                    const rawPts = match[1].trim().split(/[\s,]+/);
                    const pts: Vec2[] = [];
                    for (let i = 0; i < rawPts.length - 1; i += 2) {
                        pts.push(new Vec2(parseFloat(rawPts[i]), parseFloat(rawPts[i + 1])));
                    }
                    if (pts.length > 1) return pts;
                }
            }
        } else {
            dStrings.push(trimmed);
        }

        const allPoints: Vec2[] = [];
        for (const d of dStrings) {
            const decoded = PathGeometryUtils.decode(d);
            if (Array.isArray(decoded)) {
                for (const contour of decoded) {
                    const contourPts = this.sampleQuadraticContour(contour, subdivisions);
                    allPoints.push(...contourPts);
                }
            }
        }

        return allPoints;
    }

    /**
     * Samples points along a decoded quadratic bezier contour array:
     * [x0, y0, cx0, cy0, x1, y1, cx1, cy1, x2, y2, ...]
     */
    private static sampleQuadraticContour(contour: number[], subdivisions: number): Vec2[] {
        if (!contour || contour.length < 2) return [];

        const points: Vec2[] = [];
        let x0 = contour[0];
        let y0 = contour[1];
        points.push(new Vec2(x0, y0));

        const numSegments = (contour.length - 2) / 4;
        for (let seg = 0; seg < numSegments; seg++) {
            const base = 2 + seg * 4;
            const cx = contour[base];
            const cy = contour[base + 1];
            const x2 = contour[base + 2];
            const y2 = contour[base + 3];

            for (let s = 1; s <= subdivisions; s++) {
                const t = s / subdivisions;
                const mt = 1 - t;
                const t2 = t * t;
                const mt2 = mt * mt;
                const twoMtT = 2 * mt * t;

                const x = mt2 * x0 + twoMtT * cx + t2 * x2;
                const y = mt2 * y0 + twoMtT * cy + t2 * y2;
                points.push(new Vec2(x, y));
            }

            x0 = x2;
            y0 = y2;
        }

        return points;
    }

    /**
     * Extracts points from any VectorEntity hierarchy.
     */
    private static fromVectorEntity(entity: VectorEntity, subdivisions: number): Vec2[] {
        // If the entity has an svgString, decode it directly
        const anyEnt = entity as any;
        if (typeof anyEnt.svgString === 'string' && anyEnt.svgString.length > 0) {
            return this.fromSvgString(anyEnt.svgString, subdivisions);
        }

        if (typeof anyEnt.src === 'string' && anyEnt.src.length > 0) {
            return this.fromSvgString(anyEnt.src, subdivisions);
        }

        // Try extracting paths
        if (typeof entity.extractAllPaths === 'function') {
            const paths = entity.extractAllPaths();
            const allPoints: Vec2[] = [];
            for (const p of paths) {
                if (p.svgString) {
                    allPoints.push(...this.fromSvgString(p.svgString, subdivisions));
                } else if (p.geometry?.vertex_data) {
                    const vd = p.geometry.vertex_data;
                    for (let i = 0; i < vd.length - 1; i += 2) {
                        allPoints.push(new Vec2(vd[i], vd[i + 1]));
                    }
                }
            }
            if (allPoints.length > 0) return allPoints;
        }

        // Fallback: check getVertices()
        const verts = entity.getVertices();
        if (verts && verts.length >= 2) {
            return verts.map(v => v.clone());
        }

        return [];
    }

    /**
     * Uniformly resamples a polyline so that each consecutive pair of points has equal arc-length distance.
     * Delegates to {@link PathGeometryUtils.resampleByArcLength}.
     */
    public static resampleByArcLength(points: Vec2[], targetCount: number): Vec2[] {
        return PathGeometryUtils.resampleByArcLength(points, targetCount);
    }

    /**
     * Centers, scales, and optionally flips the points.
     * Delegates to {@link PathGeometryUtils.normalizePoints}.
     */
    public static normalizePoints(points: Vec2[], options: PathSampleOptions): Vec2[] {
        return PathGeometryUtils.normalizePoints(points, options);
    }
}
