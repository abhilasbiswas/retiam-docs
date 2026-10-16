// npx retiam render reads this file from the project root.
// Command-line flags override these values. retiam.config.js takes priority if present.
export default {
    // Video output
    fps: 60,
    width: 1920,
    height: 1080,
    videoBitrate: '20M',
    outputFormat: 'mp4',
    outputDir: './outputs/video',
    maxDuration: 0, // Milliseconds; 0 renders until the scene finishes.

    // Local render servers and optional recorded input
    devServerPort: 5173,
    wsPort: 5001,
    replayFile: null, // Path to an input replay JSON file, relative to this folder.

    // Anti-aliasing and transparency
    AA_Function: 'ssaa', // 'ssaa' or 'bilinear'
    AA: 2, // Supersampling scale
    sample_count: 4, // WebGPU MSAA samples: 1 or 4
    PPLL: 0, // 0: disabled, 1: global, 2: local order-independent transparency
    max_layers: 8,

    // Shadows and visibility
    shadowsEnabled: true,
    shadowMethod: 'pcss', // 'pcss' or 'pcf'
    lightSize: 2.5,
    frustumCulling: true,

    // Raytracing
    raytraceEnabled: false,
    rtSamples: 2,
    rtMaxAccumulation: 64,
    bvhMethod: 'sah', // 'sah' or 'spatial'
    gamma: 1 / 2.5,
    bounce_count: 5,

    // Denoising (used with raytracing)
    denoiser: 'oidn', // 'none', 'spatial', 'oidn', or 'native'
    oidnModel: 'rt_hdr_alb_nrm',
};
