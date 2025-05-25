import { useState, useMemo } from "react";
import repositoryService, {
  type Repository,
} from "../../services/repository.service";
import { useFetch } from "../../hooks/useFetch";
import CommitChart from "../commit-chart";
import "./styles.css";

/**
 * Component that displays a user's starred GitHub repositories and commit activity
 */
const StarredRepositories: React.FC = () => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  // Fetch repositories data
  const { data: repositories, loading } = useFetch<Repository[]>(
    repositoryService.getStarredRepositories,
    {
      transformData: (data: unknown) => {
        // Cast data to Repository[] since we know the type from API
        const repos = data as Repository[];

        // Auto-select the first repository with commit data
        if (repos.length > 0 && !selectedRepoId) {
          const repoWithCommits = repos.find(
            (repo) => repo.commitCounts && repo.commitCounts.length > 0
          );
          if (repoWithCommits) {
            setSelectedRepoId(repoWithCommits.id);
          }
        }
        return repos;
      },
      showErrorNotification: false,
    }
  );

  // Create a memoized safe list to avoid re-rendering issues
  const reposList = useMemo(() => repositories || [], [repositories]);

  // Find the currently selected repository
  const selectedRepo = useMemo(
    () => reposList.find((repo) => repo.id === selectedRepoId),
    [reposList, selectedRepoId]
  );

  // Find repositories that have commit data
  const reposWithCommits = useMemo(
    () =>
      reposList.filter(
        (repo) => repo.commitCounts && repo.commitCounts.length > 0
      ),
    [reposList]
  );

  // Handle repository selection change
  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRepoId(e.target.value || null);
  };

  // Handle chart type toggle
  const handleChartTypeToggle = (type: "line" | "bar") => {
    setChartType(type);
  };

  if (loading) {
    return <div className="repositories-loading">Loading repositories...</div>;
  }

  return (
    <div className="repositories-container">
      <div className="repositories-header">
        <h2>Starred GitHub Repositories</h2>
      </div>

      {reposList.length === 0 ? (
        <EmptyStateMessage />
      ) : (
        <>
          <RepositoriesList repositories={reposList} />
          <CommitVisualizationSection
            reposWithCommits={reposWithCommits}
            selectedRepo={selectedRepo}
            selectedRepoId={selectedRepoId}
            chartType={chartType}
            onRepoChange={handleRepoChange}
            onChartTypeToggle={handleChartTypeToggle}
          />
        </>
      )}
    </div>
  );
};

/**
 * Message shown when user has no starred repositories
 */
const EmptyStateMessage: React.FC = () => (
  <div className="no-repositories">
    <p>You haven't starred any GitHub repositories yet.</p>
  </div>
);

/**
 * List of repositories
 */
interface RepositoriesListProps {
  repositories: Repository[];
}

const RepositoriesList: React.FC<RepositoriesListProps> = ({
  repositories,
}) => (
  <div className="repositories-simple-list">
    {repositories.map((repo) => (
      <div key={repo.id} className="repository-list-item">
        <a href={repo.url} target="_blank" rel="noopener noreferrer">
          {repo.fullName}
        </a>
        {repo.description && (
          <p className="repository-description">{repo.description}</p>
        )}
      </div>
    ))}
  </div>
);

/**
 * Section for commit visualization
 */
interface CommitVisualizationSectionProps {
  reposWithCommits: Repository[];
  selectedRepo: Repository | undefined;
  selectedRepoId: string | null;
  chartType: "line" | "bar";
  onRepoChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onChartTypeToggle: (type: "line" | "bar") => void;
}

const CommitVisualizationSection: React.FC<CommitVisualizationSectionProps> = ({
  reposWithCommits,
  selectedRepo,
  selectedRepoId,
  chartType,
  onRepoChange,
  onChartTypeToggle,
}) => {
  return (
    <div className="commit-visualization-section">
      <h3>Commit Visualization</h3>

      <div className="repository-selector">
        <label htmlFor="repo-select">
          Select a repository to view commits:
        </label>
        <div className="select-wrapper">
          <select
            id="repo-select"
            value={selectedRepoId || ""}
            onChange={onRepoChange}
            className="repository-select"
            data-has-content={Boolean(selectedRepoId)}
          >
            {reposWithCommits.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {selectedRepo && selectedRepo.commitCounts.length > 0 && (
          <div className="chart-toggle">
            <label>Chart Type:</label>
            <button
              className={chartType === "line" ? "active" : ""}
              onClick={() => onChartTypeToggle("line")}
            >
              Line
            </button>
            <button
              className={chartType === "bar" ? "active" : ""}
              onClick={() => onChartTypeToggle("bar")}
            >
              Bar
            </button>
          </div>
        )}
      </div>

      <div className="commit-chart-container">
        {selectedRepo && selectedRepo.commitCounts.length > 0 ? (
          <div className="commit-chart">
            <CommitChart
              commitCounts={selectedRepo.commitCounts}
              repositoryName={selectedRepo.name}
              chartType={chartType}
            />
          </div>
        ) : selectedRepo ? (
          <p className="no-commits">
            No commit data available for this repository.
          </p>
        ) : (
          <p className="no-repo-selected">
            Please select a repository to view commit data.
          </p>
        )}
      </div>
    </div>
  );
};

export default StarredRepositories;
