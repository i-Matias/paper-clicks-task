import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import "./Layout.css";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const AnimatedLayout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          className="content-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 50,
            damping: 20,
          }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="footer-content">
          <p>© {new Date().getFullYear()} GitHub Analytics</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default AnimatedLayout;
