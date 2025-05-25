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

// Register Chart.js components
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

/**
 * Interface for commit count data point
 */
interface CommitCount {
  id: string;
  count: number;
  date: string;
}

/**
 * Props for the CommitChart component
 */
interface CommitChartProps {
  /** Array of commit counts to display */
  commitCounts: CommitCount[];
  /** Name of the repository */
  repositoryName: string;
  /** Type of chart to display */
  chartType?: "line" | "bar";
}

/**
 * A component that displays commit activity data in chart form
 */
const CommitChart: React.FC<CommitChartProps> = ({
  commitCounts,
  repositoryName,
  chartType = "line",
}) => {
  // Early return if no data is available
  if (!commitCounts.length) {
    return (
      <div className="empty-chart">
        <p>No commit data available for this repository.</p>
      </div>
    );
  }

  // Sort commit counts by date
  const sortedCounts = [...commitCounts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Limit the number of data points to improve readability
  const maxDataPoints = 20;
  const limitedCounts =
    sortedCounts.length > maxDataPoints
      ? sortedCounts.slice(sortedCounts.length - maxDataPoints)
      : sortedCounts;

  // Prepare data for chart - format dates for display
  const labels = limitedCounts.map((count) =>
    new Date(count.date).toLocaleDateString()
  );

  // Configure chart data
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

  // Configure chart options
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

  // Render the appropriate chart type
  return (
    <div className="chart-container">
      {chartType === "line" ? (
        <Line options={chartOptions} data={chartData} />
      ) : (
        <Bar options={chartOptions} data={chartData} />
      )}
    </div>
  );
};

export default CommitChart;
