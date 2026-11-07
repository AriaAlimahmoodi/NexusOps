import type { Chart as GeneratedChart, ChartElement as GeneratedChartElement } from '@daytona/toolbox-api-client';
export declare enum ChartType {
    LINE = "line",
    SCATTER = "scatter",
    BAR = "bar",
    PIE = "pie",
    BOX_AND_WHISKER = "box_and_whisker",
    COMPOSITE_CHART = "composite_chart",
    UNKNOWN = "unknown"
}
export type Chart = GeneratedChart;
export type ChartElement = GeneratedChartElement;
export type Chart2D = Pick<GeneratedChart, 'type' | 'title' | 'png' | 'x_label' | 'y_label' | 'elements'>;
export type PointChart = Pick<GeneratedChart, 'type' | 'title' | 'png' | 'x_label' | 'y_label' | 'x_ticks' | 'y_ticks' | 'x_tick_labels' | 'y_tick_labels' | 'x_scale' | 'y_scale' | 'elements'>;
export type LineChart = PointChart & {
    type: 'line';
};
export type ScatterChart = PointChart & {
    type: 'scatter';
};
export type BarChart = Chart2D & {
    type: 'bar';
};
export type PieChart = Pick<GeneratedChart, 'type' | 'title' | 'png' | 'elements'> & {
    type: 'pie';
};
export type BoxAndWhiskerChart = Chart2D & {
    type: 'box_and_whisker';
};
export type CompositeChart = Pick<GeneratedChart, 'type' | 'title' | 'png' | 'elements'> & {
    type: 'composite_chart';
};
export type PointData = Pick<GeneratedChartElement, 'label' | 'points'>;
export type BarData = Pick<GeneratedChartElement, 'group' | 'label' | 'value'>;
export type PieData = Pick<GeneratedChartElement, 'angle' | 'label' | 'radius'>;
export type BoxAndWhiskerData = Pick<GeneratedChartElement, 'first_quartile' | 'label' | 'max' | 'median' | 'min' | 'outliers'>;
export declare function parseChart(chart: GeneratedChart): Chart;
//# sourceMappingURL=Charts.d.ts.map