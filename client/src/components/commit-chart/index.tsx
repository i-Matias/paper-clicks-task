import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  type TooltipItem,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import "./styles.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CommitCount {
  id: string;
  count: number;
  date: string;
}

interface CommitChartProps {
  commitCounts: CommitCount[];
  repositoryName: string;
  chartType?: "line" | "bar";
}

const CommitChart: React.FC<CommitChartProps> = ({
  commitCounts,
  repositoryName,
  chartType = "line",
}) => {
  if (!commitCounts.length) {
    return (
      <div className="empty-chart">
        <p>No commit data available for this repository.</p>
      </div>
    );
  }

  const sortedCounts = [...commitCounts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const maxDataPoints = 20;
  const limitedCounts =
    sortedCounts.length > maxDataPoints
      ? sortedCounts.slice(sortedCounts.length - maxDataPoints)
      : sortedCounts;

  const labels = limitedCounts.map((count) =>
    new Date(count.date).toLocaleDateString()
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Commit Count",
        data: limitedCounts.map((count) => count.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Commit History for ${repositoryName}`,
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<"line" | "bar">[]) => {
            if (!context.length) return "";
            const index = context[0].dataIndex;
            return labels[index];
          },
          label: (context: TooltipItem<"line" | "bar">) => {
            return `Commits: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Commits",
        },
        ticks: {
          precision: 0, // Only show integer values
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-wrapper">
        {chartType === "line" ? (
          <Line options={chartOptions} data={chartData} />
        ) : (
          <Bar options={chartOptions} data={chartData} />
        )}
      </div>
    </div>
  );
};

export default CommitChart;
