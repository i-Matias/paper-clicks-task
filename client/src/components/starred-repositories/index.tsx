import { useState, useEffect } from "react";
import repositoryService, {
  type Repository,
} from "../../services/repository.service";
import CommitChart from "../commit-chart";
import "./styles.css";

interface StarredRepositoriesProps {
  onError?: (error: string) => void;
}

const StarredRepositories: React.FC<StarredRepositoriesProps> = ({
  onError,
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const repos = await repositoryService.getStarredRepositories();
        setRepositories(repos);

        // If repositories are loaded and there's at least one with commit data,
        // select the first one for the chart
        if (repos.length > 0) {
          const repoWithCommits = repos.find(
            (repo) => repo.commitCounts && repo.commitCounts.length > 0
          );
          if (repoWithCommits) {
            setSelectedRepoId(repoWithCommits.id);
          }
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
        if (onError) onError("Failed to load repositories");
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [onError]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage("Syncing commit counts...");
      const result = await repositoryService.syncCommitCounts();
      setSyncMessage(result.message);

      // Refresh repositories after sync
      const repos = await repositoryService.getStarredRepositories();
      setRepositories(repos);
    } catch (error) {
      console.error("Error syncing commits:", error);
      setSyncMessage("Failed to sync commit counts");
      if (onError) onError("Failed to sync commit counts");
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
    }
  };

  // Find the currently selected repository
  const selectedRepo = repositories.find((repo) => repo.id === selectedRepoId);

  // Track dropdown state for animations
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add keyboard handler for better accessibility
  const handleSelectKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      // Let the browser handle the dropdown opening
      return;
    }

    // Allow quick selection with first letter
    const key = e.key.toLowerCase();
    if (key.length === 1 && key.match(/[a-z0-9]/)) {
      const filteredRepos = repositories.filter(
        (repo) => repo.commitCounts && repo.commitCounts.length > 0
      );

      const matchingRepo = filteredRepos.find((repo) =>
        repo.name.toLowerCase().startsWith(key)
      );

      if (matchingRepo) {
        setSelectedRepoId(matchingRepo.id);
      }
    }
  };

  // Handle dropdown focus events
  const handleSelectFocus = () => setIsDropdownOpen(true);
  const handleSelectBlur = () => setIsDropdownOpen(false);

  if (loading) {
    return <div className="repositories-loading">Loading repositories...</div>;
  }

  return (
    <div className="repositories-container">
      <div className="repositories-header">
        <h2>Starred GitHub Repositories</h2>
        <button onClick={handleSync} disabled={syncing} className="sync-button">
          {syncing ? "Syncing..." : "Sync Commit Counts"}
        </button>
        {syncMessage && <div className="sync-message">{syncMessage}</div>}
      </div>

      {repositories.length === 0 ? (
        <div className="no-repositories">
          <p>You haven't starred any GitHub repositories yet.</p>
        </div>
      ) : (
        <>
          {/* Simple Repository List */}
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

          {/* Chart Section */}
          <div className="commit-visualization-section">
            <h3>Commit Visualization</h3>

            {/* Repository Selector */}
            <div className="repository-selector">
              <label htmlFor="repo-select">
                Select a repository to view commits:
              </label>
              <div
                className={`select-wrapper ${isDropdownOpen ? "active" : ""}`}
              >
                <select
                  id="repo-select"
                  value={selectedRepoId || ""}
                  onChange={(e) => setSelectedRepoId(e.target.value || null)}
                  onKeyDown={handleSelectKeyDown}
                  onFocus={handleSelectFocus}
                  onBlur={handleSelectBlur}
                  className="modern-select"
                  data-has-content={Boolean(selectedRepoId)}
                >
                  <option value="">-- Select a repository --</option>
                  {repositories
                    .filter(
                      (repo) =>
                        repo.commitCounts && repo.commitCounts.length > 0
                    )
                    .map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Chart Type Toggle */}
              {selectedRepo && selectedRepo.commitCounts.length > 0 && (
                <div className="chart-toggle">
                  <label>Chart Type:</label>
                  <button
                    className={chartType === "line" ? "active" : ""}
                    onClick={() => setChartType("line")}
                  >
                    Line
                  </button>
                  <button
                    className={chartType === "bar" ? "active" : ""}
                    onClick={() => setChartType("bar")}
                  >
                    Bar
                  </button>
                </div>
              )}
            </div>

            {/* Chart Display */}
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
                  No commit data available for this repository. Use the Sync
                  button to fetch commit counts.
                </p>
              ) : (
                <p className="no-repo-selected">
                  Please select a repository to view commit data.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StarredRepositories;
