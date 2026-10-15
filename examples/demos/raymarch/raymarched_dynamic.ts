import { Scene, Color, Text, CameraController, Rate, createBuffer, RaymarchedPlot3D, ThreeDAxes, Usage, OrbitCameraController } from "retiam";
import { demoBackground } from "../../shared/presentation";

export default class DynamicPlotScene extends Scene {
    public async run() {
        this.clearColor(demoBackground());
        // 1. Setup Axes
        this.camera.position = [0, 10, 20];
        new OrbitCameraController(this, this.camera)
        const axes = new ThreeDAxes({
            xRange: [-5, 5, 1], zRange: [-5, 5, 1], yRange: [-1, 1, 1]
        });
        this.add(axes);

        // 2. Create your dynamic data buffer (e.g., an animated ripple properties struct)
        // [time, frequency, amplitude, padding] -> 16 bytes
        const dynamicData = new Float32Array([0.0, 3.0, 0.5, 0.0]);
        const waveBuffer = createBuffer(this.device, Usage.USAGE_UNIFORM | GPUBufferUsage.COPY_DST, dynamicData);

        // 3. Define the Plot using custom structs
        const plot = new RaymarchedPlot3D(axes,
            `
            // You can now access your custom uniform directly in the equation!
            let dist = sqrt(x*x + z*z);
            return sin(dist * waveProps.freq - waveProps.time) * waveProps.amp*0.25;
            `,
            {
                userFunctions: `
                    // Define the struct mapping for WebGPU
                    struct WaveProperties {
                        time: f32,
                        freq: f32,
                        amp: f32,
                        pad: f32
                    };
                `,
                showGrid: false
            }
        );

        // 4. Bind the GPU Buffer cleanly
        // The ShaderBuilder will automatically write: `@group(3) @binding(X) var<uniform> waveProps: WaveProperties;`
        plot.setUniformBuffer("waveProps", "WaveProperties", waveBuffer);
        this.add(plot);

        // 5. Update data on the CPU without recompiling the shader!
        this.always(() => {
            dynamicData[0] = this.time * 0.005; // Update time
            this.device.queue.writeBuffer(waveBuffer, 0, dynamicData);
            this.invalidate();
        });
    }
}
