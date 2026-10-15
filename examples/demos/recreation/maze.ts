import {
    Color,
    Entity,
    Scene,
    Vec3,
    Vec2,
    CameraModel,
    Res,
    Shader,
    Circle,
    InteractionManager,
    createBuffer,
    ArrayType
} from "retiam";
import { demoBackground } from "../../shared/presentation";

const GRID_SIZE = 50; // 20x20 Grid

export type AlgorithmType = 'backtracker' | 'wilsons' | 'sidewinder' | 'aldous_broder';
export type ThemeType = 'cyberpunk' | 'gold' | 'emerald' | 'vapor';

interface GeneratedMaze {
    walls: Uint32Array;
    cellSteps: Uint32Array;
    totalSteps: number;
}

// ============================================================================
// 1. MAZE GENERATION ALGORITHMS (From "Mazes for Programmers")
// ============================================================================

// Recursive Backtracker (Chapter 5)
function generateBacktracker(N: number): GeneratedMaze {
    const total = N * N;
    const walls = new Uint32Array(total);
    const cellSteps = new Uint32Array(total);
    const visited = new Uint8Array(total);
    const stack: number[] = [];

    let current = 0;
    visited[current] = 1;
    let stepCounter = 1;
    cellSteps[current] = stepCounter;

    while (stepCounter < total) {
        const cx = current % N;
        const cy = Math.floor(current / N);
        const unvisited: { dir: number; nextIdx: number; oppDir: number }[] = [];

        if (cy + 1 < N && visited[(cy + 1) * N + cx] === 0) unvisited.push({ dir: 1, nextIdx: (cy + 1) * N + cx, oppDir: 4 });
        if (cx + 1 < N && visited[cy * N + (cx + 1)] === 0) unvisited.push({ dir: 2, nextIdx: cy * N + (cx + 1), oppDir: 8 });
        if (cy > 0 && visited[(cy - 1) * N + cx] === 0) unvisited.push({ dir: 4, nextIdx: (cy - 1) * N + cx, oppDir: 1 });
        if (cx > 0 && visited[cy * N + (cx - 1)] === 0) unvisited.push({ dir: 8, nextIdx: cy * N + (cx - 1), oppDir: 2 });

        if (unvisited.length > 0) {
            const choice = unvisited[Math.floor(Math.random() * unvisited.length)];
            walls[current] |= choice.dir;
            walls[choice.nextIdx] |= choice.oppDir;

            stack.push(current);
            current = choice.nextIdx;
            visited[current] = 1;
            stepCounter++;
            cellSteps[current] = stepCounter;
        } else if (stack.length > 0) {
            current = stack.pop()!;
        } else {
            break;
        }
    }
    return { walls, cellSteps, totalSteps: stepCounter };
}

// Wilson's Algorithm (Chapter 4)
function generateWilsons(N: number): GeneratedMaze {
    const total = N * N;
    const walls = new Uint32Array(total);
    const cellSteps = new Uint32Array(total);
    const visited = new Uint8Array(total);

    const first = Math.floor(Math.random() * total);
    visited[first] = 1;
    let visitedCount = 1;
    let stepCounter = 1;
    cellSteps[first] = stepCounter;

    while (visitedCount < total) {
        let start = Math.floor(Math.random() * total);
        while (visited[start] === 1) {
            start = Math.floor(Math.random() * total);
        }

        const path: number[] = [start];
        let curr = start;

        while (visited[curr] === 0) {
            const cx = curr % N;
            const cy = Math.floor(curr / N);
            const neighbors: { dir: number; nextIdx: number; oppDir: number }[] = [];

            if (cy + 1 < N) neighbors.push({ dir: 1, nextIdx: (cy + 1) * N + cx, oppDir: 4 });
            if (cx + 1 < N) neighbors.push({ dir: 2, nextIdx: cy * N + (cx + 1), oppDir: 8 });
            if (cy > 0) neighbors.push({ dir: 4, nextIdx: (cy - 1) * N + cx, oppDir: 1 });
            if (cx > 0) neighbors.push({ dir: 8, nextIdx: cy * N + (cx - 1), oppDir: 2 });

            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const loopIdx = path.indexOf(next.nextIdx);

            if (loopIdx !== -1) {
                path.length = loopIdx + 1;
                curr = path[path.length - 1];
            } else {
                path.push(next.nextIdx);
                curr = next.nextIdx;
            }
        }

        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];

            const ux = u % N, uy = Math.floor(u / N);
            const vx = v % N, vy = Math.floor(v / N);

            let dirU = 0, dirV = 0;
            if (vy > uy) { dirU = 1; dirV = 4; }
            else if (vx > ux) { dirU = 2; dirV = 8; }
            else if (vy < uy) { dirU = 4; dirV = 1; }
            else if (vx < ux) { dirU = 8; dirV = 2; }

            walls[u] |= dirU;
            walls[v] |= dirV;

            visited[u] = 1;
            visitedCount++;
            stepCounter++;
            cellSteps[u] = stepCounter;
        }
    }
    return { walls, cellSteps, totalSteps: stepCounter };
}

