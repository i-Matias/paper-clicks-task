import { useState, useMemo, useRef, useEffect } from "react";
import repositoryService, {
  type Repository,
} from "../../services/repository.service";
import { useFetch } from "../../hooks/useFetch";
import CommitChart from "../commit-chart";
import "./styles.css";

// Custom Select Component
interface CustomSelectProps {
  options: { id: string; name: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("click", handler);
    return () => {
      window.removeEventListener("click", handler);
    };
  }, []);

  // Reset highlighted index when options change or dropdown opens
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex((option) => option.id === value);
      if (selectedIndex >= 0) {
        setHighlightedIndex(selectedIndex);
      } else {
        setHighlightedIndex(0);
      }
    }
  }, [isOpen, options, value]);

  const handleOptionClick = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      setIsOpen((prev) => !prev);
      if (isOpen && options[highlightedIndex]) {
        onChange(options[highlightedIndex].id);
        setIsOpen(false);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      const newIndex = highlightedIndex + (e.key === "ArrowDown" ? 1 : -1);
      if (newIndex >= 0 && newIndex < options.length) {
        setHighlightedIndex(newIndex);
      }
    }
  };

  return (
    <div className="custom-select-container" ref={selectRef}>
      <label htmlFor={id} className="custom-select-label">
        {label}
      </label>
      <div
        className={`custom-select ${isOpen ? "open" : ""}`}
        tabIndex={0}
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        role="combobox"
        aria-labelledby={id}
        data-has-content={Boolean(value)}
      >
        <div className="custom-select-value">
          {selectedOption ? selectedOption.name : "Select repository"}
        </div>
        <div className="custom-select-icon"></div>
        {isOpen && (
          <ul className="custom-select-options" role="listbox">
            {options.map((option, index) => (
              <li
                key={option.id}
                className={`custom-select-option ${
                  option.id === value ? "selected" : ""
                } ${index === highlightedIndex ? "highlighted" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(option.id);
                }}
                role="option"
                aria-selected={option.id === value}
              >
                {option.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StarredRepositories: React.FC = () => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  const { data: repositories, loading } = useFetch<Repository[]>(
    repositoryService.getStarredRepositories,
    {
      transformData: (data: unknown) => {
        const repos = data as Repository[];

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

  const reposList = useMemo(() => repositories || [], [repositories]);

  const selectedRepo = useMemo(
    () => reposList.find((repo) => repo.id === selectedRepoId),
    [reposList, selectedRepoId]
  );

  const reposWithCommits = useMemo(
    () =>
      reposList.filter(
        (repo) => repo.commitCounts && repo.commitCounts.length > 0
      ),
    [reposList]
  );

  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRepoId(e.target.value || null);
  };

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

const EmptyStateMessage: React.FC = () => (
  <div className="no-repositories">
    <p>You haven't starred any GitHub repositories yet.</p>
  </div>
);

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
        <div className="select-wrapper">
          <CustomSelect
            id="repo-select"
            options={reposWithCommits.map((repo) => ({
              id: repo.id,
              name: repo.fullName,
            }))}
            value={selectedRepoId}
            onChange={(value) => {
              const syntheticEvent = {
                target: { value },
              } as React.ChangeEvent<HTMLSelectElement>;
              onRepoChange(syntheticEvent);
            }}
            label="Select a repository to view commits:"
          />
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
