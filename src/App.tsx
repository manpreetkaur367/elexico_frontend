import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Gatekeeper from "./components/Gatekeeper";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!unlocked ? (
        <motion.div
          key="gate"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Gatekeeper onUnlock={() => setUnlocked(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ height: "100vh" }}
        >
          <Dashboard onExit={() => setUnlocked(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
