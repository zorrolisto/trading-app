import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

export default function Chart({
  options,
  data,
}: {
  options: ApexOptions;
  data: ApexAxisChartSeries;
}) {
  return (
    <ReactApexChart
      options={options}
      series={data}
      type="candlestick"
      height={380}
    />
  );
}
