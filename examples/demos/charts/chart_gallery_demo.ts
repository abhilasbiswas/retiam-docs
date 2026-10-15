import { Scene, Camera2DController, SDFText, CENTER, FadeOut, Rate, hex } from "retiam";
import { BarChart, PieChart, AreaChart, DarkModernTheme } from "retiam/charts";
import { frameStage } from "../../shared/presentation";

/** Give each chart the whole stage so marks, values, and hover targets stay legible. */
export default class ChartGalleryScene extends Scene {
    public async run() {
        this.camera.position.set([0, 0, 25]);
        frameStage(this, 36, 25);
        new Camera2DController(this, this.camera, { zoom: this.camera.orthoScale });

        const theme = {
            ...DarkModernTheme,
            colors: [hex("#38bdf8"), hex("#7dd3fc"), hex("#f59e0b"), hex("#bae6fd")],
            gridColor: hex("#334155", 0.35),
            subtitleColor: hex("#94a3b8"),
        };
        const title = new SDFText("Quarterly revenue", {
            fontSize: 1.1, anchor: CENTER, fill: hex("#f8fafc"),
        }).move([0, 9.6, 0]);
        const subtitle = new SDFText("Compare categories, then watch the data change", {
            fontSize: 0.48, anchor: CENTER, fill: hex("#94a3b8"),
        }).move([0, 8.2, 0]);
        this.add(title, subtitle);

        const barChart = new BarChart({
            width: 24, height: 13, theme, showCard: false,
            showValues: true, valuePrefix: "$", valueSuffix: "M",
            data: [
                { category: "Q1", value: 42 },
                { category: "Q2", value: 68 },
                { category: "Q3", value: 55 },
                { category: "Q4", value: 96 },
                { category: "Q5", value: 84 },
            ],
        });
        barChart.move([0, -1, 0]);
        this.add(barChart);
        await this.play(barChart.animateIn({ duration: 1400 }));
        await this.wait(1200);
        await this.play(barChart.animateData([
            { category: "Q1", value: 60 },
            { category: "Q2", value: 88 },
            { category: "Q3", value: 48 },
            { category: "Q4", value: 115 },
            { category: "Q5", value: 102 },
        ], { duration: 1400, rate_func: Rate.easeInOutCubic() }));
        await this.wait(1200);
        await this.play(new FadeOut(barChart, { duration: 450 }));
        this.remove(barChart);

        title.text = "Cluster utilization";
        subtitle.text = "A whole, divided into four workloads";
        const pieChart = new PieChart({
            width: 24, height: 13, theme, showCard: false,
            outerRadius: 4.5, innerRadius: 2.5,
            centerValue: "100%", centerLabel: "CAPACITY", explodedOffset: 0.45,
            data: [
                { label: "AI Training", value: 42 },
                { label: "Inference", value: 28 },
                { label: "Web Services", value: 18 },
                { label: "Storage", value: 12 },
            ],
        });
        pieChart.centerGroup.children.forEach(label => { label.anchor = CENTER; });
        pieChart.move([0, -1, 0]);
        this.add(pieChart);
        await this.play(pieChart.animateIn({ duration: 1400 }));
        await this.wait(2200);
        await this.play(new FadeOut(pieChart, { duration: 450 }));
        this.remove(pieChart);

        title.text = "Network throughput";
        subtitle.text = "Follow the signal over time · bandwidth in Gbps";
        const areaChart = new AreaChart({
            width: 26, height: 12, theme, showCard: false,
            fillOpacity: 0.18, showDots: true,
            yLabelFormatter: value => `${value}G`,
            xLabelFormatter: value => `+${value}s`,
            series: [{
                name: "Primary fiber", color: hex("#38bdf8"),
                data: [
                    { x: 0, y: 18 }, { x: 2, y: 32 }, { x: 4, y: 26 },
                    { x: 6, y: 48 }, { x: 8, y: 42 }, { x: 10, y: 65 },
                    { x: 12, y: 58 }, { x: 14, y: 84 }, { x: 16, y: 76 },
                    { x: 18, y: 92 }, { x: 20, y: 88 },
                ],
            }],
        });
        areaChart.move([0, -1, 0]);
        this.add(areaChart);
        await this.play(areaChart.animateIn({ duration: 1800 }));
        await this.wait(2500);
    }
}
