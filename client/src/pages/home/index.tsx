import StarredRepositories from "../../components/starred-repositories";
import useAuthStore from "../../stores/useAuthStore";
import LoadingSpinner from "../../components/loading-spinner";
import "./style.css";

export default function Home() {
  const { user: storedUser } = useAuthStore();

  if (!storedUser) {
    return <LoadingSpinner message="Loading application data..." />;
  }

  return (
    <div className="home-container">
      <div className="home-section repositories-section">
        <div className="home-header">
          <h2 className="section-title">Repository Analysis</h2>
        </div>
        <StarredRepositories />
      </div>
    </div>
  );
}
