// filepath: /Users/matiasposhnjari/Documents/paper-clicks-task/client/src/components/starred-repositories/index.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import repositoryService, {
  type Repository,
} from "../../services/repository.service";
import { useFetch } from "../../hooks/useFetch";
import CommitChart from "../commit-chart";
import { motion, AnimatePresence } from "framer-motion";
import "./styles.css";

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
      <motion.label
        htmlFor={id}
        className="custom-select-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.label>
      <motion.div
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
        whileHover={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div className="custom-select-value">
          {selectedOption ? selectedOption.name : "Select repository"}
        </motion.div>
        <motion.div
          className="custom-select-icon"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              className="custom-select-options"
              role="listbox"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {options.map((option, index) => (
                <motion.li
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
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  whileHover={{
                    backgroundColor: "rgba(9, 105, 218, 0.1)",
                    x: 2,
                  }}
                >
                  {option.name}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>
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
    return (
      <motion.div
        className="repositories-loading"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          scale: [1, 1.02, 1],
        }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { repeat: Infinity, duration: 1.5 },
        }}
      >
        Loading repositories...
      </motion.div>
    );
  }

  return (
    <motion.div
      className="repositories-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="repositories-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2>Starred GitHub Repositories</h2>
      </motion.div>

      <AnimatePresence mode="wait">
        {reposList.length === 0 ? (
          <EmptyStateMessage key="empty" />
        ) : (
          <motion.div
            className="repositories-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            key="content"
          >
            <RepositoriesList repositories={reposList} />
            <CommitVisualizationSection
              reposWithCommits={reposWithCommits}
              selectedRepo={selectedRepo}
              selectedRepoId={selectedRepoId}
              chartType={chartType}
              onRepoChange={handleRepoChange}
              onChartTypeToggle={handleChartTypeToggle}
              allRepositories={reposList}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EmptyStateMessage: React.FC = () => (
  <motion.div
    className="no-repositories"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      You haven't starred any GitHub repositories yet.
    </motion.p>
  </motion.div>
);

interface RepositoriesListProps {
  repositories: Repository[];
}

const RepositoriesList: React.FC<RepositoriesListProps> = ({
  repositories,
}) => (
  <div className="repositories-grid">
    {repositories.map((repo, index) => (
      <motion.div
        key={repo.id}
        className="repository-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.5,
          type: "spring",
          stiffness: 100,
        }}
        whileHover={{
          scale: 1.03,
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <motion.div
          className="repository-card-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="repository-name"
          >
            {repo.fullName}
          </a>
        </motion.div>
        {repo.description && (
          <motion.p
            className="repository-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.4 }}
          >
            {repo.description}
          </motion.p>
        )}
        <motion.div
          className="repository-card-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.5 }}
        >
          <motion.a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="view-repo-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Repository
          </motion.a>
        </motion.div>
      </motion.div>
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
  allRepositories: Repository[];
}

const CommitVisualizationSection: React.FC<CommitVisualizationSectionProps> = ({
  selectedRepo,
  selectedRepoId,
  chartType,
  onRepoChange,
  onChartTypeToggle,
  allRepositories,
  reposWithCommits,
}) => {
  return (
    <motion.div
      className="commit-visualization-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4,
        duration: 0.6,
        type: "spring",
        stiffness: 70,
      }}
    >
      <motion.div
        className="visualization-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3>Commit Visualization</h3>

        {selectedRepo && selectedRepo.commitCounts.length > 0 && (
          <motion.div
            className="chart-toggle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            <motion.button
              className={`toggle-btn ${chartType === "line" ? "active" : ""}`}
              onClick={() => onChartTypeToggle("line")}
              aria-label="Show line chart"
              title="Line Chart"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="toggle-icon line-icon"></span>
            </motion.button>
            <motion.button
              className={`toggle-btn ${chartType === "bar" ? "active" : ""}`}
              onClick={() => onChartTypeToggle("bar")}
              aria-label="Show bar chart"
              title="Bar Chart"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="toggle-icon bar-icon"></span>
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="repository-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <CustomSelect
          id="repo-select"
          options={allRepositories.map((repo) => ({
            id: repo.id,
            name: `${repo.fullName}${
              !repo.commitCounts || repo.commitCounts.length === 0
                ? " (No commit data)"
                : ""
            }`,
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
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedRepo && selectedRepo.commitCounts.length > 0 ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <CommitChart
              commitCounts={selectedRepo.commitCounts}
              repositoryName={selectedRepo.fullName}
              chartType={chartType}
            />
          </motion.div>
        ) : (
          <motion.div
            className="no-commits-message"
            key="no-data"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            {selectedRepo ? (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                No commit data available for this repository.
              </motion.p>
            ) : (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Select a repository to view commit data.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StarredRepositories;
