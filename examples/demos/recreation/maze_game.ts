import {
    Color,
    Entity,
    Scene,
    Vec3,
    Vec2,
    CameraModel,
    Shader,
    Circle,
    Rect,
    SDFText,
    Font,
    InteractionManager,
    createBuffer,
    ArrayType,
    Ray,
    Raycaster,
    Mat4
} from "retiam";
import { demoBackground } from "../../shared/presentation";

// ============================================================================
// 1. 50 PROGRESSIVE LEVEL DEFINITIONS & GENERATOR
// ============================================================================

export interface PuzzleLevel {
    id: number;
    title: string;
    gridSize: number;
    start: [number, number];   // [x, y]
    goal: [number, number];    // [x, y]
    keys: [number, number][];  // Required Data Key cells
    maxTokens: number;         // Maximum wall toggles allowed
    wallSeed: number;          // Seed for procedural maze generator
}

const LEVEL_TITLES: string[] = [
    "INITIALIZATION", "SUBROUTINE", "DUAL TERMINALS", "DATA PIPELINE", "FIREWALL BYPASS",
    "CYBER CORE", "MAZE MATRIX", "GRID OVERLOAD", "QUANTUM LOOP", "SYSTEM ARCHITECT",
    "NEURAL LINK", "PROXY CHAIN", "ENCRYPTION GATE", "MAINFRAME BREACH", "DARK SUBNET",
    "MEMSTACK ALPHA", "LOGIC GATE", "BITSHIFT ZERO", "GHOST PROTOCOL", "HYPERTHREAD",
    "BYTE PIPELINE", "CIPHER MESH", "ALGORITHM X86", "CACHE OVERFLOW", "STACK TRACE",
    "KERNEL ACCESS", "ROOT OVERRIDE", "SIGNAL TOWER", "VECTOR CLUSTER", "PACKET STORM",
    "SYNAPSE MATRIX", "TERMINAL KAPPA", "CIRCUIT BREAKER", "FIREWALL OMEGA", "DATA STREAM XI",
    "QUANTUM CORE", "NODE CASCADE", "MEMORY LEAK", "GRID REPOWER", "CYBER DOME",
    "CRYPTO SHIELD", "VOID NETWORK", "NEURAL CASCADE", "DEBUG MATRIX", "SYSTEM REBOOT",
    "APEX CORE", "FINAL PROTOCOL", "ZERO DAY", "OVERLORD GATE", "SINGULARITY"
];

function generate50PuzzleLevels(): PuzzleLevel[] {
    const levels: PuzzleLevel[] = [];

    for (let i = 0; i < 50; i++) {
        const id = i + 1;
        const title = LEVEL_TITLES[i];

        // Grid size scales smoothly from 8x8 up to 32x32
        const gridSize = Math.min(32, 8 + Math.floor(i * 0.5));
        const maxTokens = Math.min(22, 5 + Math.floor(gridSize * 0.45));

        const start: [number, number] = [0, gridSize - 1];
        const goal: [number, number] = [gridSize - 1, 0];

        // Keys scale from 1 up to 5 terminals
        const numKeys = Math.min(5, 1 + Math.floor(i / 10));
        const keys: [number, number][] = [];

        for (let k = 0; k < numKeys; k++) {
            const frac = (k + 1) / (numKeys + 1);
            const kx = Math.max(1, Math.min(gridSize - 2, Math.floor(gridSize * frac + (k % 2 === 0 ? 1 : -1))));
            const ky = Math.max(1, Math.min(gridSize - 2, Math.floor(gridSize * (1.0 - frac) + (k % 2 === 0 ? -1 : 1))));
            keys.push([kx, ky]);
        }

        levels.push({
            id,
            title,
            gridSize,
            start,
            goal,
            keys,
            maxTokens,
            wallSeed: 1000 + i * 137
        });
    }

    return levels;
}

const PUZZLE_LEVELS: PuzzleLevel[] = generate50PuzzleLevels();

function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

function generatePuzzleMaze(N: number, seed: number): Uint32Array {
    const total = N * N;
    const walls = new Uint32Array(total);
    const visited = new Uint8Array(total);
    const stack: number[] = [];
    const rand = seededRandom(seed);

    let current = 0;
    visited[current] = 1;
    let visitedCount = 1;

    while (visitedCount < total) {
        const cx = current % N;
        const cy = Math.floor(current / N);
        const unvisited: { dir: number; nextIdx: number; oppDir: number }[] = [];

        if (cy + 1 < N && visited[(cy + 1) * N + cx] === 0) unvisited.push({ dir: 1, nextIdx: (cy + 1) * N + cx, oppDir: 4 });
        if (cx + 1 < N && visited[cy * N + (cx + 1)] === 0) unvisited.push({ dir: 2, nextIdx: cy * N + (cx + 1), oppDir: 8 });
        if (cy > 0 && visited[(cy - 1) * N + cx] === 0) unvisited.push({ dir: 4, nextIdx: (cy - 1) * N + cx, oppDir: 1 });
        if (cx > 0 && visited[cy * N + (cx - 1)] === 0) unvisited.push({ dir: 8, nextIdx: cy * N + (cx - 1), oppDir: 2 });

        if (unvisited.length > 0) {
            const choice = unvisited[Math.floor(rand() * unvisited.length)];
            walls[current] |= choice.dir;
            walls[choice.nextIdx] |= choice.oppDir;

            stack.push(current);
            current = choice.nextIdx;
            visited[current] = 1;
            visitedCount++;
        } else if (stack.length > 0) {
            current = stack.pop()!;
        } else {
            break;
        }
    }
    return walls;
}