// Sidewinder Algorithm (Chapter 2)
function generateSidewinder(N: number): GeneratedMaze {
    const total = N * N;
    const walls = new Uint32Array(total);
    const cellSteps = new Uint32Array(total);
    let stepCounter = 0;

    for (let cy = 0; cy < N; cy++) {
        let run: number[] = [];

        for (let cx = 0; cx < N; cx++) {
            const idx = cy * N + cx;
            run.push(idx);
            stepCounter++;
            cellSteps[idx] = stepCounter;

            const atEast = (cx === N - 1);
            const atNorth = (cy === N - 1);
            const shouldClose = atEast || (!atNorth && Math.random() < 0.5);

            if (shouldClose) {
                const member = run[Math.floor(Math.random() * run.length)];
                const mx = member % N;
                const my = Math.floor(member / N);

                if (!atNorth) {
                    const northIdx = (my + 1) * N + mx;
                    walls[member] |= 1;  // North
                    walls[northIdx] |= 4; // South
                }
                run = [];
            } else {
                const eastIdx = cy * N + (cx + 1);
                walls[idx] |= 2;    // East
                walls[eastIdx] |= 8; // West
            }
        }
    }
    return { walls, cellSteps, totalSteps: stepCounter };
}

// Aldous-Broder Algorithm (Chapter 4)
function generateAldousBroder(N: number): GeneratedMaze {
    const total = N * N;
    const walls = new Uint32Array(total);
    const cellSteps = new Uint32Array(total);
    const visited = new Uint8Array(total);

    let current = Math.floor(Math.random() * total);
    visited[current] = 1;
    let visitedCount = 1;
    let stepCounter = 1;
    cellSteps[current] = stepCounter;

    while (visitedCount < total) {
        const cx = current % N;
        const cy = Math.floor(current / N);
        const neighbors: { dir: number; nextIdx: number; oppDir: number }[] = [];

        if (cy + 1 < N) neighbors.push({ dir: 1, nextIdx: (cy + 1) * N + cx, oppDir: 4 });
        if (cx + 1 < N) neighbors.push({ dir: 2, nextIdx: cy * N + (cx + 1), oppDir: 8 });
        if (cy > 0) neighbors.push({ dir: 4, nextIdx: (cy - 1) * N + cx, oppDir: 1 });
        if (cx > 0) neighbors.push({ dir: 8, nextIdx: cy * N + (cx - 1), oppDir: 2 });

        const choice = neighbors[Math.floor(Math.random() * neighbors.length)];

        if (visited[choice.nextIdx] === 0) {
            walls[current] |= choice.dir;
            walls[choice.nextIdx] |= choice.oppDir;
            visited[choice.nextIdx] = 1;
            visitedCount++;
            stepCounter++;
            cellSteps[choice.nextIdx] = stepCounter;
        }
        current = choice.nextIdx;
    }
    return { walls, cellSteps, totalSteps: stepCounter };
}

// ============================================================================
// 2. MAIN SCENE CLASS
// ============================================================================
export default class TestScene extends Scene {
    private wallsBuffer!: GPUBuffer;
    private distsBuffer!: GPUBuffer;
    private pathMaskBuffer!: GPUBuffer;
    private cellStepsBuffer!: GPUBuffer;
    private paramsBuffer!: GPUBuffer;

