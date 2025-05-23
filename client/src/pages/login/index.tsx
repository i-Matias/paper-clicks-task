import "./style.css";

export default function Login() {
  const handleLogin = () => {
    // window.location.assign(
    //   "https://github.com/login/oauth/authorize?client_id=" +
    //     process.env.GITHUB_CLIENT_ID
    // );
    window.location.href = "http://localhost:5000/api/auth/github";
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to GitHub Auth App</h1>
        <button className="login-button" onClick={handleLogin}>
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