interface Particle {
    circle: Circle;
    pos: Vec2;
    vel: Vec2;
    life: number;
    maxLife: number;
}

// ============================================================================
// 2. MAIN GAME SCENE CLASS
// ============================================================================

export default class SubnetRouteGame extends Scene {
    // WebGPU Storage Buffers
    private wallsBuffer!: GPUBuffer;
    private distsBuffer!: GPUBuffer;
    private pathMaskBuffer!: GPUBuffer;
    private keysBuffer!: GPUBuffer;
    private paramsBuffer!: GPUBuffer;

    // GPU Compute Pipelines
    private wavePipeline!: GPUComputePipeline;
    private waveBindGroup!: GPUBindGroup;
    private tracePipeline!: GPUComputePipeline;
    private traceBindGroup!: GPUBindGroup;

    // Rendering Entities
    private mazeShader!: Shader;
    private startNode!: Circle;
    private goalNode!: Circle;
    private playerNode!: Circle;
    private keyEntities: { circle: Circle; cellIdx: number; collected: boolean }[] = [];
    private particles: Particle[] = [];

    // On-Canvas HUD Entities
    private uiTitleText!: SDFText;
    private uiScoreText!: SDFText;
    private uiTokensText!: SDFText;
    private uiKeysText!: SDFText;
    private uiGuideText!: SDFText;

    private topBarBg!: Rect;
    private bottomBarBg!: Rect;
    private restartBtnBg!: Rect;
    private restartBtnText!: SDFText;

    private victoryContainer!: Entity;
    private victoryTitleText!: SDFText;
    private victorySubText!: SDFText;
    private victoryBonusText!: SDFText;
    private victoryNextBtnBg!: Rect;
    private victoryNextBtnText!: SDFText;

    // Game Logic State
    private currentLevelIdx = 0;
    private tokensRemaining = 0;
    private activeGridSize = 10;
    private rawWallsData!: Uint32Array;
    private totalScore = 0;

    private startCellIdx = 0;
    private goalCellIdx = 0;
    private playerCellIdx = 0;
    private targetCellIdx = 0;               // Discrete cell target
    private isMovingBetweenCells = false;      // Discrete transition lock
    private playerPos: Vec2 = new Vec2();      // Smooth visual position
    private hoverCellIdx = 999999;

    private keyCellIndices: number[] = [];
    private isLevelComplete = false;
    private keysCollectedCount = 0;

    // Victory Animation Lock
    private victoryAnimProgress = 0;
    private isVictoryAnimActive = false;

    // Continuous Key State Tracker
    private heldKeys = new Set<string>();
    private boundKeyDownListener!: (e: KeyboardEvent) => void;
    private boundKeyUpListener!: (e: KeyboardEvent) => void;