    private wavePipeline!: GPUComputePipeline;
    private waveBindGroup!: GPUBindGroup;

    private tracePipeline!: GPUComputePipeline;
    private traceBindGroup!: GPUBindGroup;

    private mazeShader!: Shader;
    private startNode!: Circle;
    private goalNode!: Circle;

    private startCellIdx = (GRID_SIZE - 1) * GRID_SIZE + 0;           // Top-Left
    private goalCellIdx = 0 * GRID_SIZE + (GRID_SIZE - 1);            // Bottom-Right

    private isDraggingStart = false;
    private isDraggingGoal = false;

    private currentAlgorithm: AlgorithmType = 'backtracker';
    private currentTheme: ThemeType = 'cyberpunk';
    public buildSpeed: number = 3;

    private activeMaxStep = 1;
    private totalSteps = 1;

    // Color Themes Configuration
    private themes = {
        cyberpunk: {
            wall: [0.0, 0.65, 1.0, 1.0],        // Electric Cyan
            routeStart: [0.0, 1.0, 0.5, 1.0],  // Emerald Green
            routeGoal: [1.0, 0.05, 0.45, 1.0]   // Neon Magenta
        },
        gold: {
            wall: [1.0, 0.75, 0.0, 1.0],        // Golden Amber
            routeStart: [0.2, 1.0, 0.4, 1.0],  // Lime
            routeGoal: [1.0, 0.2, 0.1, 1.0]     // Solar Red
        },
        emerald: {
            wall: [0.0, 1.0, 0.6, 1.0],        // Bright Mint
            routeStart: [0.0, 0.8, 1.0, 1.0],  // Electric Blue
            routeGoal: [0.9, 1.0, 0.1, 1.0]     // Bright Yellow
        },
        vapor: {
            wall: [0.7, 0.1, 1.0, 1.0],        // Ultra Violet
            routeStart: [0.0, 1.0, 0.8, 1.0],  // Aqua
            routeGoal: [1.0, 0.4, 0.0, 1.0]     // Sunset Orange
        }
    };

