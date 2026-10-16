export interface DemoItem {
    id: string;
    name: string;
    description?: string;
}

export type MaterialIcon =
    | "animation"
    | "moving"
    | "tune"
    | "bolt"
    | "view_in_ar"
    | "palette"
    | "science"
    | "transform"
    | "volcano"
    | "alt_route"
    | "perm_media"
    | "movie"
    | "memory"
    | "calculate"
    | "title"
    | "layers"
    | "gesture"
    | "filter_frames"
    | "sports_esports"
    | "speed"
    | "rocket_launch"
    | "fact_check";

export interface CategoryMetadata {
    name: string;
    icon: MaterialIcon;
    tag: string;
    demos: DemoItem[];
}

export const CATEGORIES: CategoryMetadata[] = [
    {
        name: "Core Engine & Lifecycle",
        icon: "bolt",
        tag: "core",
        demos: [
            {
                id: "core/always_options_demo",
                name: "always() Lifecycle & Scheduling Engine",
                description: "Interactive showcase of AlwaysOptions: interval throttling with accumulated dt, start delays, duration lifespans, tick limits, pre/update/post phase ordering, conditional cancellation, and AlwaysHandle controls."
            },
            {
                id: "core/fps_play_options_demo",
                name: "FPS & Interval Play Options",
                description: "Side-by-side comparison of 60 FPS fluid, 24 FPS film, 12 FPS stop-motion/cel, and 150ms interval animation stepping using AnimOptions and PlayOptions."
            }
        ]
    },
    {
        name: "Graph Theory & Automata",
        icon: "alt_route",
        tag: "graphs",
        demos: [
            {
                id: "graphs/automata_dfa_demo",
                name: "TOC: Finite Automata & Tape",
                description: "Deterministic Finite Automaton (DFA) string execution with sliding tape head, live state transitions, and accept/reject verdict badge."
            },
            {
                id: "graphs/graph_theory_demo",
                name: "Graph Theory & Network Physics",
                description: "Force-directed physics layout, dynamic circular morphing, weighted network edges, and shortest path Dijkstra visualization."
            }
        ]
    },
    {
        name: "Charts & Data Visualization",
        icon: "speed",
        tag: "charts",
        demos: [
            {
                id: "charts/chart_gallery_demo",
                name: "Chart Gallery Showcase",
                description: "Decoupled WebGPU charts: BarChart with live data transitions, Donut PieChart with slice explosions, and AreaChart with hover tooltips"
            },
        ]
    },
    {
        name: "Text-To-Speech (TTS)",
        icon: "movie",
        tag: "tts",
        demos: [
            {
                id: "tts/msedge_tts_demo",
                name: "Microsoft Edge Neural TTS (320+ Voices)",
                description: "Studio-quality speech synthesis via Microsoft Edge Read Aloud API, featuring 320+ natural voices across 70+ languages, word boundary metadata, and zero weight downloads."
            }
        ]
    },
    {
        name: "Fourier Series & Mathematics",
        icon: "calculate",
        tag: "fourier",
        demos: [
            {
                id: "fourier/fourier_demo",
                name: "Fourier Epicycles Path Drawing",
                description: "Vector path drawing with rotating Fourier epicycles, Arrow entities, optional Circles, and diminishing TracePath."
            }
        ]
    },
    {
        name: "Geometry & Subdivision",
        icon: "gesture",
        tag: "geometry",
        demos: [
            {
                id: "subdivision/subdivision_demo",
                name: "Universal Subdivision Engine",
                description: "Interactive visual demonstration of all 7 subdivision cases: linear polyline, closed polygon perimeter, de Casteljau Bézier splitting, recursive curve refinement, arc-length resampling, packed WebGPU buffers, and spatial wave warping."
            }
        ]
    },

    {
        name: "User Scene",
        icon: "movie",
        tag: "scene",
        demos: [
            {
                id: "procedural/procedural",
                name: "Procedurals",
                description: "Procedural scene generation"
            },
        ]
    },

    {
        name: "Highlight Animations",
        icon: "filter_frames",
        tag: "highlights",
        demos: [
            {
                id: "highlights/circumscribe_demo",
                name: "Circumscribe Highlight",
                description: "Animated boundary contour (rect, circle, pill) around entities with stroke progress and cleanup"
            },
            {
                id: "highlights/corner_brackets_demo",
                name: "Corner Brackets (HUD Framing)",
                description: "4 L-shaped corner brackets snapping and framing the target entity bounding box"
            },
            {
                id: "highlights/underline_demo",
                name: "Straight & Wavy Underlines",
                description: "Dynamic straight and squiggly/wavy underline strokes beneath text, formulas, and labels"
            },
            {
                id: "highlights/boundary_ripple_demo",
                name: "Boundary Ripple (Radar Ping)",
                description: "Concentric boundary shockwave that pulses outward from target nodes with opacity fade"
            },
            {
                id: "highlights/marker_sweep_demo",
                name: "Marker Sweep (Highlighter Pen)",
                description: "Realistic highlighter pen wipe sweeping across code lines and phrases"
            },
            {
                id: "highlights/backdrop_fade_demo",
                name: "Backdrop Fade (Card / Pill)",
                description: "Soft rounded card / badge plate fading in behind elements for grouping and contrast"
            },
            {
                id: "highlights/shimmer_sweep_demo",
                name: "Creation Finish: Shimmer Sweep",
                description: "Specular emissive light sheen sweeping across newly created shapes and formulas"
            },
            {
                id: "highlights/sparkle_burst_demo",
                name: "Celebration: Sparkle Burst",
                description: "Celebratory 4-point sparkle stars bursting and rotating at object corners"
            },
            {
                id: "highlights/flash_finish_demo",
                name: "Impact Snap: Flash Finish",
                description: "High-intensity white or accent flash overlay with exponential decay for landing impacts"
            },
            {
                id: "highlights/color_tint_demo",
                name: "Intrinsic Color Tint",
                description: "Smooth color transition of entity fill and stroke to accent colors and graceful restoration"
            },
            {
                id: "highlights/pulse_glow_demo",
                name: "Breathing Aura: Pulse Glow",
                description: "Ambient breathing glow plate behind entities pulsing with sinusoidal cycles"
            },
            {
                id: "highlights/pop_highlight_demo",
                name: "Elastic Motion: Pop Highlight",
                description: "Elastic punch scale-up and spring return for buttons and selection emphasis"
            },
            {
                id: "highlights/wiggle_highlight_demo",
                name: "Alert / Shake: Wiggle Highlight",
                description: "Decaying angular oscillation / jiggle vibration for notifications and warning alerts"
            },
            {
                id: "highlights/flash_demo",
                name: "Radial Flash Lines",
                description: "Radial line rays shooting outward from a central entity or coordinate point"
            },
            {
                id: "highlights/blink_demo",
                name: "Opacity Blink Animation",
                description: "Oscillates entity opacity for attention-grabbing blinks or cursor pulses"
            }
        ]
    },

    {
        name: "Animation Gallery",
        icon: "animation",
        tag: "2d",
        demos: [
            {
                id: "features/introducer_showcase",
                name: "Introducer Animation Showcase",
                description: "All 27 new introducer animations: SlideIn, SpinIn, GrowFromEdge, RevealFromClip, IrisIn, WipeIn, UnfoldFromCenter, AppearInstant, CrystallizeIn, TransmitIn, DrawBorderOnly, DropIn, WaveIn, CascadeIn, StaggerWrite, ScatterAssemble, BatchIntroduce, GlowIn, BurstIn, PopIn, EraseIn, TraceBack, BloomIn, ShimmerIn, TelegraphThenReveal, MaterializeFrom"
            },
            {
                id: "features/typewriter_showcase",
                name: "Typewriter Showcase",
                description: "Full Typewriter animation demo: cursor styles (pipe, underscore, block, thin_block, arrow, custom), blink speed, jitter, type → delete → retype sequences, instant clear, keepCursor, and a full finale"
            },
            {
                id: "features/track_animation_demo",
                name: "TrackBuilder & Custom Entity Architecture",
                description: "Custom composite entity lifecycle with TrackBuilder: parallel intros, series staging, temporal pauses (.wait), and seamless scene.play(new Create(entity)) integration."
            },
            {
                id: "features/audio_demo",
                name: "Audio System & Visualizer",
                description: "AudioPlugin integration, timeline audio clips, real-time FFT spectrum visualizer bars, and 3D spatial audio"
            },
            {
                id: "features/dynamic_synth_demo",
                name: "Dynamic Audio Synthesis & Live Buffer Mutation",
                description: "Procedural sound synthesis with createBuffer, mixing harmonic frequencies, and live in-place sample modulation"
            }
        ]
    },

    {
        name: "Motion & Movement",
        icon: "moving",
        tag: "2d",
        demos: [
            { id: "motion/arc_demo", name: "Arc Movement", description: "Circle swoops along an arc, then back with negative height" },
            { id: "motion/bezier_demo", name: "Bézier Curve", description: "Quadratic (1 control pt) and cubic (2 control pts, S-curve)" },
            { id: "motion/parabolic_demo", name: "Parabolic Arc", description: "Toss arc right, then shorter bounce back" },
            { id: "motion/wave_demo", name: "Wave / Sinusoidal", description: "Sinusoidal movement with forward and backward oscillations" },
            { id: "motion/shake_demo", name: "Shake / Jitter", description: "Gentle and intense shake animations" },
            { id: "motion/orbit_demo", name: "Orbit / Revolve", description: "Full and half orbit around a center entity" },
            { id: "motion/spiral_demo", name: "Spiral", description: "Spiral inward and outward with changing radius" },
            { id: "motion/spring_demo", name: "Spring Physics", description: "Underdamped, overdamped, and high-stiffness spring motion" },
            { id: "motion/lissajous_demo", name: "Lissajous Curve", description: "Figure-eight and trefoil knot parametric curves" },
            { id: "motion/spline_demo", name: "Spline / Path Follow", description: "Catmull-Rom spline following waypoints and SVG paths" },
        ]
    },
    {
        name: "Studio Inspector Suite",
        icon: "tune",
        tag: "tools",
        demos: [
            { id: "features/inspector_test_scene", name: "Inspector Controls Test Suite", description: "Interactive test scene showcasing all 14 visual editor inspectors" }
        ]
    },
    {
        name: "Compute Shaders",
        icon: "bolt",
        tag: "compute",
        demos: [
            { id: "compute_shaders/interactive_shader", name: "2D Interactive WGSL", description: "Interactive 2D compute shader with mouse uniforms" },
            { id: "compute_shaders/custom_shader", name: "Custom Shader", description: "Custom WGSL compute shader pipeline" },
            { id: "compute_shaders/shader_plasma", name: "Plasma Effect", description: "High-frequency plasma wave compute animation" },
            { id: "compute_shaders/shader_raymarchedhallway", name: "Raymarched Hallway", description: "Volumetric raymarched hallway in WGSL" },
            { id: "compute_shaders/shader_uniforms", name: "Shader Uniforms", description: "Dynamic uniform buffer updates in compute shaders" },
            { id: "compute_shaders/game_of_life", name: "Conway's Game of Life", description: "GPU-accelerated cellular automata simulation" },
            { id: "compute_shaders/instance_gpu", name: "Instance GPU", description: "Massive GPU instancing via storage buffers" },
            { id: "compute_shaders/n_body", name: "N-Body Simulation", description: "Gravitational N-body particle simulation" },
            { id: "compute_shaders/intermediate_render_compute_demo", name: "Intermediate Render to Compute", description: "Offscreen render target processed with compute shader and mapped to 3D TV" },
            { id: "compute_shaders/gpu_perlin_marching_squares_3d", name: "GPU Perlin Noise & Marching Surface", description: "GPU-accelerated multi-octave Perlin noise texture driving 3D surface extraction" },
        ]
    },
    {
        name: "GPU Instancing & Swarms",
        icon: "layers",
        tag: "3d",
        demos: [
            { id: "instancing/instanced_interactive_picking", name: "Interactive Raycast Picking", description: "Per-instance raycast hit detection and interactive hover/click selection on 3D instanced grids" },
            { id: "instancing/instanced_active_range", name: "Dynamic Active Range & Pool", description: "Particle fountain demonstrating dynamic activeCount and ring-buffer firstInstance without GPU buffer reallocations" },
            { id: "instancing/instanced_non_uniform_scale", name: "Non-Uniform 3D Scaling", description: "Extended 16-float stride layout enabling independent 3D anisotropic scaling and attractor deformation" },
            { id: "instancing/instanced_partial_streaming", name: "Partial Buffer Streaming", description: "Localized sub-range dirty updates streaming only affected bytes across 40,000 instances at 60 FPS" },
            { id: "instancing/instanced_staggered_animation", name: "Staggered Mandala Cascade", description: "Built-in animateStaggered() API driving a 2,000-instance golden ratio spiral entrance with spring physics" },
        ]
    },
    {
        name: "3D Geometry & Raytracing",
        icon: "view_in_ar",
        tag: "3d",
        demos: [
            { id: "geometry_raytracing_3d/styles_and_shadows_demo", name: "Art Styles & Contact Shadows (PCSS)", description: "Gooch technical illustration, Cel/Toon shading with Fresnel rim, Studio Clay, and Percentage-Closer Soft Shadows (PCSS)" },
            { id: "geometry_raytracing_3d/plugin_system_demo", name: "Plugin Architecture & Chaining", description: "Live demonstration of scene.use(plugin) chaining: CelShading, OutlinePass inking, and custom runtime plugins" },
            { id: "geometry_raytracing_3d/mouse_trace", name: "Mouse Trace & Splines", description: "3D mouse interaction with Chaikin splines" },
            { id: "geometry_raytracing_3d/cornell_box", name: "Classic Cornell Box", description: "Path traced Cornell box with soft shadows" },
            { id: "geometry_raytracing_3d/builder_3d_demo", name: "3D Path Builder", description: "Constructing 3D geometry from vector paths" },
            { id: "geometry_raytracing_3d/shadow_map", name: "Shadow Mapping", description: "Real-time depth shadow mapping" },
            { id: "geometry_raytracing_3d/shadow_map_transparency", name: "Shadow Map Transparency", description: "Filtered transparent shadow maps" },
            { id: "geometry_raytracing_3d/builder_demo2", name: "3D Builder Demo II", description: "Advanced 3D procedural object generation" },
            { id: "geometry_raytracing_3d/depth_map", name: "Terrain System", description: "Procedural heightmap terrain rendering" },
        ]
    },
    {
        name: "2D Shapes & Paths",
        icon: "palette",
        tag: "2d",
        demos: [
            { id: "shapes_paths_2d/shapes_showcase_demo", name: "2D & 3D Geometric Shapes Library", description: "Comprehensive showcase of customizable 2D vector shapes (Diamond, Star, Heart, Squircle, Crescent, Trapezoid, Parallelogram, Cross, Chevron, Gear) and 3D procedural meshes (Diamond, Bipyramid, Superellipsoid, Capsule, Torus Knot, Helix, Rounded Box, Icosahedron, Gear)." },
            { id: "shapes_paths_2d/shapes_showcase_part2_demo", name: "Geometric Shapes Library — Part 2", description: "Extended showcase of 19 additional shapes: 2D curves (RegularPolygon, Capsule, Teardrop, Annulus, Sector, Spiral, CurvedArrow, DoubleArrow, Waveform, I-Beam) and 3D meshes (Prism, Pyramid, Truncated Cone, Tube, Ellipsoid, Wedge, Platonic Solids)." },
            { id: "shapes_paths_2d/instanced_path_demo", name: "Instanced Vector Mandala", description: "2,500 ornate vector petals with fill & stroke in a living Fibonacci mandala, rendered in 2 WebGPU draw calls" },
            { id: "shapes_paths_2d/path_vertex_animation", name: "Procedural Path Kinematics", description: "Per-frame 2D vertex & control point manipulation using native Path.setRawContour, Spline.setPoints, and Poly.setVertices" },
            { id: "shapes_paths_2d/chalk_demo", name: "Handwritten Chalk Simulation", description: "Procedural blackboard chalk path effect with slate micro-porosity, muscular pressure cadence, crumbly edges, and LaTeX math" },
            { id: "shapes_paths_2d/dynamic_stroke_demo", name: "Dynamic Line Weight & Artistic Stroke", description: "Procedural artistic path effect with organic line weight modulation, muscular cadence, calligraphy tapers, and fluid ink pooling" },
            { id: "shapes_paths_2d/stroke_demo", name: "Dynamic Strokes & GPU Length", description: "Variable width stroke rendering with length parametrization" },
            { id: "shapes_paths_2d/line_caps", name: "Line Caps & Joins", description: "GPU anti-aliased line join and cap modes" },
            { id: "shapes_paths_2d/path_joints_caps_arrows", name: "Path Joints, Caps & 2D Arrows", description: "Static visual test suite for Path end caps (Butt, Round, Square), joints (Miter, Round, Bevel, None), and 2D Arrow tip styles (Triangle, Stealth, Line) across linear, curved, and segmented paths." },
            { id: "shapes_paths_2d/path_transform", name: "2D Path Interpolation", description: "Smooth shape morphing and path interpolation" },
            { id: "shapes_paths_2d/svg_transform", name: "SVG Interpolation", description: "Parsing and morphing SVG path elements" },
            { id: "shapes_paths_2d/typography", name: "SDF & Vector Typography", description: "SDF vector font rendering with high sharpness" },
            { id: "shapes_paths_2d/builder_demo", name: "Path Builder", description: "Interactive 2D path construction tool" },
            { id: "shapes_paths_2d/tiger_scene", name: "Ghostscript Tiger", description: "Classic Ghostscript Tiger SVG benchmark" },
            { id: "shapes_paths_2d/fill_demo", name: "Fill Effects", description: "Even-Odd and Non-Zero GPU winding fill rules" },
        ]
    },
    {
        name: "Path Modifiers",
        icon: "transform",
        tag: "2d",
        demos: [
            {
                id: "modifiers/path_modifiers_showcase",
                name: "Modifiers Pipeline Showcase",
                description: "Multi-modifier pipeline combining Resample, Wiggle, Trim, RoundCorners, and ZigZag simultaneously on vector paths."
            },
            {
                id: "modifiers/resample_demo",
                name: "Resample: Equidistant Arc-Length",
                description: "Re-parameterizes curves to strictly equidistant arc-length samples, resolving velocity spikes and enabling smooth non-linear bending."
            },
            {
                id: "modifiers/trim_demo",
                name: "Trim: Continuous Traveling Strokes",
                description: "Parametric de Casteljau split trimming with cyclical wrap-around offset support for looping racing beams."
            },
            {
                id: "modifiers/wiggle_demo",
                name: "Wiggle: Line Boil & Electricity",
                description: "Coherent multi-octave normal displacement with smooth fluid wave and sharp electric arc/lightning modes."
            },
            {
                id: "modifiers/round_corners_demo",
                name: "Round Corners: 2D Fillet Arcs",
                description: "Replaces sharp polygon corners with smooth quadratic Bézier fillet arcs tangent to adjacent edges."
            },
            {
                id: "modifiers/offset_demo",
                name: "Offset: Normal Dilation (Inset/Outset)",
                description: "Displaces path boundaries parallel to local curve normals for concentric elevation rings and wireframe insets."
            },
            {
                id: "modifiers/zigzag_demo",
                name: "ZigZag: Sawtooth & Sinusoidal Waves",
                description: "Periodic triangular teeth and sinusoidal wave ripples along local normals for schematic resistors and scalloped borders."
            },
            {
                id: "modifiers/dash_demo",
                name: "Dash: Geometric Sub-Paths with Caps",
                description: "True geometric dash splitting preserving real stroke caps (Round, Square, Triangle) and animated phase offsets."
            },
            {
                id: "modifiers/reverse_demo",
                name: "Reverse: Direction & Normal Inversion",
                description: "Inverts contour vertex order, tangent vectors, and curve normals for reversed drawing animations."
            },
            {
                id: "modifiers/pucker_bloat_demo",
                name: "Pucker & Bloat: Radial Tension Morph",
                description: "Radial deformation relative to centroid while anchoring corner endpoints (pinched star ◄──► puffy flower)."
            },
            {
                id: "modifiers/twist_demo",
                name: "Twist: Angular Vortex Distortion",
                description: "Rotates coordinates around a center with smooth cubic radial falloff for spiral galaxy and whirlpool effects."
            },
            {
                id: "modifiers/smooth_demo",
                name: "Smooth: RDP & Chaikin Curvature",
                description: "Douglas-Peucker vertex reduction combined with Chaikin subdivision to smooth jagged polylines into continuous curves."
            },
            {
                id: "modifiers/wobble_demo",
                name: "Wobble: Hand-Drawn Sketch & Line Boil",
                description: "Biomechanical wrist bowing, motor tremor, corner overshoot, and 2-pass loose sketch strokes (Rough.js style) with animated 12 FPS line boil."
            },
            {
                id: "modifiers/sketch_pen_demo",
                name: "Sketch Pen: Artistic Stroke Width",
                description: "Strict rough.js Excalidraw geometry with the sketch pen: random artistic width within 50-100% of the stroke, lighter where the pen lands and lifts, plus bias and variation controls."
            },
            {
                id: "modifiers/custom_modifier_demo",
                name: "Custom Modifiers: Functional & OOP",
                description: "How to create custom geometric modifiers using inline CustomModifier and reusable classes extending PathModifier."
            }
        ]
    },
    {
        name: "Hand-Drawn & Whiteboard",
        icon: "gesture",
        tag: "2d",
        demos: [
            {
                id: "sketch/excalidraw_fills_demo",
                name: "Excalidraw: Marker Scribble & Grid Fills",
                description: "Signature hand-drawn marker scribble with smooth looping Bézier turns and perpendicular orthogonal grid fill patterns."
            },
            {
                id: "sketch/tex_excalifont_demo",
                name: "LaTeX: Excalifont Handwritten Math",
                description: "Side-by-side comparison of standard TeX vs Excalifont handwritten typography for equations, integrals, exponents, and Greek symbols."
            },
            {
                id: "sketch/excalidraw_demo",
                name: "Excalidraw Whiteboard Style",
                description: "Excalidraw hand-drawn whiteboard style: wobbled dual-pass outlines, hachure, cross-hatch, zigzag, dotted, sketch and solid fills, and 12 FPS line boil."
            },
            {
                id: "sketch/excalidraw_cards_demo",
                name: "Excalidraw Geometric Cards",
                description: "Authentic hand-drawn card trio: cross-hatch heart, hachure circle, and diamond showcase on white whiteboard canvas."
            },
            {
                id: "sketch/excalidraw_map_demo",
                name: "Excalidraw: Hand-Drawn USA Map",
                description: "The iconic 50-state USA map showcase recreated with Retiam's native Excalidraw vector engine: sketch pen strokes, multi-angle hachures, and solid washes."
            },
            {
                id: "sketch/rough_demo",
                name: "Rough.js: Authentic Hand-Drawn Showcase",
                description: "The iconic Rough.js 3-card showcase rendered with real rough.js generator geometry, auto-seeding, and 12 FPS line boil animation."
            },
            {
                id: "sketch/rough_map_demo",
                name: "Rough.js: Hand-Drawn USA Map",
                description: "The iconic 50-state USA map showcase with per-state solid washes, directional hachures, and cross-hatching."
            }
        ]
    },
    {
        name: "Physics & Simulation",
        icon: "science",
        tag: "physics",
        demos: [
            { id: "physics/physics_large_scale", name: "Large-Scale 3D Galton Cascade", description: "High-density simulation with 600+ cascading physical bodies, multi-tier Pachinko pin field, and distribution bins" },
            { id: "physics/physics_math3d", name: "Math3D Geometric Physics", description: "Physics simulation with translucent MathShape3D polyhedra, toruses, wireframes, and ramps" },
            { id: "physics/box3d_demo", name: "Box3D WASM Physics", description: "Erin Catto's Box3D WebAssembly physics engine with domino stack, bouncing spheres, and rotating kinematic paddle" },
            { id: "physics/physics", name: "3D Rigid Body Physics", description: "3D rigid body collisions using Rapier3D WebAssembly engine" },
            { id: "physics/physics2d", name: "2D Rigid Body Physics", description: "2D physics solver with restitution and friction" },
            { id: "physics/physics_showcase", name: "Physics Showcase", description: "Interactive multi-object physics playground" },
            { id: "physics/physics_trimesh", name: "Irregular Trimesh Terrain", description: "Exact triangle mesh collision simulation on concave 3D terrain" },
            { id: "physics/physics2d_rapier", name: "Rapier 2D Multi-Body", description: "High-density 2D physics simulation with Continuous Collision Detection (CCD) using Rapier2D" },
            { id: "physics/physics2d_seesaw", name: "2D Seesaw & Joints", description: "Box2D/Rapier classic teeter-totter benchmark powered by RevoluteJoint constraints" },
            { id: "physics/physics2d_springs", name: "2D Springs & Trampoline", description: "Harmonic bungees, double spring pendulum, and elastic suspended trampoline" },
            { id: "physics/physics2d_mouse_drag", name: "2D Mouse Drag & Toss", description: "Interactive pointer manipulation, spring-based grabbing, and throwing of 2D rigid bodies" },
            { id: "physics/physics2d_collisions", name: "2D Collision & Contact Listeners", description: "Contact event hooks, impulsive bumper reflections, flash coloring, and trigger zones" },
            { id: "physics/physics2d_softbody", name: "2D Soft Body & Deformable Jelly", description: "Spring-lattice deformable jelly polygons, elastic deformation, and pinned soft mesh" },
            { id: "physics/carrom_game", name: "2D Physics Carrom Board Game", description: "Playable Carrom board game with realistic 2D physics, slingshot aiming, cushions, pockets, and clean minimalist aesthetic" },
            { id: "physics/billiards_game", name: "3D Physics Billiards (8-Ball Pool)", description: "Playable 8-Ball pool with 3D Rapier physics, cue stick aiming, spin/english, realistic ball collisions, AI bot, and luxury aesthetic" },
            { id: "new_shader_architecture/cloth_sim", name: "GPU Cloth Simulation", description: "Real-time spring mass GPU cloth solver" },
        ]
    },
    {
        name: "Morph 3D & SDF",
        icon: "transform",
        tag: "3d",
        demos: [
            { id: "morph_3d/morph_swarm", name: "Particle Swarm Morph", description: "GPU Gaussian Splat particle swarm transitioning with 3D curl noise" },
            { id: "morph_3d/morph_dual_contouring", name: "Dual Contouring Volumetric Morph", description: "Sharp feature-preserving volumetric dual contouring with QEF solver" },
            { id: "morph_3d/morph_sdf_volumetric", name: "SDF Volumetric Marching Cubes", description: "GPU Marching Cubes isosurface extraction for liquid-metal organic morphing" },
            { id: "morph_3d/morph_naive", name: "Naive Linear Vertex Morph", description: "High-performance direct 1:1 vertex and normal blendshape interpolation" },
            { id: "morph_3d/morph_parametric", name: "Parametric Surface Morph", description: "Manim-style exact 1:1 vertex interpolation of mathematical surfaces" },
            { id: "morph_3d/morph_superquadric", name: "Superquadric Metamorphosis", description: "Continuous morphing across the 2-parameter superquadric family (Sphere, Cube, Cylinder, Diamond, Pillow)" },
            { id: "morph_3d/morph_catenoid_helicoid", name: "Isometric Catenoid-Helicoid", description: "Bonnet associate family minimal surface isometric bending without stretching" },
            { id: "morph_3d/morph_torus_family", name: "Torus Aperture Homotopy", description: "Topological singularity deformation: Ring Torus to Horn Torus, Spindle Torus, and Degenerate Sphere" },
            { id: "morph_3d/morph_mobius", name: "Ribbon & Möbius Homotopy", description: "Continuous ribbon twisting from cylindrical band to Möbius strip and trefoil ribbons" },
            { id: "morph_3d/morph_polyhedra", name: "Polyhedra & Prisms Morph", description: "Topological metamorphosis across Platonic solids and prisms: Cube, Tetrahedron, Prism, and Octahedron" },
            { id: "morph_3d/morph_mat_folding", name: "Mat & Origami Folding Morph", description: "Continuous 3D folding and rolling kinematics: Flat Mat, Accordion Pleats, 180° Book Fold, Spiral Scroll, and Double Roll" },
            { id: "features/mat_folding_procedural", name: "Procedural Mat Folding (Manual Vertices)", description: "Direct programmatic vertex animation on a single entity without Auto-Morph: Yoga Roll, 180° Book Fold, Accordion, and Origami" },
            { id: "morph_3d/morph_sdf_raymarching", name: "Analytic SDF Raymarch Morph", description: "Raymarched volumetric signed distance field smooth blending" },
            { id: "morph_3d/morph_swarm_trajectories", name: "Swarm Trajectory Showcase", description: "Comparing Spiral, Fluid, Scatter, and Linear particle flight paths" },
            { id: "morph_3d/swarm_morph", name: "Legacy Swarm Morph Demo", description: "Interactive particle swarm transitioning between complex shapes" },
            { id: "morph_3d/morph_demo", name: "Legacy Dual Contouring Demo", description: "Dual contouring morphing between 3D signed distance fields" },
        ]
    },
    {
        name: "Raymarching & SDF Volumes",
        icon: "volcano",
        tag: "3d",
        demos: [
            { id: "raymarch/raymarch", name: "Plot3D Surface", description: "3D mathematical surface raymarching" },
            { id: "raymarch/raymarched_dynamic", name: "Raymarch Input", description: "Interactive raymarched primitive solids" },
            { id: "raymarch/sdf_volume", name: "SDF Volume Rendering", description: "Volumetric signed distance field raymarcher" },
            { id: "raymarch/sdf_2d", name: "2D SDF Primitive Showcase", description: "Exact 2D distance functions with outline distance metrics" },
            { id: "raymarch/sdf_test", name: "SDF 3D Test", description: "3D Boolean SDF operators (Union, Intersect, Difference)" },
            { id: "raymarch/sdf_morph", name: "SDF 3D Morph", description: "Smooth blending between 3D SDF primitives" },
        ]
    },
    {
        name: "Hybrid & Multi-Pass Pipelines",
        icon: "alt_route",
        tag: "compute",
        demos: [
            { id: "hybrid_pipelines/hybrid_mix", name: "Hybrid Raytrace + Rasterizer", description: "Combining rasterized UI geometry with raytraced scenes" },
            { id: "multi_pass/multipass", name: "Multi-Pass Framebuffer", description: "Multi-stage post-processing pipeline" },
            { id: "multi_pass/multipass2", name: "Multi-Pass Bloom & Blur", description: "Gaussian blur and glow bloom post-process pass" },
            { id: "multi_pass/compute_sim", name: "Compute Simulation Pass", description: "Compute buffer feedback into raster rendering pass" },
            { id: "multi_pass/vhsc_showcase", name: "VHS Distortion Showcase", description: "Retro CRT and VHS glitch post-processing effect" },
            { id: "multi_pass/outline_showcase", name: "Outline Post-Process Showcase", description: "Sobel depth edge-detection outline filter" },
        ]
    },
    {
        name: "Media & Textures",
        icon: "perm_media",
        tag: "2d",
        demos: [
            { id: "media_textures/media_raster", name: "Rasterized Image & Video", description: "Video texture streaming and image sampling" },
            { id: "media_textures/texture_mapping", name: "PBR Material Mapping", description: "Normal mapping, roughness, and metalness PBR workflow" },
            { id: "media_textures/texture_atlas", name: "Texture Atlas & SubTexture", description: "Sub-uv texture atlas sampling for sprite batching" },
            { id: "media_textures/html_in_canvas", name: "HTML Canvas Overlay", description: "DOM element mapping onto WebGPU canvas surface" },
        ]
    },
    {
        name: "Camera & Animation",
        icon: "movie",
        tag: "3d",
        demos: [
            { id: "features/camera2d_demo", name: "2D Camera Controller", description: "Smooth 2D orthographic camera with target follow, deadzone, lookahead, shake & bounds" },
            { id: "camera_anim/camera_anim", name: "Camera Orbit & Flyover", description: "Smooth camera keyframe spline interpolation" },
            { id: "camera_anim/fix_to_camera", name: "Fixed Camera UI HUD", description: "Locking 2D vector elements to screen-space overlay" },
        ]
    },
    {
        name: "Shader Architecture",
        icon: "memory",
        tag: "compute",
        demos: [
            { id: "new_shader_architecture/rotating_triangle", name: "Rotating Triangle", description: "Core pipeline hello-world rotating triangle" },
            { id: "new_shader_architecture/circle_stroke", name: "Circle Stroke", description: "SDF circle stroke with anti-aliased edge smoothing" },
            { id: "new_shader_architecture/path", name: "Vector Path Shader", description: "High performance vector path shader" },
            { id: "new_shader_architecture/path_compute", name: "Path Compute Tesselator", description: "GPU compute-based path tessellation" },
            { id: "new_shader_architecture/mesh2d", name: "Compute Grid", description: "Dynamic grid vertex displacement via compute" },
            { id: "new_shader_architecture/sprite", name: "Image & Video Sprites", description: "Batched sprite rendering pipeline" },
            { id: "new_shader_architecture/poly_showcase", name: "Poly Showcase", description: "Procedural polygon rendering" },
            { id: "new_shader_architecture/sdf_text", name: "SDF Text Pipeline", description: "Multichannel SDF text rendering engine" },
            { id: "new_shader_architecture/3d_line", name: "3D Line Ribbon", description: "Screen-space wide 3D tube and line ribbon" },
            { id: "new_shader_architecture/nested_scene", name: "Nested Scene Graph", description: "Hierarchical scene graph parent-child transformations" },
            { id: "new_shader_architecture/text_showcase", name: "Text Showcase", description: "Typography styles and rich text formatting" },
            { id: "new_shader_architecture/text_test", name: "New Text Interface", description: "Updated text layout and alignment API" },
            { id: "new_shader_architecture/write_animation", name: "Write Draw Animation", description: "Handwriting vector path draw animation" },
        ]
    },
    {
        name: "Features & Math",
        icon: "calculate",
        tag: "2d",
        demos: [
            { id: "features/anchor", name: "Anchor Alignment", description: "Transform origin and anchor point positioning" },
            { id: "features/move_vs_moveto_demo", name: "move() vs moveTo() Comparison", description: "Side-by-side demo showing how move(target, anchor) and moveTo(target, anchor) differ under scaling and rotation transforms" },
            { id: "features/feature_plot", name: "Plotting & Value Tracker", description: "Real-time function plotting and interactive crosshair" },
            { id: "features/feature_plot_function", name: "Explicit Function Plotter", description: "Plotting y = f(x) explicit mathematical expressions" },
            { id: "features/feature_plot_parametric", name: "Parametric Curve Plotter", description: "Plotting (x(t), y(t)) parametric curves" },
            { id: "features/feature_plot_implicit", name: "Implicit Function Plotter", description: "Plotting f(x, y) = 0 implicit algebraic curves" },
            { id: "features/feature_equation", name: "LaTeX Equation Transform", description: "Morphing between mathematical LaTeX equations" },
            { id: "features/feature_brace", name: "Annotation & Curly Braces", description: "Dynamic curly braces and label annotations" },
            { id: "features/feature_number_plane", name: "Number Plane & Grid", description: "2D Cartesian coordinate plane with fine/coarse grid lines, coordinate mapping (c2p/p2c), and multi-curve plotting" },
            { id: "features/feature_complex_plane", name: "Complex Plane & Conformal Mappings", description: "Complex analysis plane (Re vs Im), complex parametric curves, and non-linear conformal space deformations" },
            { id: "features/feature_calculus", name: "Calculus & Visual Analysis", description: "Definite integral shaded area, Riemann midpoint/trapezoid rectangles, tangent lines, and coordinate projections" },
            { id: "features/feature_polar_axes", name: "Polar Coordinates & Rose Curves", description: "Polar coordinate system (r, theta) with angular grids, rose curves, and Archimedean spirals" },
            { id: "features/feature_threed_axes", name: "3D Axes & Coordinate Planes", description: "3D Cartesian coordinate system with XY/XZ/YZ planes, 3D parametric helix curves, and 3D surface graphs" },
            { id: "features/feature_dot", name: "Manim Dot & Annotations", description: "Standard Dots, LabeledDots on geometric vertices, AnnotationDots for roots/peaks, and Glowing particle tracers" },
            { id: "features/feature_vector_field", name: "Vector Field 2D", description: "2D direction field vector visualization" },
            { id: "features/feature_vector_field_3d", name: "Vector Field 3D", description: "3D vector field stream line particles" },
            { id: "features/feature_vector_field_fluid", name: "2D Fluid Dynamics Field", description: "Navier-Stokes fluid vector field simulation" },
            { id: "features/feature_surface", name: "Parametric 3D Surface", description: "3D surface mesh plotting with height colormaps" },
            { id: "features/noise", name: "3D Procedural Noise Terrain", description: "Multi-octave FBM Perlin noise surface with domain warping & Worley cellular detail" },
            { id: "features/noise_1d", name: "1D Noise Signals & Fractals", description: "Comparing 1D Perlin, Simplex, Value, Worley Cellular, FBM & Ridged Multifractals" },
            { id: "features/noise_curl_2d", name: "2D Curl Noise Vector Field", description: "Divergence-free 2D fluid turbulence flow generated via Curl Noise" },
            { id: "features/noise_scalers", name: "Noise Scalers & Terraced Contours", description: "Quantized topological terrace steps, gamma power curves & range remapping" },
            { id: "features/math_shape", name: "Math Geometric Shapes", description: "Standard geometric primitives for math diagrams" },
            { id: "features/polyhedra_prisms_showcase", name: "Polyhedra & Prisms Showcase", description: "Interactive gallery of Platonic solids and prisms: Cube, Tetrahedron, Triangular Prism, Octahedron, and Hexagonal Prism" },
            { id: "features/model_manim_shading_showcase", name: "Model Entity Manim Shading", description: "Primitives (Box, Sphere, Cylinder, Torus) rendered with optional ManimSurfaceFragment studio illumination and checkerboards" },
            { id: "features/arrow_demo", name: "Vector Arrows & Heads", description: "Customizable vector arrow caps and shafts" },
            { id: "features/box_layout_demo", name: "Auto-Layout (VBox & HBox)", description: "Automatic vertical and horizontal bounding-box stacking" },
            { id: "features/dynamic_plot", name: "Dynamic Plot Updates", description: "Live data streaming plot updater" },
            { id: "features/timescale", name: "Time Scale Control", description: "Global animation speed and rewind control" },
            { id: "features/multi_scene_isolation", name: "Multi-Scene Isolation", description: "Multiple isolated sub-scenes inside master viewport" },
            { id: "features/delay_demo", name: "Signal Delay Tracker", description: "Demonstrating Probes and interpolated historical tracking" },
            { id: "interaction/interactive_bezier", name: "Interactive N-Degree Bézier", description: "Real-time GPU compute-tessellated N-degree Bézier curve with interactive draggable control points and moving tangent/normal probe" },
        ]
    },
    {
        name: "Font & Typography",
        icon: "title",
        tag: "2d",
        demos: [
            { id: "font/google_font", name: "Google Font Loader", description: "Dynamic web font loading and glyph atlas generator" },
            { id: "font/msdf_font", name: "MSDF Multi-Channel SDF Font", description: "High quality multi-channel SDF font atlas" },
            { id: "text/code_demo", name: "Code Script Visualizer", description: "Manim-style code visualizer with syntax highlighting, line focus & typing animations" },
            { id: "text/text_split_demo", name: "Text Splitting Architecture", description: "Split Text & SDFText by words, lines, and chars with zero position drift" },
            { id: "text/markup_text_demo", name: "MarkupText: Inline & Block LaTeX", description: "Rich vector text flow layout with inline $...$ and display $$...$$ LaTeX math, automatic word-wrapping, and baseline alignment" },
        ]
    },
    {
        name: "Layout & Masking",
        icon: "layers",
        tag: "2d",
        demos: [
            { id: "layout/arrange_basic", name: "Arrange: Procedural Layouts", description: "1D sequence, 2D uniform grid, radial dial with tangent orientation, and parametric arch" },
            { id: "layout/arrange_reveal", name: "Arrange: Pattern Reveals", description: "Spatial introducer animations with diagonal sweep, radial outward, snake, and column reveals" },
            { id: "layout/arrange_ripple", name: "Arrange: Spatial Ripple", description: "Center-outward Euclidean distance waves modulating scale, elevation, and color" },
            { id: "layout/arrange_morph", name: "Arrange: Fluid Layout Transitions", description: "Smooth morphing between 2D grid, radial dial, parametric curve, and linear line" },
            { id: "layout/arrange_wave", name: "Arrange: Real-Time Dynamic Wave", description: "Frame-by-frame procedural height and gradient modulation via .onUpdate()" },
            { id: "layout/arrange_gpu_demo", name: "Arrange: 10,000 GPU Instances", description: "Hardware WebGPU storage-buffer instanced grid (1 single draw call) with real-time ripple wave" },
            { id: "layout/arrange_compute_wave", name: "Arrange: 65,536 WebGPU Compute Wave", description: "High-density 256x256 lattice modulated directly in GPU VRAM via WebGPU Compute Shader with multi-octave 3D waves" },
            { id: "layout/feature_layout", name: "Flexbox-style Layout", description: "Automatic bounding box layout engine" },
            { id: "layout/mask", name: "Vector Masking", description: "Using paths and shapes as alpha masks" },
            { id: "layout/mask_view", name: "Masked Video Container", description: "Clipping live video stream using 2D paths" },
            { id: "layout/zoom", name: "Zoom & Pan Viewport", description: "Infinite canvas zoom and camera pan navigation" },
        ]
    },
    {
        name: "Persistence & Draw",
        icon: "gesture",
        tag: "2d",
        demos: [
            { id: "persistence/persistence", name: "Framebuffer Persistence", description: "Infinite trail accumulation using feedback buffers" },
            { id: "persistence/persistent_draw", name: "Persistent Drawing Canvas", description: "Interactive painting canvas with brush feedback" },
        ]
    },
    {
        name: "Render Targets",
        icon: "filter_frames",
        tag: "compute",
        demos: [
            { id: "render_targets/offscreen_demo", name: "Offscreen (Minimap)", description: "Render-to-texture with dedicated ortho camera displayed on 3D TV" },
            { id: "render_targets/blur_demo", name: "Blur (Entity-Level)", description: "Isolated separable Gaussian blur on offscreen targets and sprites" },
            { id: "render_targets/blur_animation_demo", name: "Blur Animations", description: "First-class blurIn, blurOut, blurPulse, and blurTo animation primitives" },
            { id: "render_targets/persistent_demo", name: "Persistent (Paint Canvas)", description: "Accumulated brush trails using persistent pixel retention" },
            { id: "render_targets/feedback_demo", name: "Feedback (Infinite Mirror)", description: "Previous frame texture feedback creating Droste recursion effect" },
            { id: "render_targets/storage_demo", name: "Storage (GPU Plasma)", description: "Compute shader writing animated plasma directly to storage texture" },
            { id: "render_targets/pingpong_demo", name: "PingPong (Game of Life)", description: "Dual-buffer iterative GPU simulation of Conway's cellular automata" },
            { id: "render_targets/gbuffer_demo", name: "GBuffer (Deferred MRT)", description: "Multi-render-target G-Buffer visualization for deferred shading" },
        ]
    },
    {
        name: "Recreations & Games",
        icon: "sports_esports",
        tag: "physics",
        demos: [
            { id: "recreation/deformed_texture", name: "Deformed Earth Map Projection (3Blue1Brown)", description: "World map texture and coordinate grid undergoing sinusoidal, conformal, and vortex transformations" },
            { id: "recreation/deformed_video", name: "Deformed Video Projection (3Blue1Brown)", description: "Live playing MP4 video and coordinate grid deforming in 1:1 real-time synchronization" },
            { id: "recreation/deformed_image", name: "Deformed Image Projection (3Blue1Brown)", description: "Continuous 1:1 image and coordinate grid deformation with wave, swirl, and conformal mappings" },
            { id: "recreation/deformed_frog", name: "Deformed Coordinate Frog (3Blue1Brown)", description: "Non-linear spatial deformation of coordinate grids and tile entities (Manim-style)" },
            { id: "recreation/ball_collision", name: "Balls on Function |x|", description: "Bouncing physics balls inside absolute value curve" },
            { id: "recreation/maze", name: "Procedural Maze Generator", description: "Depth-first search maze generation animation" },
            { id: "recreation/maze_game", name: "Interactive Maze Game", description: "Playable WebGPU vector maze game" },
        ]
    },
    {
        name: "Tweaks & Benchmarks",
        icon: "speed",
        tag: "compute",
        demos: [
            { id: "tweaks/checkpoint_demo", name: "Scene State Checkpoints", description: "Benchmark and verification of user-defined scene state checkpoints" },
            { id: "tweaks/world_matrix", name: "World Matrix Benchmark", description: "Transform matrix multiplication stress test" },
            { id: "tweaks/buffer_relocation", name: "Buffer Relocation", description: "Dynamic GPU buffer resize and memory reallocation" },
            { id: "tweaks/garbage_collection_test", name: "Garbage Collection Test", description: "Memory allocation leak test" },
            { id: "tweaks/compute_limit_test", name: "Compute Limit Stress", description: "Pushing max workgroup limits on WebGPU" },
            { id: "tweaks/spatial_hash_test", name: "Spatial Hash Grid", description: "Fast broadphase spatial hashing collision test" },
            { id: "tweaks/framework_test", name: "Framework Lifecycle Test", description: "Engine scene mount/unmount lifecycle verification" },
            { id: "tweaks/video_pause_test", name: "Video Pause Sync", description: "Video texture synchronization test" },
            { id: "tweaks/physics_test", name: "Physics Solver Verification", description: "Internal constraint solver accuracy test" },
        ]
    },
    {
        name: "Modernize Engine",
        icon: "rocket_launch",
        tag: "2d",
        demos: [
            { id: "modernize/animation_fix", name: "Animation Update Pipeline", description: "Refactored animation engine update loop" },
            { id: "modernize/animation_sync", name: "Animation Synchronization & Options", description: "Phase-lagged cyclic motion using ordinary awaited plays and automatic completion-boundary handoffs." },
            { id: "modernize/dynamic_path", name: "Dynamic Path Updates", description: "Direct buffer sub-data updates for animated paths" },
            { id: "modernize/instance", name: "New Instance Architecture", description: "Simplified instanced rendering API" },
            { id: "modernize/circles", name: "Entity Sorting & Z-Index", description: "Depth sorting 2D entities by Z-index" },
        ]
    },
    {
        name: "System & Unit Tests",
        icon: "fact_check",
        tag: "2d",
        demos: [
            { id: "system/feedback", name: "Feedback Framebuffer", description: "Ping-pong double-buffering pass" },
            { id: "random/test_scene", name: "Random Scratchpad Test", description: "Experimental feature test" },
            { id: "test/clone", name: "Entity Clone Test", description: "Deep cloning scenes and entities" },
            { id: "test/transform", name: "Hierarchical Transform Test", description: "Nested parent transform verification" },
            { id: "test/equation", name: "Equation Transfer Test", description: "Math expression layout test" },
            { id: "test/matching_shape", name: "Shape Matching Interpolation", description: "Topology matching for shape morphing" },
            { id: "test/model_transform", name: "Model Matrix Verification", description: "Model-View-Projection matrix test" },
            { id: "test/boolean", name: "Vector Boolean Operations", description: "Path union, subtraction, and intersection" },
            { id: "test/paris30k", name: "Paris 30K High-Poly Test", description: "High polygon count stress test" },
            { id: "test/api_features_test", name: "New API Features Test (34 Fixes)", description: "Live integration test for all 34 API completeness improvements: FadeOut, Uncreate, GrowFromCenter, wait(), AnimOptions lifecycle, Group setters, Rate.steps/constant, Color.fromRGB/toHSL, AABB queries, Noise.fbm, Entity.dispose, Camera.reset, and more." },
        ]
    }
];

// App State Management
let currentDemoId = "";
let originalDemoCode = "";
let currentFilterTag = "all";
