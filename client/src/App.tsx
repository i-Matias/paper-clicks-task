import { useEffect } from "react";
import Content from "./navigation/Content";
import { useAutoLogin } from "./hooks/useAutoLogin";
import "./App.css";

export default function App() {
  const { isAuthenticated } = useAutoLogin();

  useEffect(() => {
    console.log(
      "Authentication status:",
      isAuthenticated ? "Authenticated" : "Not authenticated"
    );
  }, [isAuthenticated]);

  return <Content />;
}
