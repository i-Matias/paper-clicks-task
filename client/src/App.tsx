import "./App.css";
import ToastContainer from "./components/toast-container";
import Content from "./navigation/Content";
import { AnimatePresence } from "framer-motion";

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Content />
      <ToastContainer />
    </AnimatePresence>
  );
}
