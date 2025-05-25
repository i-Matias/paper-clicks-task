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

  // Prepare data for chart
  const labels = limitedCounts.map((count) =>
    new Date(count.date).toLocaleDateString()
  );

  const data = {
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

  // Using any type to bypass strict type checking for chart configuration
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Commit History for ${repositoryName}`,
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return "";
            const index = items[0].dataIndex;
            return labels[index];
          },
          label: (item: any) => {
            return `Commits: ${item.raw}`;
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

  if (!commitCounts.length) {
    return (
      <div className="empty-chart">
        <p>No commit data available for this repository.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {chartType === "line" ? (
        <Line options={options} data={data} />
      ) : (
        <Bar options={options} data={data} />
      )}
    </div>
  );
};

export default CommitChart;
