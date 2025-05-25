import { ReactNode } from "react";
import Navbar from "./Navbar";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="content-container">{children}</main>
      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} GitHub Analytics</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
