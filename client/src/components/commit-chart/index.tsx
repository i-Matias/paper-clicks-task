import React, { useState, useMemo } from "react";
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
  const [dateRange, setDateRange] = useState<
    "all" | "30days" | "90days" | "180days" | "365days"
  >("90days");

  const sortedCounts = useMemo(
    () =>
      [...commitCounts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [commitCounts]
  );

  const filteredCounts = useMemo(() => {
    if (dateRange === "all") return sortedCounts;

    const today = new Date();
    let daysToSubtract = 0;

    switch (dateRange) {
      case "30days":
        daysToSubtract = 30;
        break;
      case "90days":
        daysToSubtract = 90;
        break;
      case "180days":
        daysToSubtract = 180;
        break;
      case "365days":
        daysToSubtract = 365;
        break;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - daysToSubtract);

    return sortedCounts.filter((count) => new Date(count.date) >= cutoffDate);
  }, [sortedCounts, dateRange]);

  if (!commitCounts.length) {
    return (
      <div className="empty-chart">
        <p>No commit data available for this repository.</p>
      </div>
    );
  }

  const labels = filteredCounts.map((count) =>
    new Date(count.date).toLocaleDateString()
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Commit Count",
        data: filteredCounts.map((count) => count.count),
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
      <div className="date-range-selector">
        <label htmlFor="date-range">Date Range: </label>
        <select
          id="date-range"
          value={dateRange}
          onChange={(e) =>
            setDateRange(
              e.target.value as
                | "all"
                | "30days"
                | "90days"
                | "180days"
                | "365days"
            )
          }
          className="date-range-dropdown"
        >
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="180days">Last 180 Days</option>
          <option value="365days">Last Year</option>
          <option value="all">All Time</option>
        </select>
        <span className="commit-count-info">
          Showing {filteredCounts.length} days of commits
          {filteredCounts.length < sortedCounts.length &&
            ` (${sortedCounts.length} total)`}
        </span>
      </div>
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