    public async run() {
        // Deep Space Background
        this.clearColor(demoBackground());

        // Pointer Interaction Manager
        new InteractionManager(this);

        // Orthographic 2D Camera with Margin for HUD
        this.camera.model = CameraModel.ORTHOGRAPHIC;
        this.camera.orthoScale = 14.0; // Expanded for zero-overlap margins
        this.camera.position.set([0, 0, 50]);

        const maxCells = 32 * 32;
        const device = this.device;

        // Allocate WebGPU Buffers (Includes COPY_SRC)
        this.wallsBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, maxCells, ArrayType.U32);
        this.distsBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, maxCells, ArrayType.U32);
        this.pathMaskBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC, maxCells, ArrayType.U32);
        this.keysBuffer = createBuffer(device, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, maxCells, ArrayType.U32);
        this.paramsBuffer = createBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 80);

        // --- 1. Compute Pipeline: Dijkstra Distance Wave ---
        const waveWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                tokens: u32,
                wallThick: f32,
                time: f32,
                hoverIdx: u32,
                pad3: f32,
                wallColor: vec4f,
                routeStart: vec4f,
                routeGoal: vec4f,
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

        this.wavePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: { module: device.createShaderModule({ code: waveWGSL }), entryPoint: 'main' }
        });

        this.waveBindGroup = device.createBindGroup({
            layout: this.wavePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.wallsBuffer } },
                { binding: 1, resource: { buffer: this.distsBuffer } },
                { binding: 2, resource: { buffer: this.paramsBuffer } }
            ]
        });

        // --- 2. Compute Pipeline: Shortest Path Tracer ---
        const traceWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                tokens: u32,
                wallThick: f32,
                time: f32,
                hoverIdx: u32,
                pad3: f32,
                wallColor: vec4f,
                routeStart: vec4f,
                routeGoal: vec4f,
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

                // If startIdx is invalid (999999), skip path tracing during active gameplay
                if (params.startIdx >= total) {
                    return;
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

        this.tracePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: { module: device.createShaderModule({ code: traceWGSL }), entryPoint: 'main' }
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

        // --- 3. Custom Fragment Shader: Crisp Walls & Steady Neon Stream ---
        const fragWGSL = `
            let N = f32(params.gridSize);
            let gx = input.uv.x * N;
            let gy = (1.0 - input.uv.y) * N;

            let cellX = u32(clamp(floor(gx), 0.0, N - 1.0));
            let cellY = u32(clamp(floor(gy), 0.0, N - 1.0));
            let localUV = vec2f(fract(gx), fract(gy));
            let idx = cellY * params.gridSize + cellX;

            var col = vec4f(0.015, 0.02, 0.035, 1.0);
            let w = params.wallThick; // 0.065 Thin Walls

            // Mouse Hover Reticle Highlight
            if (idx == params.hoverIdx) {
                col = vec4f(0.04, 0.12, 0.22, 1.0);
            }

            var isWall = false;

            // 1. Perimeter
            if (gx < 2.0 * w || gx > N - 2.0 * w || gy < 2.0 * w || gy > N - 2.0 * w) {
                isWall = true;
            }

            // 2. Vertical Inner Walls
            let vertLineX = round(gx);
            if (!isWall && abs(gx - vertLineX) < w && vertLineX >= 1.0 && vertLineX <= N - 1.0) {
                let leftX = u32(vertLineX - 1.0);
                let Y = u32(floor(gy));
                let wLeft = walls[Y * params.gridSize + leftX];
                if ((wLeft & 2u) == 0u) { isWall = true; }
            }

            // 3. Horizontal Inner Walls
            let horizLineY = round(gy);
            if (!isWall && abs(gy - horizLineY) < w && horizLineY >= 1.0 && horizLineY <= N - 1.0) {
                let botY = u32(horizLineY - 1.0);
                let X = u32(floor(gx));
                let wBot = walls[botY * params.gridSize + X];
                if ((wBot & 1u) == 0u) { isWall = true; }
            }

            // 4. Corner Pillars
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

            // 5. STEADY NEON ROUTE STREAM (No Blinking!)
            let cellDist = dists[idx];
            let isPath = pathMask[idx];

            if (!isWall && isPath == 1u) {
                let startDist = f32(dists[params.startIdx]);
                let routeProgress = clamp(1.0 - (f32(cellDist) / max(startDist, 1.0)), 0.0, 1.0);

                // Smooth 3-stage spectrum: Emerald -> Cyan -> Gold -> Magenta
                var baseRouteColor: vec3f;
                if (routeProgress < 0.33) {
                    baseRouteColor = mix(vec3f(0.0, 1.0, 0.5), vec3f(0.0, 0.85, 1.0), routeProgress * 3.0);
                } else if (routeProgress < 0.66) {
                    baseRouteColor = mix(vec3f(0.0, 0.85, 1.0), vec3f(1.0, 0.8, 0.0), (routeProgress - 0.33) * 3.0);
                } else {
                    baseRouteColor = mix(vec3f(1.0, 0.8, 0.0), vec3f(1.0, 0.05, 0.55), (routeProgress - 0.66) * 3.0);
                }

                let r = 0.22;
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
                    col = vec4f(baseRouteColor, 1.0); // Solid high-contrast stream
                }
            }

            // COLORFUL WALL GRADIENT
            if (isWall) {
                let wallHue = fract(gx * 0.04 + gy * 0.02 + params.time * 0.08);
                let rainbowWall = 0.5 + 0.45 * cos(6.28318 * (vec3f(0.1, 0.45, 0.8) + wallHue));
                col = vec4f(mix(params.wallColor.rgb, rainbowWall, 0.45), 1.0);
            }

            finalColor = col * paint.opacity;
        `;

        const userFuncsWGSL = `
            struct Params {
                gridSize: u32,
                startIdx: u32,
                goalIdx: u32,
                tokens: u32,
                wallThick: f32,
                time: f32,
                hoverIdx: u32,
                pad3: f32,
                wallColor: vec4f,
                routeStart: vec4f,
                routeGoal: vec4f,
            };
        `;

        // Maze Quad sized 9.6x9.6
        this.mazeShader = new Shader(9.6, 9.6, fragWGSL, { userFunctions: userFuncsWGSL });

        // Expose width & height so Raycaster detects hits across full area
        (this.mazeShader as any).width = 9.6;
        (this.mazeShader as any).height = 9.6;

        // Add 2D Plane Raycast Intersection method directly onto mazeShader
        (this.mazeShader as any).raycast = (ray: Ray, localOrigin: Vec3, localDir: Vec3, worldMatrix: Mat4, hitTolerance: number = 0.05) => {
            const planeZ = this.mazeShader.z_index || 0;
            const t = Raycaster.rayPlaneIntersect(localOrigin, localDir, planeZ);
            if (t !== null) {
                const localHit = localOrigin.add(localDir.scale(t));
                const w = 9.6 + (hitTolerance * 2.0);
                const h = 9.6 + (hitTolerance * 2.0);

                if (Math.abs(localHit.x) <= w * 0.5 && Math.abs(localHit.y) <= h * 0.5) {
                    const worldHit = worldMatrix.transformPoint(localHit.add(this.mazeShader.state.transform.offset));
                    const distance = worldHit.sub(ray.origin).length();
                    return { entity: this.mazeShader, point: worldHit, distance };
                }
            }
            return null;
        };

        this.mazeShader.setStorageBuffer("walls", "array<u32>", this.wallsBuffer);
        this.mazeShader.setStorageBuffer("dists", "array<u32>", this.distsBuffer);
        this.mazeShader.setStorageBuffer("pathMask", "array<u32>", this.pathMaskBuffer);
        this.mazeShader.setStorageBuffer("keys", "array<u32>", this.keysBuffer);
        this.mazeShader.setUniformBuffer("params", "Params", this.paramsBuffer);
        this.add(this.mazeShader);

        // --- 4. Interactive Nodes & Player Avatar ---
        this.startNode = new Circle(0.35);
        this.startNode.paint.fill = new Color(0.0, 1.0, 0.55, 1.0);
        this.startNode.paint.stroke = Color.WHITE;
        this.startNode.paint.strokeWidth = 0.03;
        this.startNode.z_index = 0.4;
        this.add(this.startNode);

        this.goalNode = new Circle(0.35);
        this.goalNode.paint.fill = new Color(1.0, 0.05, 0.45, 1.0);
        this.goalNode.paint.stroke = Color.WHITE;
        this.goalNode.paint.strokeWidth = 0.03;
        this.goalNode.z_index = 0.4;
        this.add(this.goalNode);

        this.playerNode = new Circle(0.28);
        this.playerNode.paint.fill = new Color(0.0, 0.95, 1.0, 1.0); // Vivid Cyan
        this.playerNode.paint.stroke = Color.WHITE;
        this.playerNode.paint.strokeWidth = 0.03;
        this.playerNode.z_index = 0.6;
        this.add(this.playerNode);

        // Mouse Hover Event
        this.mazeShader.setEvent("pointermove", (e: PointerEvent, hit: any) => {
            const hitPoint = hit.point;
            this.hoverCellIdx = this.worldToCell(hitPoint.x, hitPoint.y);
        });

        // Mouse Click Event (Wall Toggling / Hacking)
        this.mazeShader.setEvent("pointerdown", (e: PointerEvent, hit: any) => {
            if (this.isLevelComplete || this.tokensRemaining <= 0) return;

            const hitPoint = hit.point;
            const cell = this.worldToCell(hitPoint.x, hitPoint.y);
            const localUV = this.getPointLocalCellUV(hitPoint.x, hitPoint.y);

            let toggleDir = 0;
            let oppDir = 0;
            let neighborIdx = -1;

            const N = this.activeGridSize;
            const cx = cell % N;
            const cy = Math.floor(cell / N);

            const dxLeft = localUV.x;
            const dxRight = 1.0 - localUV.x;
            const dyBot = localUV.y;
            const dyTop = 1.0 - localUV.y;

            const minD = Math.min(dxLeft, dxRight, dyBot, dyTop);

            if (minD === dyTop && cy + 1 < N) { toggleDir = 1; oppDir = 4; neighborIdx = (cy + 1) * N + cx; }
            else if (minD === dxRight && cx + 1 < N) { toggleDir = 2; oppDir = 8; neighborIdx = cy * N + (cx + 1); }
            else if (minD === dyBot && cy > 0) { toggleDir = 4; oppDir = 1; neighborIdx = (cy - 1) * N + cx; }
            else if (minD === dxLeft && cx > 0) { toggleDir = 8; oppDir = 2; neighborIdx = cy * N + (cx - 1); }

            if (toggleDir !== 0 && neighborIdx !== -1) {
                this.rawWallsData[cell] ^= toggleDir;
                this.rawWallsData[neighborIdx] ^= oppDir;

                this.device.queue.writeBuffer(this.wallsBuffer, 0, this.rawWallsData.buffer);

                this.tokensRemaining--;
                this.updateUI();

                // Wake up engine loop to redraw new wall immediately
                this.writeUniformParams();
                this.continue();
            }
        });

        // --- 5. Key Trackers for Continuous WASD Movement ---
        this.boundKeyDownListener = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
                this.heldKeys.add(key);
            }
        };
        this.boundKeyUpListener = (e: KeyboardEvent) => {
            this.heldKeys.delete(e.key.toLowerCase());
        };

        window.addEventListener("keydown", this.boundKeyDownListener);
        window.addEventListener("keyup", this.boundKeyUpListener);

        // Build On-Canvas Engine UI Entities
        this.buildCanvasNativeUI();
        this.loadLevel(0);

        // --- 6. Main Execution Loop ---
        this.always(() => {
            const N = this.activeGridSize;
            const dtSec = Math.min(this.dt * 0.001, 0.05);
            const tSec = this.time * 0.001;

            // --- A. DISCRETE GRID-SNAPPING SMOOTH MOVEMENT SOLVER ---
            this.updateDiscreteGridMovement(dtSec);

            // Sync Player Node Position
            this.playerNode.transform.position = new Vec3(this.playerPos.x, this.playerPos.y, 0);

            // --- B. BREATHING & PULSING NODES ---
            const pPulse = 1.0 + Math.sin(tSec * 5.0) * 0.10;
            this.playerNode.transform.setScale(pPulse);

            const sPulse = 1.0 + Math.sin(tSec * 2.5) * 0.08;
            this.startNode.transform.setScale(sPulse);

            const gPulse = 1.0 + Math.cos(tSec * 3.5) * 0.10;
            this.goalNode.transform.setScale(gPulse);

            this.keyEntities.forEach((kObj, idx) => {
                if (!kObj.collected) {
                    const kPulse = 1.0 + Math.sin(tSec * 6.0 + idx * 1.5) * 0.15;
                    kObj.circle.transform.setScale(kPulse);
                }
            });

            // --- C. VICTORY ANIMATION UPDATE ---
            if (this.isVictoryAnimActive) {
                this.updateVictoryCelebration(dtSec);
            }

            // --- D. WEBGPU COMPUTE PATHFINDING ---
            if (!this.isLevelComplete) {
                const freshDists = new Uint32Array(N * N).fill(999999);
                freshDists[this.goalCellIdx] = 0;
                this.device.queue.writeBuffer(this.distsBuffer, 0, freshDists.buffer);

                this.writeUniformParams();

                for (let i = 0; i < 20; i++) {
                    this.addCompute({
                        dispatch_count: [Math.ceil(N / 16), Math.ceil(N / 16), 1],
                        pipeline: this.wavePipeline,
                        bind_group: this.waveBindGroup
                    });
                }
            } else {
                this.writeUniformParams();
            }

            this.checkLevelCompletion();
            this.invalidate();
        });
    }

    // --- DISCRETE CELL-SNAPPING MOVEMENT ---
    private updateDiscreteGridMovement(dt: number) {
        if (this.isLevelComplete) return;

        const N = this.activeGridSize;
        const targetWorld = this.cellToWorld(this.targetCellIdx);

        if (this.isMovingBetweenCells) {
            const moveSpeed = 7.5; // Grid cell units per second
            const dirVec = targetWorld.sub(this.playerPos);
            const dist = dirVec.length();

            const step = moveSpeed * dt;

            if (dist <= step) {
                // Snap cleanly to discrete cell center!
                this.playerPos = targetWorld.clone();
                this.playerCellIdx = this.targetCellIdx;
                this.isMovingBetweenCells = false;

                // Check Data Key Pickups at exact cell arrival
                this.keyEntities.forEach(keyObj => {
                    if (!keyObj.collected && keyObj.cellIdx === this.playerCellIdx) {
                        keyObj.collected = true;
                        keyObj.circle.VISIBILITY = false;
                        this.totalScore += 500;
                        this.updateUI();
                    }
                });
            } else {
                this.playerPos = this.playerPos.add(dirVec.normalize().scale(step));
                this.continue();
            }
        }

        // If resting at cell center, check held keys for next discrete move
        if (!this.isMovingBetweenCells && this.heldKeys.size > 0) {
            const cx = this.playerCellIdx % N;
            const cy = Math.floor(this.playerCellIdx / N);
            const wallMask = this.rawWallsData[this.playerCellIdx];

            let desiredNextCell = -1;

            for (const key of this.heldKeys) {
                if ((key === "w" || key === "arrowup") && (wallMask & 1) !== 0 && cy + 1 < N) {
                    desiredNextCell = (cy + 1) * N + cx;
                    break;
                } else if ((key === "d" || key === "arrowright") && (wallMask & 2) !== 0 && cx + 1 < N) {
                    desiredNextCell = cy * N + (cx + 1);
                    break;
                } else if ((key === "s" || key === "arrowdown") && (wallMask & 4) !== 0 && cy > 0) {
                    desiredNextCell = (cy - 1) * N + cx;
                    break;
                } else if ((key === "a" || key === "arrowleft") && (wallMask & 8) !== 0 && cx > 0) {
                    desiredNextCell = cy * N + (cx - 1);
                    break;
                }
            }

            if (desiredNextCell !== -1 && desiredNextCell !== this.playerCellIdx) {
                this.targetCellIdx = desiredNextCell;
                this.isMovingBetweenCells = true;
                this.continue();
            }
        }
    }

    private loadLevel(index: number) {
        this.currentLevelIdx = index;
        const level = PUZZLE_LEVELS[index];

        this.activeGridSize = level.gridSize;
        this.tokensRemaining = level.maxTokens;
        this.isLevelComplete = false;
        this.isVictoryAnimActive = false;
        this.victoryAnimProgress = 0;

        // Clean up particles
        this.particles.forEach(p => { this.remove(p.circle); p.circle.destroy(); });
        this.particles = [];

        const N = level.gridSize;
        this.startCellIdx = level.start[1] * N + level.start[0];
        this.goalCellIdx = level.goal[1] * N + level.goal[0];

        // Discrete Player Placement
        this.playerCellIdx = this.startCellIdx;
        this.targetCellIdx = this.startCellIdx;
        this.isMovingBetweenCells = false;

        const sWorld = this.cellToWorld(this.startCellIdx);
        this.playerPos = new Vec2(sWorld.x, sWorld.y);

        // Generate Maze
        this.rawWallsData = generatePuzzleMaze(N, level.wallSeed);
        this.device.queue.writeBuffer(this.wallsBuffer, 0, this.rawWallsData.buffer);

        // Setup Data Key Terminals
        this.keyCellIndices = level.keys.map(k => k[1] * N + k[0]);
        const keysMap = new Uint32Array(N * N);
        this.keyCellIndices.forEach(kIdx => { keysMap[kIdx] = 1; });
        this.device.queue.writeBuffer(this.keysBuffer, 0, keysMap.buffer);

        // Proportional Point Sizing
        const worldCellSize = 9.6 / N;
        const nodeRadius = worldCellSize * 0.36;
        const playerRadius = worldCellSize * 0.30;
        const keyRadius = worldCellSize * 0.28;

        this.startNode.radius = nodeRadius;
        this.goalNode.radius = nodeRadius;
        this.playerNode.radius = playerRadius;

        this.startNode.transform.position = new Vec3(sWorld.x, sWorld.y, 0);
        this.playerNode.transform.position = new Vec3(sWorld.x, sWorld.y, 0);

        const gWorld = this.cellToWorld(this.goalCellIdx);
        this.goalNode.transform.position = new Vec3(gWorld.x, gWorld.y, 0);

        // Rebuild Key Visualizers
        this.keyEntities.forEach(k => { this.remove(k.circle); k.circle.destroy(); });
        this.keyEntities = [];

        this.keyCellIndices.forEach(kIdx => {
            const kW = this.cellToWorld(kIdx);
            const keyCircle = new Circle(keyRadius);
            keyCircle.paint.fill = new Color(1.0, 0.85, 0.0, 1.0); // Gold
            keyCircle.paint.stroke = Color.WHITE;
            keyCircle.paint.strokeWidth = 0.02;
            keyCircle.z_index = 0.4;
            keyCircle.transform.position = new Vec3(kW.x, kW.y, 0);
            this.add(keyCircle);

            this.keyEntities.push({ circle: keyCircle, cellIdx: kIdx, collected: false });
        });

        this.updateUI();
        this.hideVictoryModal();
    }

    private checkLevelCompletion() {
        if (this.isLevelComplete) return;

        const device = this.device;
        const readBuffer = createBuffer(device, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST, this.activeGridSize * this.activeGridSize, ArrayType.U32);

        const encoder = device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.pathMaskBuffer, 0, readBuffer, 0, this.activeGridSize * this.activeGridSize * 4);
        device.queue.submit([encoder.finish()]);

        readBuffer.mapAsync(GPUMapMode.READ).then(() => {
            const mask = new Uint32Array(readBuffer.getMappedRange());

            // 1. Goal reached by player
            const goalReachedByPlayer = this.playerCellIdx === this.goalCellIdx && !this.isMovingBetweenCells;

            // 2. Keys collected check
            let keysHit = 0;
            this.keyEntities.forEach(kObj => {
                if (kObj.collected || mask[kObj.cellIdx] === 1) {
                    keysHit++;
                }
            });

            this.keysCollectedCount = keysHit;
            this.updateKeyStatusUI();

            if (goalReachedByPlayer && keysHit === this.keyCellIndices.length) {
                this.isLevelComplete = true;

                // Execute final path trace compute pass to show glowing solution
                this.addCompute({
                    dispatch_count: [1, 1, 1],
                    pipeline: this.tracePipeline,
                    bind_group: this.traceBindGroup
                });

                // Score Calculation
                const levelBonus = 1000 + (this.tokensRemaining * 250) + (keysHit * 500);
                this.totalScore += levelBonus;
                this.updateUI();

                this.triggerVictoryCelebration(levelBonus);
            }

            readBuffer.unmap();
            readBuffer.destroy();
        }).catch(() => { });
    }

    // --- BEAUTIFUL VICTORY CELEBRATION & PARTICLE BURST ---
    private triggerVictoryCelebration(bonus: number) {
        this.isVictoryAnimActive = true;
        this.victoryAnimProgress = 0;

        const goalW = this.cellToWorld(this.goalCellIdx);

        // Spawn 28 Cyberpunk Particle Explosions
        const particleColors = [
            new Color(1.0, 0.85, 0.0, 1.0), // Gold
            new Color(0.0, 1.0, 0.55, 1.0), // Emerald
            new Color(0.0, 0.95, 1.0, 1.0), // Cyan
            new Color(1.0, 0.05, 0.55, 1.0)  // Magenta
        ];

        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.2;
            const speed = 2.5 + Math.random() * 3.5;
            const col = particleColors[i % particleColors.length];

            const pCircle = new Circle(0.1 + Math.random() * 0.08);
            pCircle.paint.fill = col;
            pCircle.paint.stroke = Color.WHITE;
            pCircle.paint.strokeWidth = 0.01;
            pCircle.z_index = 0.8;
            pCircle.transform.position = new Vec3(goalW.x, goalW.y, 0);

            this.add(pCircle);

            this.particles.push({
                circle: pCircle,
                pos: new Vec2(goalW.x, goalW.y),
                vel: new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
                life: 0,
                maxLife: 0.8 + Math.random() * 0.6
            });
        }

        this.showVictoryModal(bonus);
    }

    private updateVictoryCelebration(dt: number) {
        // 1. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life += dt;

            p.pos.x += p.vel.x * dt;
            p.pos.y += p.vel.y * dt;
            p.vel = p.vel.scale(0.92); // Drag friction

            p.circle.transform.position = new Vec3(p.pos.x, p.pos.y, 0);
            p.circle.paint.opacity = Math.max(0, 1.0 - (p.life / p.maxLife));

            if (p.life >= p.maxLife) {
                this.remove(p.circle);
                p.circle.destroy();
                this.particles.splice(i, 1);
            }
        }

        // 2. Spring Scale Victory Modal
        if (this.victoryAnimProgress < 1.0) {
            this.victoryAnimProgress += dt * 2.2;
            const t = Math.min(1.0, this.victoryAnimProgress);
            const easeOutSpring = 1.0 - Math.pow(1.0 - t, 3.0); // Cubic Ease Out
            this.victoryContainer.transform.setScale(easeOutSpring);
        }

        this.continue();
    }

    private writeUniformParams() {
        const pData = new ArrayBuffer(80);
        const u32 = new Uint32Array(pData, 0, 8);
        const f32 = new Float32Array(pData, 0, 20);

        u32[0] = this.activeGridSize;

        // NO AUTO-ROUTE BLINKING AT START:
        // Only pass valid startIdx to trace the solution path WHEN level is complete!
        u32[1] = this.isLevelComplete ? this.startCellIdx : 999999;

        u32[2] = this.goalCellIdx;
        u32[3] = this.tokensRemaining;

        f32[4] = 0.055;                    // Thin, crisp firewall walls
        f32[5] = this.time * 0.001;        // Shader animation time
        u32[6] = this.hoverCellIdx;        // Mouse hover reticle
        f32[7] = 0;

        f32.set([0.2, 0.65, 1.0, 1.0], 8);     // Wall color (Electric Cyan)
        f32.set([0.0, 1.0, 0.55, 1.0], 12);    // Route start (Neon Mint)
        f32.set([1.0, 0.05, 0.55, 1.0], 16);   // Route goal (Hot Pink)

        this.device.queue.writeBuffer(this.paramsBuffer, 0, pData);
    }

    // Helper for mathematical text center-alignment using font geometry
    private centerSDFText(text: SDFText, yPos: number) {
        if (!Font.default) return;
        const fontGeom = Font.default.geometry(text.rawText, text.fontSize * 32);
        const textWidth = (fontGeom.width / 32) * text.fontSize;
        text.transform.position = new Vec3(-textWidth / 2, yPos, 0);
    }

    // ============================================================================
    // 3. ENGINE-NATIVE ON-CANVAS HUD & BUTTONS (Strict Layering)
    // ============================================================================

    private buildCanvasNativeUI() {
        // --- 1. Top HUD Bar Background (z_index = 1.0) ---
        this.topBarBg = new Rect(12.8, 1.0);
        this.topBarBg.paint.fill = new Color(0.04, 0.08, 0.16, 0.95);
        this.topBarBg.paint.stroke = new Color(0.0, 0.85, 1.0, 0.4);
        this.topBarBg.paint.strokeWidth = 0.03;
        this.topBarBg.z_index = 1.0;
        this.topBarBg.transform.position = new Vec3(0, 5.8, 0);
        this.add(this.topBarBg);

        // Top HUD Text (z_index = 2.0)
        this.uiTitleText = new SDFText("LVL 01: INITIALIZATION", { fontSize: 0.35 });
        this.uiTitleText.paint.fill = Color.WHITE;
        this.uiTitleText.z_index = 2.0;
        this.uiTitleText.transform.position = new Vec3(-5.8, 5.68, 0);
        this.add(this.uiTitleText);

        this.uiScoreText = new SDFText("SCORE: 00000", { fontSize: 0.35 });
        this.uiScoreText.paint.fill = new Color(0.0, 1.0, 0.6, 1.0);
        this.uiScoreText.z_index = 2.0;
        this.uiScoreText.transform.position = new Vec3(1.2, 5.68, 0);
        this.add(this.uiScoreText);

        // On-Canvas Restart Button (High Contrast Solid Blue with Crisp Text)
        this.restartBtnBg = new Rect(1.8, 0.55);
        this.restartBtnBg.paint.fill = new Color(0.0, 0.75, 1.0, 1.0); // Vibrant Blue
        this.restartBtnBg.paint.stroke = Color.WHITE;
        this.restartBtnBg.paint.strokeWidth = 0.03;
        this.restartBtnBg.z_index = 2.0;
        this.restartBtnBg.transform.position = new Vec3(4.8, 5.8, 0);

        this.restartBtnText = new SDFText("RESTART", { fontSize: 0.22 });
        this.restartBtnText.paint.fill = new Color(0.02, 0.05, 0.1, 1.0); // Bold Black Text
        this.restartBtnText.z_index = 3.0;
        this.restartBtnText.transform.position = new Vec3(-0.55, -0.08, 0);
        this.restartBtnBg.add(this.restartBtnText);

        this.restartBtnBg.setEvent("pointerdown", () => {
            this.loadLevel(this.currentLevelIdx);
        });
        this.add(this.restartBtnBg);

        // --- 2. Bottom HUD Bar Background (z_index = 1.0) ---
        this.bottomBarBg = new Rect(12.8, 1.0);
        this.bottomBarBg.paint.fill = new Color(0.04, 0.08, 0.16, 0.95);
        this.bottomBarBg.paint.stroke = new Color(0.0, 0.85, 1.0, 0.4);
        this.bottomBarBg.paint.strokeWidth = 0.03;
        this.bottomBarBg.z_index = 1.0;
        this.bottomBarBg.transform.position = new Vec3(0, -5.8, 0);
        this.add(this.bottomBarBg);

        // Bottom HUD Text (z_index = 2.0)
        this.uiTokensText = new SDFText("HACK TOKENS: 5/5", { fontSize: 0.28 });
        this.uiTokensText.paint.fill = new Color(0.0, 0.85, 1.0, 1.0);
        this.uiTokensText.z_index = 2.0;
        this.uiTokensText.transform.position = new Vec3(-5.8, -5.92, 0);
        this.add(this.uiTokensText);

        this.uiKeysText = new SDFText("DATA KEYS: 0/1", { fontSize: 0.28 });
        this.uiKeysText.paint.fill = new Color(1.0, 0.85, 0.0, 1.0);
        this.uiKeysText.z_index = 2.0;
        this.uiKeysText.transform.position = new Vec3(-1.8, -5.92, 0);
        this.add(this.uiKeysText);

        this.uiGuideText = new SDFText("[WASD]: MOVE   [CLICK]: HACK WALL", { fontSize: 0.24 });
        this.uiGuideText.paint.fill = new Color(0.7, 0.85, 1.0, 1.0);
        this.uiGuideText.z_index = 2.0;
        this.uiGuideText.transform.position = new Vec3(1.2, -5.92, 0);
        this.add(this.uiGuideText);

        // --- 3. Victory Modal Container & Mathematically Centered Text ---
        this.victoryContainer = new Entity();
        this.victoryContainer.VISIBILITY = false;

        const bannerBg = new Rect(7.6, 4.2);
        bannerBg.paint.fill = new Color(0.04, 0.08, 0.16, 0.98); // High Opacity Card
        bannerBg.paint.stroke = new Color(0.0, 1.0, 0.6, 1.0);
        bannerBg.paint.strokeWidth = 0.05;
        bannerBg.z_index = 5.0; // Higher layer so it sits above grid
        bannerBg.transform.position = new Vec3(0, 0, 0);
        this.victoryContainer.add(bannerBg);

        // Centered Victory Titles
        this.victoryTitleText = new SDFText("SYSTEM BREACHED!", { fontSize: 0.48 });
        this.victoryTitleText.paint.fill = new Color(0.0, 1.0, 0.6, 1.0); // Bright Emerald
        this.victoryTitleText.z_index = 6.0;

        this.centerSDFText(this.victoryTitleText, 1.35);
        this.victoryContainer.add(this.victoryTitleText);



        this.victoryBonusText = new SDFText("LEVEL BONUS: +1,250 PTS", { fontSize: 0.32 });
        this.victoryBonusText.paint.fill = new Color(0.0, 0.95, 1.0, 1.0); // Bright Cyan
        this.victoryBonusText.z_index = 6.0;
        this.centerSDFText(this.victoryBonusText, 0.05);
        this.victoryContainer.add(this.victoryBonusText);


        // Prominent Interactive "NEXT LEVEL ->" Button (Solid Emerald Green + Pure Black Text)
        this.victoryNextBtnBg = new Rect(4.4, 0.95);
        this.victoryNextBtnBg.paint.fill = new Color(0.0, 1.0, 0.6, 1.0); // Solid Emerald Green
        this.victoryNextBtnBg.paint.stroke = Color.WHITE;
        this.victoryNextBtnBg.paint.strokeWidth = 0.04;
        this.victoryNextBtnBg.z_index = 6.0;
        this.victoryNextBtnBg.transform.position = new Vec3(0, -1.15, 0);

        this.victoryNextBtnText = new SDFText("NEXT LEVEL", { fontSize: 0.32 });
        this.victoryNextBtnText.paint.fill = new Color(0.0, 0.0, 0.0, 1.0); // Pure Crisp Black
        this.victoryNextBtnText.z_index = 7.0;

        // Exact center alignment of button text
        const btnTextWidth = Font.default.geometry("NEXT LEVEL", 0.32).width * (0.32 / 32);
        this.victoryNextBtnText.transform.position = new Vec3(-btnTextWidth / 2 - 0.75, -0.08, 0);
        this.victoryNextBtnBg.add(this.victoryNextBtnText);

        // Hover Effect
        this.victoryNextBtnBg.setEvent("pointerover", () => {
            this.victoryNextBtnBg.paint.fill = new Color(0.2, 1.0, 0.7, 1.0);
        });
        this.victoryNextBtnBg.setEvent("pointerout", () => {
            this.victoryNextBtnBg.paint.fill = new Color(0.0, 1.0, 0.6, 1.0);
        });

        // Click Event (Advances to Next Level)
        this.victoryNextBtnBg.setEvent("pointerdown", () => {
            const nextIdx = (this.currentLevelIdx + 1) % PUZZLE_LEVELS.length;
            this.loadLevel(nextIdx);
        });

        this.victoryContainer.add(this.victoryNextBtnBg);
        this.add(this.victoryContainer);
    }

    private updateUI() {
        const level = PUZZLE_LEVELS[this.currentLevelIdx];
        const levelNumStr = level.id < 10 ? `0${level.id}` : `${level.id}`;

        if (this.uiTitleText) {
            this.uiTitleText.setText(`LVL ${levelNumStr}: ${level.title}`);
        }
        if (this.uiTokensText) {
            this.uiTokensText.setText(`HACK TOKENS: ${this.tokensRemaining}/${level.maxTokens}`);
            this.uiTokensText.paint.fill = this.tokensRemaining === 0 ? new Color(1.0, 0.0, 0.3, 1.0) : new Color(0.0, 0.85, 1.0, 1.0);
        }
        if (this.uiScoreText) {
            this.uiScoreText.setText(`SCORE: ${this.totalScore.toLocaleString('en-US', { minimumIntegerDigits: 5 })}`);
        }
    }

    private updateKeyStatusUI() {
        const totalKeys = this.keyCellIndices.length;
        if (this.uiKeysText) {
            this.uiKeysText.setText(`DATA KEYS: ${this.keysCollectedCount}/${totalKeys}`);
            this.uiKeysText.paint.fill = this.keysCollectedCount === totalKeys ? new Color(0.0, 1.0, 0.6, 1.0) : new Color(1.0, 0.8, 0.0, 1.0);
        }
    }

    private showVictoryModal(bonus: number) {
        if (this.victoryBonusText) {
            this.victoryBonusText.setText(`LEVEL BONUS: +${bonus.toLocaleString()} PTS`);
            this.centerSDFText(this.victoryBonusText, 0.05);
        }
        if (this.victoryContainer) {
            this.victoryContainer.transform.setScale(0.01);
            this.victoryContainer.VISIBILITY = true;
        }
    }

    private hideVictoryModal() {
        if (this.victoryContainer) {
            this.victoryContainer.VISIBILITY = false;
        }
    }

    // ============================================================================
    // 4. HELPER FUNCTIONS
    // ============================================================================

    private cellToWorld(idx: number): Vec2 {
        const N = this.activeGridSize;
        const cx = idx % N;
        const cy = Math.floor(idx / N);
        const size = 9.6; // Maze quad physical size
        const wx = (cx + 0.5) * (size / N) - size / 2;
        const wy = (cy + 0.5) * (size / N) - size / 2;
        return new Vec2(wx, wy);
    }

    private worldToCell(wx: number, wy: number): number {
        const N = this.activeGridSize;
        const size = 9.6;
        let cx = Math.floor(((wx + size / 2) / size) * N);
        let cy = Math.floor(((wy + size / 2) / size) * N);

        cx = Math.max(0, Math.min(N - 1, cx));
        cy = Math.max(0, Math.min(N - 1, cy));
        return cy * N + cx;
    }

    private getPointLocalCellUV(wx: number, wy: number): Vec2 {
        const N = this.activeGridSize;
        const size = 9.6;
        const gx = ((wx + size / 2) / size) * N;
        const gy = ((wy + size / 2) / size) * N;
        return new Vec2(gx - Math.floor(gx), gy - Math.floor(gy));
    }

    public destroy() {
        super.destroy();
        if (this.boundKeyDownListener) window.removeEventListener("keydown", this.boundKeyDownListener);
        if (this.boundKeyUpListener) window.removeEventListener("keyup", this.boundKeyUpListener);
    }
}