    public async run() {
        // Pure Pitch Dark Background
        this.clearColor(demoBackground());

        // Enable Pointer Interaction Manager
        new InteractionManager(this);

        // Setup 2D Camera
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 11.0;
        this.camera.position.set([0, 0, 50]);

        const N = GRID_SIZE;
        const totalCells = N * N;
        const device = this.device;

        // Allocate WebGPU Storage Buffers
        this.wallsBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, totalCells, ArrayType.U32);
        this.cellStepsBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, totalCells, ArrayType.U32);

        const initDists = new Uint32Array(totalCells).fill(999999);
        initDists[this.goalCellIdx] = 0;
        this.distsBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, initDists, ArrayType.U32);

        this.pathMaskBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, totalCells, ArrayType.U32);

        // Uniform Params Buffer (80 Bytes)
        this.paramsBuffer = createBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 80);

        // --- 1. Compute Pipeline: Dijkstra Distance Wave ---
        const waveWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                stepCount: u32,
                activeMaxStep: u32,
                totalSteps: u32,
                wallThick: f32,
                pad: u32,
                wallColor: vec4f,
                routeColorStart: vec4f,
                routeColorGoal: vec4f,
            };

            @group(0) @binding(0) var<storage, read> walls: array<u32>;
            @group(0) @binding(1) var<storage, read_write> dists: array<u32>;
            @group(0) @binding(2) var<uniform> params: Params;

            @compute @workgroup_size(16, 16)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let x = id.x;
                let y = id.y;
                let N = params.gridSize;
                if (x >= N || y >= N) { return; }

                let idx = y * N + x;

                if (idx == params.goalIdx) {
                    dists[idx] = 0u;
                    return;
                }

                let cellWalls = walls[idx];
                var minD = 999999u;

                if ((cellWalls & 1u) != 0u && y + 1u < N) { minD = min(minD, dists[(y + 1u) * N + x]); }
                if ((cellWalls & 2u) != 0u && x + 1u < N) { minD = min(minD, dists[y * N + (x + 1u)]); }
                if ((cellWalls & 4u) != 0u && y > 0u)     { minD = min(minD, dists[(y - 1u) * N + x]); }
                if ((cellWalls & 8u) != 0u && x > 0u)     { minD = min(minD, dists[y * N + (x - 1u)]); }

                if (minD < 999999u && minD + 1u < dists[idx]) {
                    dists[idx] = minD + 1u;
                }
            }
        `;

        const waveModule = device.createShaderModule({ code: waveWGSL });
        this.wavePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: { module: waveModule, entryPoint: 'main' }
        });

        this.waveBindGroup = device.createBindGroup({
            layout: this.wavePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.wallsBuffer } },
                { binding: 1, resource: { buffer: this.distsBuffer } },
                { binding: 2, resource: { buffer: this.paramsBuffer } }
            ]
        });

        // --- 2. Compute Pipeline: Shortest Path Tracing ---
        const traceWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                stepCount: u32,
                activeMaxStep: u32,
                totalSteps: u32,
                wallThick: f32,
                pad: u32,
                wallColor: vec4f,
                routeColorStart: vec4f,
                routeColorGoal: vec4f,
            };

            @group(0) @binding(0) var<storage, read> walls: array<u32>;
            @group(0) @binding(1) var<storage, read> dists: array<u32>;
            @group(0) @binding(2) var<storage, read_write> pathMask: array<u32>;
            @group(0) @binding(3) var<uniform> params: Params;

            @compute @workgroup_size(1, 1)
            fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                let N = params.gridSize;
                let total = N * N;

                for (var i = 0u; i < total; i = i + 1u) {
                    pathMask[i] = 0u;
                }

                var current = params.startIdx;
                var steps = total;

                while (steps > 0u) {
                    pathMask[current] = 1u;
                    if (current == params.goalIdx) { break; }

                    let x = current % N;
                    let y = current / N;
                    let cellWalls = walls[current];
                    let currentDist = dists[current];

                    var nextCell = current;
                    var minD = currentDist;

                    if ((cellWalls & 1u) != 0u && y + 1u < N) {
                        let nIdx = (y + 1u) * N + x;
                        if (dists[nIdx] < minD) { minD = dists[nIdx]; nextCell = nIdx; }
                    }
                    if ((cellWalls & 2u) != 0u && x + 1u < N) {
                        let eIdx = y * N + (x + 1u);
                        if (dists[eIdx] < minD) { minD = dists[eIdx]; nextCell = eIdx; }
                    }
                    if ((cellWalls & 4u) != 0u && y > 0u) {
                        let sIdx = (y - 1u) * N + x;
                        if (dists[sIdx] < minD) { minD = dists[sIdx]; nextCell = sIdx; }
                    }
                    if ((cellWalls & 8u) != 0u && x > 0u) {
                        let wIdx = y * N + (x - 1u);
                        if (dists[wIdx] < minD) { minD = dists[wIdx]; nextCell = wIdx; }
                    }

                    if (nextCell == current) { break; }
                    current = nextCell;
                    steps = steps - 1u;
                }
            }
        `;

        const traceModule = device.createShaderModule({ code: traceWGSL });
        this.tracePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: { module: traceModule, entryPoint: 'main' }
        });

        this.traceBindGroup = device.createBindGroup({
            layout: this.tracePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.wallsBuffer } },
                { binding: 1, resource: { buffer: this.distsBuffer } },
                { binding: 2, resource: { buffer: this.pathMaskBuffer } },
                { binding: 3, resource: { buffer: this.paramsBuffer } }
            ]
        });

        // --- 3. Custom 2D Shader with Mathematically Exact Equal Wall Widths ---
        const fragWGSL = `
            let N = f32(params.gridSize);

            // Grid-space coordinates
            let gx = input.uv.x * N;
            let gy = (1.0 - input.uv.y) * N;

            let cellX = u32(clamp(floor(gx), 0.0, N - 1.0));
            let cellY = u32(clamp(floor(gy), 0.0, N - 1.0));
            let localUV = vec2f(fract(gx), fract(gy));
            let idx = cellY * params.gridSize + cellX;

            let cellStep = cellSteps[idx];

            // --- GRADUAL CREATION ANIMATION ---
            if (cellStep > params.activeMaxStep) {
                // Uncarved background
                finalColor = vec4f(0.01, 0.01, 0.02, 1.0) * paint.opacity;
            } else {
                var col = vec4f(0.015, 0.015, 0.025, 1.0); // Pitch Dark Canvas

                let w = params.wallThick; // 0.07 (Total Wall Thickness = 0.14)
                var isWall = false;

                // 1. Outer Boundaries
                if (gx < 2.0 * w || gx > N - 2.0 * w ||
                    gy < 2.0 * w || gy > N - 2.0 * w) {
                    isWall = true;
                }

                // 2. Interior Vertical Walls
                let vertLineX = round(gx);
                if (!isWall && abs(gx - vertLineX) < w && vertLineX >= 1.0 && vertLineX <= N - 1.0) {
                    let leftX = u32(vertLineX - 1.0);
                    let rightX = u32(vertLineX);
                    let Y = u32(floor(gy));

                    let cLeftCarved = cellSteps[Y * params.gridSize + leftX] <= params.activeMaxStep;
                    let cRightCarved = cellSteps[Y * params.gridSize + rightX] <= params.activeMaxStep;

                    if (!cLeftCarved || !cRightCarved) {
                        isWall = true; // Border against uncarved region
                    } else {
                        let wLeft = walls[Y * params.gridSize + leftX];
                        if ((wLeft & 2u) == 0u) { isWall = true; } // East wall closed
                    }
                }

                // 3. Interior Horizontal Walls
                let horizLineY = round(gy);
                if (!isWall && abs(gy - horizLineY) < w && horizLineY >= 1.0 && horizLineY <= N - 1.0) {
                    let botY = u32(horizLineY - 1.0);
                    let topY = u32(horizLineY);
                    let X = u32(floor(gx));

                    let cBotCarved = cellSteps[botY * params.gridSize + X] <= params.activeMaxStep;
                    let cTopCarved = cellSteps[topY * params.gridSize + X] <= params.activeMaxStep;

                    if (!cBotCarved || !cTopCarved) {
                        isWall = true; // Border against uncarved region
                    } else {
                        let wBot = walls[botY * params.gridSize + X];
                        if ((wBot & 1u) == 0u) { isWall = true; } // North wall closed
                    }
                }

                // 4. Corner Junction Posts
                if (!isWall) {
                    let jX = round(gx);
                    let jY = round(gy);
                    if (abs(gx - jX) < w && abs(gy - jY) < w) {
                        let ix = u32(jX);
                        let iy = u32(jY);

                        var nearWall = false;
                        if (ix > 0u && ix < params.gridSize) {
                            if (iy > 0u && (walls[(iy - 1u) * params.gridSize + (ix - 1u)] & 2u) == 0u) { nearWall = true; }
                            if (iy < params.gridSize && (walls[iy * params.gridSize + (ix - 1u)] & 2u) == 0u) { nearWall = true; }
                        }
                        if (iy > 0u && iy < params.gridSize) {
                            if (ix > 0u && (walls[(iy - 1u) * params.gridSize + (ix - 1u)] & 1u) == 0u) { nearWall = true; }
                            if (ix < params.gridSize && (walls[(iy - 1u) * params.gridSize + ix] & 1u) == 0u) { nearWall = true; }
                        }
                        if (nearWall) { isWall = true; }
                    }
                }

                // --- 5. CONTINUOUS SOLID 2-COLOR ROUTE RIBBON ---
                let cellDist = dists[idx];
                let isPath = pathMask[idx];

                if (!isWall && isPath == 1u && params.activeMaxStep >= params.totalSteps) {
                    let startDist = f32(dists[params.startIdx]);
                    let routeProgress = clamp(1.0 - (f32(cellDist) / max(startDist, 1.0)), 0.0, 1.0);

                    let routeColor = mix(params.routeColorStart.rgb, params.routeColorGoal.rgb, routeProgress);

                    let r = 0.22; // Ribbon half-width
                    var onRibbon = (length(localUV - vec2f(0.5)) < r);

                    let cellW = walls[idx];

                    if (cellY + 1u < params.gridSize && (cellW & 1u) != 0u && pathMask[(cellY + 1u) * params.gridSize + cellX] == 1u) {
                        if (localUV.y >= 0.5 && abs(localUV.x - 0.5) < r) { onRibbon = true; }
                    }
                    if (cellX + 1u < params.gridSize && (cellW & 2u) != 0u && pathMask[cellY * params.gridSize + (cellX + 1u)] == 1u) {
                        if (localUV.x >= 0.5 && abs(localUV.y - 0.5) < r) { onRibbon = true; }
                    }
                    if (cellY > 0u && (cellW & 4u) != 0u && pathMask[(cellY - 1u) * params.gridSize + cellX] == 1u) {
                        if (localUV.y <= 0.5 && abs(localUV.x - 0.5) < r) { onRibbon = true; }
                    }
                    if (cellX > 0u && (cellW & 8u) != 0u && pathMask[cellY * params.gridSize + (cellX - 1u)] == 1u) {
                        if (localUV.x <= 0.5 && abs(localUV.y - 0.5) < r) { onRibbon = true; }
                    }

                    if (onRibbon) {
                        col = vec4f(routeColor, 1.0);
                    }
                }

                if (isWall) {
                    col = params.wallColor;
                }

                finalColor = col * paint.opacity;
            }
        `;

        const userFuncsWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                stepCount: u32,
                activeMaxStep: u32,
                totalSteps: u32,
                wallThick: f32,
                pad: u32,
                wallColor: vec4f,
                routeColorStart: vec4f,
                routeColorGoal: vec4f,
            };
        `;

        this.mazeShader = new Shader(10, 10, fragWGSL, { userFunctions: userFuncsWGSL });
        this.mazeShader.setStorageBuffer("walls", "array<u32>", this.wallsBuffer);
        this.mazeShader.setStorageBuffer("dists", "array<u32>", this.distsBuffer);
        this.mazeShader.setStorageBuffer("pathMask", "array<u32>", this.pathMaskBuffer);
        this.mazeShader.setStorageBuffer("cellSteps", "array<u32>", this.cellStepsBuffer);
        this.mazeShader.setUniformBuffer("params", "Params", this.paramsBuffer);
        this.add(this.mazeShader);

        // --- 4. Adaptive Start & Goal Pointer Nodes ---
        const worldCellSize = 10.0 / GRID_SIZE;
        const nodeRadius = Math.max(0.12, worldCellSize * 0.35);

        this.startNode = new Circle(nodeRadius);
        this.startNode.paint.stroke = Color.WHITE;
        this.startNode.paint.strokeWidth = 0.03;
        this.startNode.z_index = 0.5;
        this.startNode.setDraggable(true);
        this.add(this.startNode);

        this.goalNode = new Circle(nodeRadius);
        this.goalNode.paint.stroke = Color.WHITE;
        this.goalNode.paint.strokeWidth = 0.03;
        this.goalNode.z_index = 0.5;
        this.goalNode.setDraggable(true);
        this.add(this.goalNode);

        // Dragging Handlers
        this.startNode.setEvent("dragstart", () => { this.isDraggingStart = true; });
        this.startNode.setEvent("dragend", () => { this.isDraggingStart = false; });

        this.goalNode.setEvent("dragstart", () => { this.isDraggingGoal = true; });
        this.goalNode.setEvent("dragend", () => { this.isDraggingGoal = false; });

        this.syncNodePositions();
        this.updateThemeColors();

        // Build Control Panel
        this.buildUIOverlay();

        // Regenerate Maze Topology
        this.regenerateMaze();

        // --- 5. Main Per-Frame Compute Loop ---
        let stepCounter = 0;

        this.always(() => {
            stepCounter++;

            // --- A. GRADUAL CREATION ANIMATION ---
            if (this.activeMaxStep < this.totalSteps) {
                this.activeMaxStep += this.buildSpeed;
                if (this.activeMaxStep >= this.totalSteps) {
                    this.activeMaxStep = this.totalSteps;
                }

                this.writeParams(stepCounter);
                this.invalidate();
                return;
            }

            // --- B. SMOOTH RELEASE SNAPPING TO DISCRETE CELL CENTERS ---
            if (!this.isDraggingStart) {
                const sCell = this.worldToCell(this.startNode.transform.position.x, this.startNode.transform.position.y);
                const sTarget = this.cellToWorld(sCell);
                const curSPos = this.startNode.transform.position;
                this.startNode.transform.position = curSPos.lerp(new Vec3(sTarget.x, sTarget.y, 0), 0.25);
            }

            if (!this.isDraggingGoal) {
                const gCell = this.worldToCell(this.goalNode.transform.position.x, this.goalNode.transform.position.y);
                const gTarget = this.cellToWorld(gCell);
                const curGPos = this.goalNode.transform.position;
                this.goalNode.transform.position = curGPos.lerp(new Vec3(gTarget.x, gTarget.y, 0), 0.25);
            }

            // --- C. LIVE RE-ROUTING ---
            const startPos = this.startNode.transform.position;
            const newStartIdx = this.worldToCell(startPos.x, startPos.y);

            const goalPos = this.goalNode.transform.position;
            const newGoalIdx = this.worldToCell(goalPos.x, goalPos.y);

            let needDistReset = false;
            if (newGoalIdx !== this.goalCellIdx) {
                this.goalCellIdx = newGoalIdx;
                needDistReset = true;
            }
            if (newStartIdx !== this.startCellIdx) {
                this.startCellIdx = newStartIdx;
            }

            if (needDistReset) {
                const freshDists = new Uint32Array(N * N).fill(999999);
                freshDists[this.goalCellIdx] = 0;
                device.queue.writeBuffer(this.distsBuffer, 0, freshDists.buffer);
            }

            this.writeParams(stepCounter);

            // Run WebGPU Compute Solvers
            for (let i = 0; i < 15; i++) {
                this.addCompute({
                    dispatch_count: [Math.ceil(N / 16), Math.ceil(N / 16), 1],
                    pipeline: this.wavePipeline,
                    bind_group: this.waveBindGroup
                });
            }

            this.addCompute({
                dispatch_count: [1, 1, 1],
                pipeline: this.tracePipeline,
                bind_group: this.traceBindGroup
            });

            this.invalidate();
        });
    }

    private regenerateMaze() {
        const N = GRID_SIZE;
        let result: GeneratedMaze;

        switch (this.currentAlgorithm) {
            case 'wilsons': result = generateWilsons(N); break;
            case 'sidewinder': result = generateSidewinder(N); break;
            case 'aldous_broder': result = generateAldousBroder(N); break;
            case 'backtracker': default: result = generateBacktracker(N); break;
        }

        this.totalSteps = result.totalSteps;
        this.activeMaxStep = 1;

        this.device.queue.writeBuffer(this.wallsBuffer, 0, result.walls.buffer);
        this.device.queue.writeBuffer(this.cellStepsBuffer, 0, result.cellSteps.buffer);

        const initDists = new Uint32Array(N * N).fill(999999);
        initDists[this.goalCellIdx] = 0;
        this.device.queue.writeBuffer(this.distsBuffer, 0, initDists.buffer);

        this.writeParams(0);
        this.invalidate();
    }

    private writeParams(stepCounter: number) {
        const theme = this.themes[this.currentTheme];
        const wallThick = 0.07; // Base thickness (Resulting wall width = 0.14)

        const pData = new ArrayBuffer(80);
        const u32 = new Uint32Array(pData, 0, 8);
        const f32 = new Float32Array(pData, 0, 20);

        u32[0] = GRID_SIZE;
        u32[1] = this.startCellIdx;
        u32[2] = this.goalCellIdx;
        u32[3] = stepCounter;

        u32[4] = this.activeMaxStep;
        u32[5] = this.totalSteps;
        f32[6] = wallThick;
        u32[7] = 0;

        f32.set(theme.wall, 8);
        f32.set(theme.routeStart, 12);
        f32.set(theme.routeGoal, 16);

        this.device.queue.writeBuffer(this.paramsBuffer, 0, pData);
    }

    private updateThemeColors() {
        const theme = this.themes[this.currentTheme];
        this.startNode.paint.fill = new Color(theme.routeStart[0], theme.routeStart[1], theme.routeStart[2], 1.0);
        this.goalNode.paint.fill = new Color(theme.routeGoal[0], theme.routeGoal[1], theme.routeGoal[2], 1.0);
    }

    private buildUIOverlay() {
        if (typeof document === 'undefined') return;

        const oldUi = document.getElementById("maze-control-panel");
        if (oldUi) oldUi.remove();

        const panel = document.createElement("div");
        panel.id = "maze-control-panel";
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(10, 15, 25, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 180, 255, 0.25);
            border-radius: 12px;
            padding: 16px 20px;
            color: #f0f0f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            user-select: none;
        `;

        panel.innerHTML = `
            <div style="font-weight: 700; font-size: 14px; letter-spacing: 1px; color: #00d5ff; text-transform: uppercase;">Maze Controls</div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="color: #a0b0c0; font-size: 11px;">ALGORITHM</label>
                <select id="algo-select" style="background: #141e30; color: #fff; border: 1px solid #2a3a50; padding: 6px 10px; border-radius: 6px; outline: none; cursor: pointer;">
                    <option value="backtracker">Recursive Backtracker</option>
                    <option value="wilsons">Wilson's Algorithm</option>
                    <option value="sidewinder">Sidewinder</option>
                    <option value="aldous_broder">Aldous-Broder</option>
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="color: #a0b0c0; font-size: 11px;">THEME</label>
                <select id="theme-select" style="background: #141e30; color: #fff; border: 1px solid #2a3a50; padding: 6px 10px; border-radius: 6px; outline: none; cursor: pointer;">
                    <option value="cyberpunk">Cyberpunk Neon</option>
                    <option value="gold">Gold Amber</option>
                    <option value="emerald">Emerald Matrix</option>
                    <option value="vapor">Vapor Violet</option>
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; color: #a0b0c0; font-size: 11px;">
                    <span>BUILD SPEED</span>
                    <span id="speed-val">3x</span>
                </div>
                <input type="range" id="speed-slider" min="1" max="20" value="3" style="cursor: pointer; accent-color: #00d5ff;">
            </div>

            <button id="regen-btn" style="background: linear-gradient(135deg, #0088ff, #00d5ff); border: none; color: #000; font-weight: 700; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: transform 0.1s;">REGENERATE MAZE</button>
        `;

        document.body.appendChild(panel);

        const algoSelect = document.getElementById("algo-select") as HTMLSelectElement;
        const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;
        const speedSlider = document.getElementById("speed-slider") as HTMLInputElement;
        const speedVal = document.getElementById("speed-val") as HTMLSpanElement;
        const regenBtn = document.getElementById("regen-btn") as HTMLButtonElement;

        algoSelect.addEventListener("change", (e) => {
            this.currentAlgorithm = (e.target as HTMLSelectElement).value as AlgorithmType;
            this.regenerateMaze();
        });

        themeSelect.addEventListener("change", (e) => {
            this.currentTheme = (e.target as HTMLSelectElement).value as ThemeType;
            this.updateThemeColors();
        });

        speedSlider.addEventListener("input", (e) => {
            this.buildSpeed = parseInt((e.target as HTMLInputElement).value, 10);
            speedVal.innerText = `${this.buildSpeed}x`;
        });

        regenBtn.addEventListener("click", () => {
            this.regenerateMaze();
        });
    }

    private cellToWorld(idx: number): Vec2 {
        const N = GRID_SIZE;
        const cx = idx % N;
        const cy = Math.floor(idx / N);
        const size = 10;
        const wx = (cx + 0.5) * (size / N) - size / 2;
        const wy = (cy + 0.5) * (size / N) - size / 2;
        return new Vec2(wx, wy);
    }

    private worldToCell(wx: number, wy: number): number {
        const N = GRID_SIZE;
        const size = 10;
        let cx = Math.floor(((wx + size / 2) / size) * N);
        let cy = Math.floor(((wy + size / 2) / size) * N);

        cx = Math.max(0, Math.min(N - 1, cx));
        cy = Math.max(0, Math.min(N - 1, cy));
        return cy * N + cx;
    }

    private syncNodePositions() {
        const sWorld = this.cellToWorld(this.startCellIdx);
        this.startNode.transform.position = new Vec3(sWorld.x, sWorld.y, 0);

        const gWorld = this.cellToWorld(this.goalCellIdx);
        this.goalNode.transform.position = new Vec3(gWorld.x, gWorld.y, 0);
    }
}
